/**
 * Medium adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { MediumConfig, APIResponse, RequestOptions } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class MediumAdapter {
  private client: AxiosInstance;
  private config: MediumConfig;

  constructor(config: MediumConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with Medium configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.medium.com/v1',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to Medium
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/users/${this.config.userId}`);
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
   * Publish content to Medium
   */
  async publishContent(content: AIContent): Promise<PublishResult> {
    try {
      // Transform AIContent to Medium post format
      const mediumPost = this.transformToMediumPost(content);

      const response = await this.client.post(`/users/${this.config.userId}/posts`, mediumPost);
      
      return {
        success: true,
        contentId: response.data.data.id,
        url: response.data.data.url,
        message: 'Content published successfully to Medium',
        platform: 'medium',
        publishedAt: new Date(response.data.data.publishedAt),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish to Medium',
        errors: [error.response?.data?.message || error.message],
        platform: 'medium',
      };
    }
  }

  /**
   * Transform AIContent to Medium post format
   */
  private transformToMediumPost(content: AIContent): any {
    const mediumPost: any = {
      title: content.title,
      contentFormat: 'html',
      content: content.content,
      publishStatus: content.status === 'published' ? 'public' : 'draft',
    };

    // Add tags
    if (content.tags && content.tags.length > 0) {
      mediumPost.tags = content.tags.slice(0, 5); // Medium allows max 5 tags
    }

    // Add Medium-specific tags
    if (content.mediumTags && content.mediumTags.length > 0) {
      mediumPost.tags = content.mediumTags.slice(0, 5);
    }

    // Add publication if specified
    if (content.mediumPublication) {
      mediumPost.publishStatus = 'public';
      // Note: Publishing to publications requires additional API calls
      // This would need to be handled separately
    }

    // Add canonical URL if available
    if (content.seo?.canonicalUrl) {
      mediumPost.canonicalUrl = content.seo.canonicalUrl;
    }

    return mediumPost;
  }

  /**
   * Get user's publications
   */
  async getPublications(): Promise<Collection[]> {
    try {
      const response = await this.client.get(`/users/${this.config.userId}/publications`);
      return response.data.data.map((pub: any) => ({
        id: pub.id,
        name: pub.name,
        slug: pub.slug,
        description: pub.description,
        url: pub.url,
      }));
    } catch (error: any) {
      throw new Error(`Failed to fetch Medium publications: ${error.message}`);
    }
  }

  /**
   * Publish to a specific publication
   */
  async publishToPublication(publicationId: string, content: AIContent): Promise<PublishResult> {
    try {
      const mediumPost = this.transformToMediumPost(content);
      
      const response = await this.client.post(`/publications/${publicationId}/posts`, mediumPost);
      
      return {
        success: true,
        contentId: response.data.data.id,
        url: response.data.data.url,
        message: 'Content published successfully to Medium publication',
        platform: 'medium',
        publishedAt: new Date(response.data.data.publishedAt),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish to Medium publication',
        errors: [error.response?.data?.message || error.message],
        platform: 'medium',
      };
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
        data: response.data.data,
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
      const mediumPost = this.transformToMediumPost(content);
      
      const response = await this.client.put(`/posts/${postId}`, mediumPost);
      
      return {
        success: true,
        contentId: response.data.data.id,
        url: response.data.data.url,
        message: 'Content updated successfully in Medium',
        platform: 'medium',
        publishedAt: new Date(response.data.data.updatedAt),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to update Medium post',
        errors: [error.response?.data?.message || error.message],
        platform: 'medium',
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
          platform: 'medium',
        });
      }
    }
    
    return results;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/users/${this.config.userId}`);
      return {
        success: true,
        data: response.data.data,
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
}
