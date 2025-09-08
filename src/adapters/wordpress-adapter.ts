/**
 * WordPress adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';
import { WordPressConfig, APIResponse, RequestOptions } from '../types/config';
import { AIContent, PublishResult, Collection, CollectionField } from '../types/content';

export class WordPressAdapter {
  private client: AxiosInstance;
  private config: WordPressConfig;

  constructor(config: WordPressConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with WordPress configuration
   */
  private createClient(): AxiosInstance {
    const auth = Buffer.from(`${this.config.username}:${this.config.password}`).toString('base64');
    
    return axios.create({
      baseURL: `${this.config.siteUrl}/${this.config.apiVersion || 'wp/v2'}`,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
  }

  /**
   * Test the connection to WordPress
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get('/users/me');
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Get available post types (collections equivalent)
   */
  async getCollections(): Promise<APIResponse<Collection[]>> {
    try {
      const response = await this.client.get('/types');
      
      const collections: Collection[] = Object.values(response.data)
        .filter((type: any) => type.rest_base) // Only include types accessible via REST
        .map((type: any) => ({
          id: type.slug,
          name: type.name,
          slug: type.slug,
          platform: 'wordpress' as const,
          fields: this.getWordPressFields(type.slug)
        }));

      return {
        success: true,
        data: collections,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Get categories
   */
  async getCategories(): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get('/categories');
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Get tags
   */
  async getTags(): Promise<APIResponse<any[]>> {
    try {
      const response = await this.client.get('/tags');
      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Publish content to WordPress
   */
  async publishContent(content: AIContent, options?: RequestOptions): Promise<PublishResult> {
    try {
      // Determine the post type (default to 'posts')
      const postType = this.determinePostType(content);
      
      // Map content to WordPress format
      const wpData = await this.mapContentToWordPress(content);

      // Create the post
      const response = await this.client.post(
        `/${postType}`,
        wpData,
        { timeout: options?.timeout }
      );

      // Handle featured image if provided
      if (content.images && content.images.length > 0) {
        await this.setFeaturedImage(response.data.id, content.images[0], postType);
      }

      return {
        success: true,
        platform: 'wordpress',
        contentId: response.data.id.toString(),
        url: response.data.link,
        message: 'Content published successfully to WordPress',
        publishedAt: new Date(response.data.date)
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'wordpress',
        message: 'Failed to publish content to WordPress',
        errors: [error.response?.data?.message || error.message]
      };
    }
  }

  /**
   * Update existing content in WordPress
   */
  async updateContent(contentId: string, content: Partial<AIContent>, postType: string = 'posts'): Promise<PublishResult> {
    try {
      // Map partial content to WordPress format
      const wpData = await this.mapPartialContentToWordPress(content);

      // Update the post
      const response = await this.client.patch(
        `/${postType}/${contentId}`,
        wpData
      );

      return {
        success: true,
        platform: 'wordpress',
        contentId: response.data.id.toString(),
        url: response.data.link,
        message: 'Content updated successfully in WordPress',
        publishedAt: new Date(response.data.modified)
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'wordpress',
        message: 'Failed to update content in WordPress',
        errors: [error.response?.data?.message || error.message]
      };
    }
  }

  /**
   * Upload media to WordPress
   */
  async uploadMedia(imageUrl: string, filename?: string): Promise<APIResponse<any>> {
    try {
      // Fetch the image
      const imageResponse = await axios.get(imageUrl, { responseType: 'stream' });
      
      // Create form data
      const formData = new FormData();
      formData.append('file', imageResponse.data, filename || 'image.jpg');

      // Upload to WordPress
      const response = await this.client.post('/media', formData, {
        headers: {
          ...formData.getHeaders(),
          'Content-Disposition': 'attachment; filename="' + (filename || 'image.jpg') + '"'
        }
      });

      return {
        success: true,
        data: response.data,
        statusCode: response.status
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status
      };
    }
  }

  /**
   * Map AI content to WordPress format
   */
  private async mapContentToWordPress(content: AIContent): Promise<any> {
    const wpData: any = {
      title: content.title,
      content: content.content,
      status: this.mapStatus(content.status),
      excerpt: content.excerpt || ''
    };

    // Handle categories
    if (content.categories && content.categories.length > 0) {
      wpData.categories = await this.mapCategories(content.categories);
    } else if (this.config.defaultCategory) {
      wpData.categories = await this.mapCategories([this.config.defaultCategory]);
    }

    // Handle tags
    if (content.tags && content.tags.length > 0) {
      wpData.tags = await this.mapTags(content.tags);
    }

    // Handle author
    if (content.authorId) {
      wpData.author = content.authorId;
    } else if (this.config.defaultAuthor) {
      wpData.author = this.config.defaultAuthor;
    }

    // Handle publish date
    if (content.publishDate) {
      wpData.date = content.publishDate.toISOString();
    }

    // Handle SEO meta (requires Yoast or similar plugin)
    if (content.seo) {
      wpData.meta = {
        ...(content.seo.metaTitle && { _yoast_wpseo_title: content.seo.metaTitle }),
        ...(content.seo.metaDescription && { _yoast_wpseo_metadesc: content.seo.metaDescription }),
        ...(content.seo.keywords && { _yoast_wpseo_focuskw: content.seo.keywords.join(', ') })
      };
    }

    // Handle type-specific content
    this.mapTypeSpecificContent(wpData, content);

    return wpData;
  }

  /**
   * Map partial content for updates
   */
  private async mapPartialContentToWordPress(content: Partial<AIContent>): Promise<any> {
    const wpData: any = {};

    if (content.title) wpData.title = content.title;
    if (content.content) wpData.content = content.content;
    if (content.excerpt) wpData.excerpt = content.excerpt;
    if (content.status) wpData.status = this.mapStatus(content.status);

    if (content.categories) {
      wpData.categories = await this.mapCategories(content.categories);
    }

    if (content.tags) {
      wpData.tags = await this.mapTags(content.tags);
    }

    if (content.publishDate) {
      wpData.date = content.publishDate.toISOString();
    }

    return wpData;
  }

  /**
   * Map content status to WordPress status
   */
  private mapStatus(status?: string): string {
    switch (status) {
      case 'published': return 'publish';
      case 'draft': return 'draft';
      case 'scheduled': return 'future';
      default: return 'draft';
    }
  }

  /**
   * Map categories to WordPress category IDs
   */
  private async mapCategories(categories: string[]): Promise<number[]> {
    try {
      const categoriesResponse = await this.getCategories();
      if (!categoriesResponse.success) return [];

      const wpCategories = categoriesResponse.data || [];
      const categoryIds: number[] = [];

      for (const category of categories) {
        let wpCategory = wpCategories.find((cat: any) => 
          cat.name.toLowerCase() === category.toLowerCase() ||
          cat.slug.toLowerCase() === category.toLowerCase()
        );

        if (!wpCategory) {
          // Create new category
          const newCategoryResponse = await this.client.post('/categories', {
            name: category,
            slug: category.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });
          if (newCategoryResponse.data) {
            wpCategory = newCategoryResponse.data;
          }
        }

        if (wpCategory) {
          categoryIds.push(wpCategory.id);
        }
      }

      return categoryIds;
    } catch (error) {
      console.error('Error mapping categories:', error);
      return [];
    }
  }

  /**
   * Map tags to WordPress tag IDs
   */
  private async mapTags(tags: string[]): Promise<number[]> {
    try {
      const tagsResponse = await this.getTags();
      if (!tagsResponse.success) return [];

      const wpTags = tagsResponse.data || [];
      const tagIds: number[] = [];

      for (const tag of tags) {
        let wpTag = wpTags.find((t: any) => 
          t.name.toLowerCase() === tag.toLowerCase() ||
          t.slug.toLowerCase() === tag.toLowerCase()
        );

        if (!wpTag) {
          // Create new tag
          const newTagResponse = await this.client.post('/tags', {
            name: tag,
            slug: tag.toLowerCase().replace(/[^a-z0-9]+/g, '-')
          });
          if (newTagResponse.data) {
            wpTag = newTagResponse.data;
          }
        }

        if (wpTag) {
          tagIds.push(wpTag.id);
        }
      }

      return tagIds;
    } catch (error) {
      console.error('Error mapping tags:', error);
      return [];
    }
  }

  /**
   * Set featured image for a post
   */
  private async setFeaturedImage(postId: number, image: any, postType: string): Promise<void> {
    try {
      const mediaResponse = await this.uploadMedia(image.url, image.alt);
      if (mediaResponse.success && mediaResponse.data) {
        await this.client.patch(`/${postType}/${postId}`, {
          featured_media: mediaResponse.data.id
        });
      }
    } catch (error) {
      console.error('Error setting featured image:', error);
    }
  }

  /**
   * Map type-specific content
   */
  private mapTypeSpecificContent(wpData: any, content: AIContent): void {
    switch (content.type) {
      case 'faq':
        if (content.faqs) {
          // Store FAQs as custom fields
          wpData.meta = {
            ...wpData.meta,
            faq_items: JSON.stringify(content.faqs)
          };
        }
        break;

      case 'product-description':
        if (content.specifications) {
          wpData.meta = {
            ...wpData.meta,
            product_specifications: JSON.stringify(content.specifications)
          };
        }
        break;

      case 'landing-page':
        if (content.ctaText || content.ctaUrl) {
          wpData.meta = {
            ...wpData.meta,
            ...(content.ctaText && { cta_text: content.ctaText }),
            ...(content.ctaUrl && { cta_url: content.ctaUrl })
          };
        }
        break;
    }
  }

  /**
   * Determine WordPress post type based on content type
   */
  private determinePostType(content: AIContent): string {
    switch (content.type) {
      case 'blog':
      case 'article':
        return 'posts';
      case 'landing-page':
        return 'pages';
      case 'faq':
      case 'product-description':
      default:
        return 'posts';
    }
  }

  /**
   * Get standard WordPress fields for a post type
   */
  private getWordPressFields(postType: string): CollectionField[] {
    const baseFields: CollectionField[] = [
      { id: 'title', name: 'Title', type: 'text', required: true },
      { id: 'content', name: 'Content', type: 'rich-text', required: true },
      { id: 'excerpt', name: 'Excerpt', type: 'text', required: false },
      { id: 'status', name: 'Status', type: 'select', required: false },
      { id: 'categories', name: 'Categories', type: 'multi-reference', required: false },
      { id: 'tags', name: 'Tags', type: 'multi-reference', required: false },
      { id: 'featured_media', name: 'Featured Image', type: 'image', required: false }
    ];

    if (postType === 'pages') {
      return baseFields.filter(field => !['categories', 'tags'].includes(field.id));
    }

    return baseFields;
  }

  /**
   * Delete content from WordPress
   */
  async deleteContent(contentId: string, postType: string = 'posts'): Promise<PublishResult> {
    try {
      await this.client.delete(`/${postType}/${contentId}?force=true`);

      return {
        success: true,
        platform: 'wordpress',
        message: 'Content deleted successfully from WordPress'
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'wordpress',
        message: 'Failed to delete content from WordPress',
        errors: [error.response?.data?.message || error.message]
      };
    }
  }
}
