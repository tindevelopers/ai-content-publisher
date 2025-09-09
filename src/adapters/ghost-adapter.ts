/**
 * Ghost CMS adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { GhostConfig, APIResponse, RequestOptions } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class GhostAdapter {
  private client: AxiosInstance;
  private config: GhostConfig;

  constructor(config: GhostConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with Ghost configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: `${this.config.siteUrl}/ghost/api/v3/admin`,
      headers: {
        'Authorization': `Ghost ${this.config.adminApiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to Ghost
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get('/site');
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
   * Publish content to Ghost
   */
  async publishContent(content: AIContent): Promise<PublishResult> {
    try {
      // Transform AIContent to Ghost post format
      const ghostPost = this.transformToGhostPost(content);

      const response = await this.client.post('/posts', {
        posts: [ghostPost]
      });

      const post = response.data.posts[0];
      
      return {
        success: true,
        contentId: post.id,
        url: post.url,
        message: 'Content published successfully to Ghost',
        platform: 'ghost',
        publishedAt: new Date(post.published_at),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish to Ghost',
        errors: [error.response?.data?.message || error.message],
        platform: 'ghost',
      };
    }
  }

  /**
   * Transform AIContent to Ghost post format
   */
  private transformToGhostPost(content: AIContent): any {
    const ghostPost: any = {
      title: content.title,
      html: content.content,
      status: content.status === 'published' ? 'published' : 'draft',
      published_at: content.publishDate?.toISOString(),
    };

    // Add excerpt if available
    if (content.excerpt) {
      ghostPost.excerpt = content.excerpt;
    }

    // Add tags
    if (content.tags && content.tags.length > 0) {
      ghostPost.tags = content.tags.map(tag => ({ name: tag }));
    }

    // Add custom fields for Ghost-specific data
    if (content.ghostTag) {
      ghostPost.tags = [{ name: content.ghostTag }];
    }

    if (content.ghostAuthor) {
      ghostPost.authors = [{ name: content.ghostAuthor }];
    }

    // Add SEO data
    if (content.seo) {
      ghostPost.meta_title = content.seo.metaTitle;
      ghostPost.meta_description = content.seo.metaDescription;
    }

    // Add featured image
    if (content.images && content.images.length > 0) {
      ghostPost.feature_image = content.images[0].url;
    }

    return ghostPost;
  }

  /**
   * Get available collections (tags) from Ghost
   */
  async getAvailableCollections(): Promise<Collection[]> {
    try {
      const response = await this.client.get('/tags');
      return response.data.tags.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        count: tag.count?.posts || 0,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch Ghost tags: ${error.message}`);
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/posts/${postId}`);
      return {
        success: true,
        data: response.data.posts[0],
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
   * Update existing post
   */
  async updatePost(postId: string, content: AIContent): Promise<PublishResult> {
    try {
      const ghostPost = this.transformToGhostPost(content);
      
      const response = await this.client.put(`/posts/${postId}`, {
        posts: [ghostPost]
      });

      const post = response.data.posts[0];
      
      return {
        success: true,
        contentId: post.id,
        url: post.url,
        message: 'Content updated successfully in Ghost',
        platform: 'ghost',
        publishedAt: new Date(post.updated_at),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to update Ghost post',
        errors: [error.response?.data?.message || error.message],
        platform: 'ghost',
      };
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<APIResponse> {
    try {
      const response = await this.client.delete(`/posts/${postId}`);
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
   * Batch publish multiple posts
   */
  async batchPublish(contentItems: AIContent[]): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    for (const content of contentItems) {
      try {
        const result = await this.publishContent(content);
        results.push(result);
      } catch (error: any) {
        results.push({
          success: false,
          message: 'Failed to publish content',
          errors: [error.message],
          platform: 'ghost',
        });
      }
    }
    
    return results;
  }
}
