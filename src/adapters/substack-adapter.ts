/**
 * Substack adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { SubstackConfig, APIResponse } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class SubstackAdapter {
  private client: AxiosInstance;
  private config: SubstackConfig;

  constructor(config: SubstackConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with Substack configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: 'https://substack.com/api/v1',
      headers: {
        'Authorization': `Bearer ${this.config.apiKey}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to Substack
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/publications/${this.config.publicationId}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as any).response?.data?.message || (error as Error).message,
        statusCode: (error as any).response?.status,
      };
    }
  }

  /**
   * Publish content to Substack
   */
  async publishContent(content: AIContent): Promise<PublishResult> {
    try {
      if (content.type === 'newsletter' || content.type === 'newsletter-issue') {
        return await this.publishNewsletter(content);
      } else {
        return await this.publishPost(content);
      }
    } catch (error: unknown) {
      return {
        success: false,
        message: 'Failed to publish to Substack',
        errors: [(error as any).response?.data?.message || (error as Error).message],
        platform: 'substack',
      };
    }
  }

  /**
   * Publish a newsletter issue
   */
  private async publishNewsletter(content: AIContent): Promise<PublishResult> {
    if (!content.newsletter) {
      throw new Error('Newsletter content is required for newsletter publishing');
    }

    const newsletterData = {
      title: content.newsletter.subject,
      subtitle: content.excerpt || '',
      body_html: this.formatNewsletterContent(content.newsletter),
      preview_text: content.newsletter.previewText || content.excerpt,
      section_id: content.substackSection || this.config.defaultSection,
      send_email: content.status === 'published',
      send_push: content.status === 'published',
      send_web: true,
      tags: content.tags || [],
    };

    const response = await this.client.post(`/publications/${this.config.publicationId}/posts`, newsletterData);

    return {
      success: true,
      contentId: response.data.id,
      url: response.data.web_url,
      message: 'Newsletter published successfully to Substack',
      platform: 'substack',
      publishedAt: new Date(response.data.created_at),
    };
  }

  /**
   * Publish a regular post
   */
  private async publishPost(content: AIContent): Promise<PublishResult> {
    const postData = {
      title: content.title,
      subtitle: content.excerpt || '',
      body_html: content.content,
      preview_text: content.excerpt,
      section_id: content.substackSection || this.config.defaultSection,
      send_email: false,
      send_push: false,
      send_web: true,
      tags: content.tags || [],
    };

    const response = await this.client.post(`/publications/${this.config.publicationId}/posts`, postData);

    return {
      success: true,
      contentId: response.data.id,
      url: response.data.web_url,
      message: 'Post published successfully to Substack',
      platform: 'substack',
      publishedAt: new Date(response.data.created_at),
    };
  }

  /**
   * Format newsletter content with sections
   */
  private formatNewsletterContent(newsletter: any): string {
    let html = '';

    for (const section of newsletter.sections) {
      switch (section.type) {
        case 'text':
          html += `<p>${section.content}</p>`;
          break;
        case 'image':
          html += `<img src="${section.content}" alt="" style="max-width: 100%; height: auto;" />`;
          break;
        case 'cta':
          html += `<div style="text-align: center; margin: 20px 0;">
                    <a href="${section.style?.url || '#'}" style="background-color: #007acc; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                      ${section.content}
                    </a>
                   </div>`;
          break;
        case 'divider':
          html += '<hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;" />';
          break;
        case 'social':
          html += `<div style="text-align: center; margin: 20px 0;">
                    <p>${section.content}</p>
                   </div>`;
          break;
        default:
          html += `<p>${section.content}</p>`;
      }
    }

    if (newsletter.footer) {
      html += `<div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666;">
                ${newsletter.footer}
               </div>`;
    }

    return html;
  }

  /**
   * Get publication sections
   */
  async getSections(): Promise<Collection[]> {
    try {
      const response = await this.client.get(`/publications/${this.config.publicationId}/sections`);
      return response.data.map((section: any) => ({
        id: section.id,
        name: section.name,
        slug: section.slug,
        description: section.description,
      }));
    } catch (error: unknown) {
      throw new Error(`Failed to fetch Substack sections: ${(error as Error).message}`);
    }
  }

  /**
   * Get publication information
   */
  async getPublicationInfo(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/publications/${this.config.publicationId}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as any).response?.data?.message || (error as Error).message,
        statusCode: (error as any).response?.status,
      };
    }
  }

  /**
   * Get post by ID
   */
  async getPost(postId: string): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/publications/${this.config.publicationId}/posts/${postId}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as any).response?.data?.message || (error as Error).message,
        statusCode: (error as any).response?.status,
      };
    }
  }

  /**
   * Update existing post
   */
  async updatePost(postId: string, content: AIContent): Promise<PublishResult> {
    try {
      const postData = {
        title: content.title,
        subtitle: content.excerpt || '',
        body_html: content.content,
        preview_text: content.excerpt,
        section_id: content.substackSection || this.config.defaultSection,
        tags: content.tags || [],
      };

      const response = await this.client.put(`/publications/${this.config.publicationId}/posts/${postId}`, postData);

      return {
        success: true,
        contentId: response.data.id,
        url: response.data.web_url,
        message: 'Post updated successfully in Substack',
        platform: 'substack',
        publishedAt: new Date(response.data.updated_at),
      };
    } catch (error: unknown) {
      return {
        success: false,
        message: 'Failed to update Substack post',
        errors: [(error as any).response?.data?.message || (error as Error).message],
        platform: 'substack',
      };
    }
  }

  /**
   * Delete post
   */
  async deletePost(postId: string): Promise<APIResponse> {
    try {
      const response = await this.client.delete(`/publications/${this.config.publicationId}/posts/${postId}`);
      return {
        success: true,
        data: response.data,
        statusCode: response.status,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as any).response?.data?.message || (error as Error).message,
        statusCode: (error as any).response?.status,
      };
    }
  }

  /**
   * Get subscriber count
   */
  async getSubscriberCount(): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/publications/${this.config.publicationId}/stats`);
      return {
        success: true,
        data: {
          subscribers: response.data.subscriber_count,
          email_subscribers: response.data.email_subscriber_count,
        },
        statusCode: response.status,
      };
    } catch (error: unknown) {
      return {
        success: false,
        error: (error as any).response?.data?.message || (error as Error).message,
        statusCode: (error as any).response?.status,
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
      } catch (error: unknown) {
        results.push({
          success: false,
          message: 'Failed to publish content',
          errors: [(error as Error).message],
          platform: 'substack',
        });
      }
    }
    
    return results;
  }
}
