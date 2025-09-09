/**
 * Twitter/X adapter for publishing AI-generated content
 */

import axios, { AxiosInstance } from 'axios';
import { TwitterConfig, APIResponse } from '../types/config';
import { AIContent, PublishResult, Collection } from '../types/content';

export class TwitterAdapter {
  private client: AxiosInstance;
  private config: TwitterConfig;

  constructor(config: TwitterConfig) {
    this.config = config;
    this.client = this.createClient();
  }

  /**
   * Create axios client with Twitter configuration
   */
  private createClient(): AxiosInstance {
    return axios.create({
      baseURL: 'https://api.twitter.com/2',
      headers: {
        'Authorization': `Bearer ${this.config.bearerToken || this.config.accessToken}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  /**
   * Test the connection to Twitter
   */
  async testConnection(): Promise<APIResponse> {
    try {
      const response = await this.client.get('/users/me');
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
   * Publish content to Twitter
   */
  async publishContent(content: AIContent): Promise<PublishResult> {
    try {
      if (content.type === 'twitter-thread' && content.twitterThread) {
        return await this.publishThread(content);
      } else {
        return await this.publishTweet(content);
      }
    } catch (error: unknown) {
      return {
        success: false,
        message: 'Failed to publish to Twitter',
        errors: [(error as any).response?.data?.message || (error as Error).message],
        platform: 'twitter',
      };
    }
  }

  /**
   * Publish a single tweet
   */
  private async publishTweet(content: AIContent): Promise<PublishResult> {
    try {
      const tweetText = this.formatTweetText(content);
      
      const response = await this.client.post('/tweets', {
        text: tweetText,
      });

      return {
        success: true,
        contentId: response.data.data.id,
        url: `https://twitter.com/user/status/${response.data.data.id}`,
        message: 'Tweet published successfully',
        platform: 'twitter',
        publishedAt: new Date(),
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Publish a Twitter thread
   */
  private async publishThread(content: AIContent): Promise<PublishResult> {
    if (!content.twitterThread) {
      throw new Error('Twitter thread data is required for thread publishing');
    }

    try {
      const tweets = content.twitterThread.tweets;
      const publishedTweets: string[] = [];
      let replyToId: string | undefined = content.twitterThread.replyTo;

      for (let i = 0; i < tweets.length; i++) {
        const tweet = tweets[i];
        let tweetText = tweet.text;

        // Add thread indicator
        if (tweets.length > 1) {
          tweetText = `${i + 1}/${tweets.length} ${tweetText}`;
        }

        const tweetData: any = {
          text: tweetText,
        };

        // Add reply to previous tweet in thread
        if (replyToId) {
          tweetData.reply = {
            in_reply_to_tweet_id: replyToId,
          };
        }

        const response = await this.client.post('/tweets', tweetData);
        const tweetId = response.data.data.id;
        publishedTweets.push(tweetId);
        replyToId = tweetId;

        // Small delay between tweets to avoid rate limiting
        if (i < tweets.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      return {
        success: true,
        contentId: publishedTweets[0], // Return first tweet ID as main ID
        url: `https://twitter.com/user/status/${publishedTweets[0]}`,
        message: `Thread of ${tweets.length} tweets published successfully`,
        platform: 'twitter',
        publishedAt: new Date(),
      };
    } catch (error: unknown) {
      throw error;
    }
  }

  /**
   * Format content for Twitter post
   */
  private formatTweetText(content: AIContent): string {
    let tweetText = content.title;
    
    // Add excerpt if available and fits
    if (content.excerpt && (tweetText + content.excerpt).length < 200) {
      tweetText += `\n\n${content.excerpt}`;
    }

    // Add hashtags
    if (content.tags && content.tags.length > 0) {
      const hashtags = content.tags.slice(0, 3).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      const remainingLength = 280 - tweetText.length - hashtags.length - 1;
      if (remainingLength > 0) {
        tweetText += `\n\n${hashtags}`;
      }
    }

    // Add default hashtags from config
    if (this.config.defaultHashtags && this.config.defaultHashtags.length > 0) {
      const defaultHashtags = this.config.defaultHashtags.slice(0, 2).map(tag => `#${tag.replace(/\s+/g, '')}`).join(' ');
      const remainingLength = 280 - tweetText.length - defaultHashtags.length - 1;
      if (remainingLength > 0) {
        tweetText += ` ${defaultHashtags}`;
      }
    }

    // Ensure tweet doesn't exceed character limit
    if (tweetText.length > 280) {
      tweetText = tweetText.substring(0, 277) + '...';
    }

    return tweetText;
  }

  /**
   * Upload media to Twitter
   */
  async uploadMedia(mediaUrl: string): Promise<string> {
    try {
      // This would require implementing media upload functionality
      // For now, return a placeholder
      return 'media_id_placeholder';
    } catch (error: unknown) {
      throw new Error(`Failed to upload media: ${(error as Error).message}`);
    }
  }

  /**
   * Get user information
   */
  async getUserInfo(): Promise<APIResponse> {
    try {
      const response = await this.client.get('/users/me');
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
   * Get tweet by ID
   */
  async getTweet(tweetId: string): Promise<APIResponse> {
    try {
      const response = await this.client.get(`/tweets/${tweetId}`);
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
   * Delete tweet
   */
  async deleteTweet(tweetId: string): Promise<APIResponse> {
    try {
      const response = await this.client.delete(`/tweets/${tweetId}`);
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
   * Batch publish multiple tweets
   */
  async batchPublish(contentItems: AIContent[]): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    for (const content of contentItems) {
      try {
        const result = await this.publishContent(content);
        results.push(result);
        
        // Add delay between tweets to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (error: unknown) {
        results.push({
          success: false,
          message: 'Failed to publish content',
          errors: [(error as Error).message],
          platform: 'twitter',
        });
      }
    }
    
    return results;
  }
}
