/**
 * Webflow adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { WebflowConfig, APIResponse, RequestOptions } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class WebflowAdapter {
  private client: AxiosInstance;
  private config: WebflowConfig;

  constructor(config: WebflowConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with Webflow configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseUrl || 'https://api.webflow.com/v2',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'accept-version': '1.0.0',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to Webflow
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/sites/${this.config.siteId}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Get all collections for the site
   */
  async getCollections(): Promise<APIResponse<Collection[]>> {
    try {
      const response = await this.client.get(`/sites/${this.config.siteId}/collections`);
      
      const collections: Collection[] = response.data.collections.map((col: any) => ({
        id: col.id,
        name: col.displayName,
        slug: col.slug,
        platform: 'webflow' as const,
        fields: col.fields?.map((field: any) => ({
          id: field.id,
          name: field.displayName,
          type: field.type,
          required: field.isRequired || false,
          description: field.helpText,
        })) || [],
      }));

      return {
        success: true,
        data: collections,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Get a specific collection by ID
   */
  async getCollection(collectionId: string): Promise<APIResponse<Collection>> {
    try {
      const response = await this.client.get(`/collections/${collectionId}`);
      
      const collection: Collection = {
        id: response.data.id,
        name: response.data.displayName,
        slug: response.data.slug,
        platform: 'webflow',
        fields: response.data.fields?.map((field: any) => ({
          id: field.id,
          name: field.displayName,
          type: field.type,
          required: field.isRequired || false,
          description: field.helpText,
        })) || [],
      };

      return {
        success: true,
        data: collection,
        statusCode: response.status,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        statusCode: error.response?.status,
      };
    }
  }

  /**
   * Publish content to Webflow CMS
   */
  async publishContent(content: AIContent, options?: RequestOptions): Promise<PublishResult> {
    try {
      // Determine collection ID
      const collectionId = content.collectionId || this.config.defaultCollectionId;
      if (!collectionId) {
        return {
          success: false,
          platform: 'webflow',
          message: 'Collection ID is required. Set it in content or configuration.',
          errors: ['COLLECTION_ID_MISSING'],
        };
      }

      // Get collection schema to map fields correctly
      const collectionResponse = await this.getCollection(collectionId);
      if (!collectionResponse.success) {
        return {
          success: false,
          platform: 'webflow',
          message: 'Failed to fetch collection schema',
          errors: [collectionResponse.error || 'COLLECTION_FETCH_FAILED'],
        };
      }

      // Map content to Webflow format
      const webflowData = this.mapContentToWebflow(content, collectionResponse.data!);

      // Create the CMS item
      const response = await this.client.post(
        `/collections/${collectionId}/items`,
        webflowData,
        { timeout: options?.timeout },
      );

      // Publish the item if status is published
      let publishedUrl: string | undefined;
      if (content.status === 'published') {
        await this.publishItem(collectionId, response.data.id);
        publishedUrl = this.generateItemUrl(response.data);
      }

      return {
        success: true,
        platform: 'webflow',
        contentId: response.data.id,
        url: publishedUrl,
        message: 'Content published successfully to Webflow',
        publishedAt: new Date(),
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'webflow',
        message: 'Failed to publish content to Webflow',
        errors: [error.response?.data?.message || error.message],
      };
    }
  }

  /**
   * Update existing content in Webflow
   */
  async updateContent(contentId: string, content: Partial<AIContent>, collectionId?: string): Promise<PublishResult> {
    try {
      const targetCollectionId = collectionId || this.config.defaultCollectionId;
      if (!targetCollectionId) {
        return {
          success: false,
          platform: 'webflow',
          message: 'Collection ID is required for updates',
          errors: ['COLLECTION_ID_MISSING'],
        };
      }

      // Get collection schema
      const collectionResponse = await this.getCollection(targetCollectionId);
      if (!collectionResponse.success) {
        return {
          success: false,
          platform: 'webflow',
          message: 'Failed to fetch collection schema',
          errors: [collectionResponse.error || 'COLLECTION_FETCH_FAILED'],
        };
      }

      // Map partial content to Webflow format
      const webflowData = this.mapPartialContentToWebflow(content, collectionResponse.data!);

      // Update the CMS item
      const response = await this.client.patch(
        `/collections/${targetCollectionId}/items/${contentId}`,
        webflowData,
      );

      return {
        success: true,
        platform: 'webflow',
        contentId: response.data.id,
        message: 'Content updated successfully in Webflow',
        publishedAt: new Date(),
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'webflow',
        message: 'Failed to update content in Webflow',
        errors: [error.response?.data?.message || error.message],
      };
    }
  }

  /**
   * Map AI content to Webflow CMS format
   */
  private mapContentToWebflow(content: AIContent, collection: Collection): any {
    const webflowData: any = {
      isArchived: false,
      isDraft: content.status !== 'published',
    };

    // Map basic fields
    this.mapField(webflowData, collection, 'name', content.title);
    this.mapField(webflowData, collection, 'slug', content.slug || this.generateSlug(content.title));
    
    // Map content fields
    this.mapField(webflowData, collection, 'content', content.content);
    this.mapField(webflowData, collection, 'summary', content.excerpt);
    this.mapField(webflowData, collection, 'excerpt', content.excerpt);
    
    // Map SEO fields
    if (content.seo) {
      this.mapField(webflowData, collection, 'meta-title', content.seo.metaTitle);
      this.mapField(webflowData, collection, 'meta-description', content.seo.metaDescription);
      this.mapField(webflowData, collection, 'keywords', content.seo.keywords?.join(', '));
    }

    // Map tags and categories
    if (content.tags) {
      this.mapField(webflowData, collection, 'tags', content.tags.join(', '));
    }
    
    if (content.categories) {
      this.mapField(webflowData, collection, 'category', content.categories[0]);
      this.mapField(webflowData, collection, 'categories', content.categories.join(', '));
    }

    // Map dates
    if (content.publishDate) {
      this.mapField(webflowData, collection, 'published-date', content.publishDate.toISOString());
      this.mapField(webflowData, collection, 'date', content.publishDate.toISOString());
    }

    // Map type-specific fields
    this.mapTypeSpecificFields(webflowData, collection, content);

    return { fields: webflowData };
  }

  /**
   * Map partial content for updates
   */
  private mapPartialContentToWebflow(content: Partial<AIContent>, collection: Collection): any {
    const webflowData: any = {};

    // Only map provided fields
    if (content.title) {
      this.mapField(webflowData, collection, 'name', content.title);
    }
    
    if (content.content) {
      this.mapField(webflowData, collection, 'content', content.content);
    }
    
    if (content.excerpt) {
      this.mapField(webflowData, collection, 'summary', content.excerpt);
      this.mapField(webflowData, collection, 'excerpt', content.excerpt);
    }

    if (content.status) {
      webflowData.isDraft = content.status !== 'published';
    }

    return { fields: webflowData };
  }

  /**
   * Map a field to Webflow format if it exists in the collection
   */
  private mapField(webflowData: any, collection: Collection, fieldName: string, value: any): void {
    const field = collection.fields.find(f => 
      f.name.toLowerCase() === fieldName.toLowerCase() || 
      f.id === fieldName,
    );
    
    if (field && value !== undefined && value !== null) {
      webflowData[field.id] = value;
    }
  }

  /**
   * Map type-specific fields
   */
  private mapTypeSpecificFields(webflowData: any, collection: Collection, content: AIContent): void {
    switch (content.type) {
      case 'faq':
        if (content.faqs) {
          // Map FAQ items if collection supports structured data
          this.mapField(webflowData, collection, 'faqs', JSON.stringify(content.faqs));
        }
        break;
        
      case 'product-description':
        if (content.specifications) {
          this.mapField(webflowData, collection, 'specifications', JSON.stringify(content.specifications));
        }
        break;
        
      case 'landing-page':
        if (content.ctaText) {
          this.mapField(webflowData, collection, 'cta-text', content.ctaText);
        }
        if (content.ctaUrl) {
          this.mapField(webflowData, collection, 'cta-url', content.ctaUrl);
        }
        break;
    }
  }

  /**
   * Publish a CMS item
   */
  private async publishItem(collectionId: string, itemId: string): Promise<void> {
    await this.client.patch(`/collections/${collectionId}/items/${itemId}`, {
      fields: { isDraft: false },
    });
  }

  /**
   * Generate a URL slug from title
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Generate item URL
   */
  private generateItemUrl(item: any): string {
    return `https://${this.config.siteId}.webflow.io/${item.slug || item.id}`;
  }

  /**
   * Delete content from Webflow
   */
  async deleteContent(contentId: string, collectionId?: string): Promise<PublishResult> {
    try {
      const targetCollectionId = collectionId || this.config.defaultCollectionId;
      if (!targetCollectionId) {
        return {
          success: false,
          platform: 'webflow',
          message: 'Collection ID is required for deletion',
          errors: ['COLLECTION_ID_MISSING'],
        };
      }

      await this.client.delete(`/collections/${targetCollectionId}/items/${contentId}`);

      return {
        success: true,
        platform: 'webflow',
        message: 'Content deleted successfully from Webflow',
      };

    } catch (error: any) {
      return {
        success: false,
        platform: 'webflow',
        message: 'Failed to delete content from Webflow',
        errors: [error.response?.data?.message || error.message],
      };
    }
  }
}
