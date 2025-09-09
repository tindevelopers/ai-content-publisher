/**
 * LinkedIn adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { LinkedInConfig, APIResponse, RequestOptions } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class LinkedInAdapter {
  private client: AxiosInstance;
  private config: LinkedInConfig;

  constructor(config: LinkedInConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with LinkedIn configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.linkedin.com/v2',
      headers: {
        'Authorization': `Bearer ${this.config.accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to LinkedIn
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/people/${this.config.userId}`);
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
   * Publish content to LinkedIn
   */
  async publishContent(content: AIContent): Promise<PublishResult> {
    try {
      if (content.type === 'linkedin-article') {
        return await this.publishArticle(content);
      } else {
        return await this.publishPost(content);
      }
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish to LinkedIn',
        errors: [error.response?.data?.message || error.message],
        platform: 'linkedin',
      };
    }
  }

  /**
   * Publish a LinkedIn article
   */
  private async publishArticle(content: AIContent): Promise<PublishResult> {
    try {
      const articleData = {
        author: `urn:li:person:${this.config.userId}`,
        title: content.title,
        content: {
          article: content.content,
        },
        visibility: {
          code: content.status === 'published' ? 'PUBLIC' : 'CONNECTIONS',
        },
      };

      const response = await this.client.post('/ugcPosts', {
        author: `urn:li:person:${this.config.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: content.excerpt || content.title,
            },
            shareMediaCategory: 'ARTICLE',
            media: [
              {
                status: 'READY',
                description: {
                  text: content.excerpt || '',
                },
                originalUrl: content.seo?.canonicalUrl || '',
                title: {
                  text: content.title,
                },
              },
            ],
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      });

      return {
        success: true,
        contentId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        message: 'Article published successfully to LinkedIn',
        platform: 'linkedin',
        publishedAt: new Date(),
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Publish a LinkedIn post
   */
  private async publishPost(content: AIContent): Promise<PublishResult> {
    try {
      const postData = {
        author: `urn:li:person:${this.config.userId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: this.formatLinkedInPost(content),
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await this.client.post('/ugcPosts', postData);

      return {
        success: true,
        contentId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        message: 'Post published successfully to LinkedIn',
        platform: 'linkedin',
        publishedAt: new Date(),
      };
    } catch (error: any) {
      throw error;
    }
  }

  /**
   * Format content for LinkedIn post
   */
  private formatLinkedInPost(content: AIContent): string {
    let postText = content.title;
    
    if (content.excerpt) {
      postText += `\n\n${content.excerpt}`;
    }

    // Add hashtags
    if (content.tags && content.tags.length > 0) {
      const hashtags = content.tags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      postText += `\n\n${hashtags}`;
    }

    // Add default hashtags from config
    if (this.config.defaultHashtags && this.config.defaultHashtags.length > 0) {
      const defaultHashtags = this.config.defaultHashtags.map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      postText += ` ${defaultHashtags}`;
    }

    return postText;
  }

  /**
   * Publish to organization page
   */
  async publishToOrganization(content: AIContent): Promise<PublishResult> {
    if (!this.config.organizationId) {
      throw new Error('Organization ID is required for organization publishing');
    }

    try {
      const postData = {
        author: `urn:li:organization:${this.config.organizationId}`,
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: this.formatLinkedInPost(content),
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      };

      const response = await this.client.post('/ugcPosts', postData);

      return {
        success: true,
        contentId: response.data.id,
        url: `https://www.linkedin.com/feed/update/${response.data.id}`,
        message: 'Content published successfully to LinkedIn organization',
        platform: 'linkedin',
        publishedAt: new Date(),
      };
    } catch (error: any) {
      return {
        success: false,
        message: 'Failed to publish to LinkedIn organization',
        errors: [error.response?.data?.message || error.message],
        platform: 'linkedin',
      };
    }
  }

  /**
   * Get user profile information
   */
  async getUserProfile(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/people/${this.config.userId}`);
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
   * Get organization information
   */
  async getOrganizationInfo(): Promise<APIResponse> {
    if (!this.config.organizationId) {
      return {
        success: false,
        error: 'Organization ID not configured',
      };
    }

    try {
      const response = await this.client.get(`/organizations/${this.config.organizationId}`);
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
          platform: 'linkedin',
        });
      }
    }
    
    return results;
  }
}
