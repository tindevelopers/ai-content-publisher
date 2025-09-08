/**
 * Main AI Content Publisher class - Unified interface for publishing content
 */

import { ConfigManager } from './config-manager';
import { ContentValidator } from './content-validator';
import { WebflowAdapter } from '../adapters/webflow-adapter';
import { WordPressAdapter } from '../adapters/wordpress-adapter';
import { 
  PublisherConfig, 
  WebflowConfig, 
  WordPressConfig, 
  APIResponse, 
} from '../types/config';
import { 
  AIContent, 
  PublishResult, 
  ValidationResult, 
  Collection, 
} from '../types/content';

export class AIContentPublisher {
  private configManager: ConfigManager;
  private validator: ContentValidator;
  private webflowAdapter?: WebflowAdapter;
  private wordpressAdapter?: WordPressAdapter;

  constructor(config?: PublisherConfig) {
    this.configManager = new ConfigManager(config);
    this.validator = new ContentValidator();
    
    // Initialize adapters if configurations are provided
    this.initializeAdapters();
  }

  /**
   * Initialize platform adapters based on configuration
   */
  private initializeAdapters(): void {
    const webflowConfig = this.configManager.getWebflowConfig();
    if (webflowConfig) {
      this.webflowAdapter = new WebflowAdapter(webflowConfig);
    }

    const wordpressConfig = this.configManager.getWordPressConfig();
    if (wordpressConfig) {
      this.wordpressAdapter = new WordPressAdapter(wordpressConfig);
    }
  }

  /**
   * Configure Webflow integration
   */
  async configureWebflow(apiKey: string, siteId: string, defaultCollectionId?: string): Promise<void> {
    const config: WebflowConfig = {
      apiKey,
      siteId,
      defaultCollectionId,
    };

    this.configManager.setWebflowConfig(config);
    this.webflowAdapter = new WebflowAdapter(config);

    // Test the connection
    const testResult = await this.webflowAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`Webflow configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Configure WordPress integration
   */
  async configureWordPress(siteUrl: string, username: string, password: string, options?: {
    defaultCategory?: string;
    defaultAuthor?: number;
  }): Promise<void> {
    const config: WordPressConfig = {
      siteUrl,
      username,
      password,
      defaultCategory: options?.defaultCategory,
      defaultAuthor: options?.defaultAuthor,
    };

    this.configManager.setWordPressConfig(config);
    this.wordpressAdapter = new WordPressAdapter(config);

    // Test the connection
    const testResult = await this.wordpressAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`WordPress configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Main method to publish content to specified platform
   */
  async publish(content: AIContent, platform: 'webflow' | 'wordpress'): Promise<PublishResult> {
    // Validate content first
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      return {
        success: false,
        platform,
        message: 'Content validation failed',
        errors: validation.errors.map(e => `${e.field}: ${e.message}`),
      };
    }

    // Route to appropriate adapter
    switch (platform) {
      case 'webflow':
        return this.publishToWebflow(content);
      case 'wordpress':
        return this.publishToWordPress(content);
      default:
        return {
          success: false,
          platform,
          message: 'Unsupported platform',
          errors: ['UNSUPPORTED_PLATFORM'],
        };
    }
  }

  /**
   * Publish content to multiple platforms simultaneously
   */
  async publishToMultiple(content: AIContent, platforms: ('webflow' | 'wordpress')[]): Promise<PublishResult[]> {
    const results: PublishResult[] = [];
    
    // Validate content once
    const validation = this.validateContent(content);
    if (!validation.isValid) {
      return platforms.map(platform => ({
        success: false,
        platform,
        message: 'Content validation failed',
        errors: validation.errors.map(e => `${e.field}: ${e.message}`),
      }));
    }

    // Publish to all platforms in parallel
    const publishPromises = platforms.map(platform => this.publish(content, platform));
    const publishResults = await Promise.allSettled(publishPromises);

    publishResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results.push(result.value);
      } else {
        results.push({
          success: false,
          platform: platforms[index],
          message: 'Publish operation failed',
          errors: [result.reason?.message || 'Unknown error'],
        });
      }
    });

    return results;
  }

  /**
   * Update existing content on specified platform
   */
  async updateContent(
    contentId: string, 
    updates: Partial<AIContent>, 
    platform: 'webflow' | 'wordpress',
    options?: { collectionId?: string; postType?: string },
  ): Promise<PublishResult> {
    switch (platform) {
      case 'webflow':
        if (!this.webflowAdapter) {
          return this.createErrorResult(platform, 'Webflow not configured');
        }
        return this.webflowAdapter.updateContent(contentId, updates, options?.collectionId);
        
      case 'wordpress':
        if (!this.wordpressAdapter) {
          return this.createErrorResult(platform, 'WordPress not configured');
        }
        return this.wordpressAdapter.updateContent(contentId, updates, options?.postType);
        
      default:
        return this.createErrorResult(platform, 'Unsupported platform');
    }
  }

  /**
   * Delete content from specified platform
   */
  async deleteContent(
    contentId: string, 
    platform: 'webflow' | 'wordpress',
    options?: { collectionId?: string; postType?: string },
  ): Promise<PublishResult> {
    switch (platform) {
      case 'webflow':
        if (!this.webflowAdapter) {
          return this.createErrorResult(platform, 'Webflow not configured');
        }
        return this.webflowAdapter.deleteContent(contentId, options?.collectionId);
        
      case 'wordpress':
        if (!this.wordpressAdapter) {
          return this.createErrorResult(platform, 'WordPress not configured');
        }
        return this.wordpressAdapter.deleteContent(contentId, options?.postType);
        
      default:
        return this.createErrorResult(platform, 'Unsupported platform');
    }
  }

  /**
   * Get available collections for a platform
   */
  async getAvailableCollections(platform: 'webflow' | 'wordpress'): Promise<Collection[]> {
    switch (platform) {
      case 'webflow': {
        if (!this.webflowAdapter) return [];
        const webflowResult = await this.webflowAdapter.getCollections();
        return webflowResult.success ? webflowResult.data || [] : [];
      }
        
      case 'wordpress': {
        if (!this.wordpressAdapter) return [];
        const wpResult = await this.wordpressAdapter.getCollections();
        return wpResult.success ? wpResult.data || [] : [];
      }
        
      default:
        return [];
    }
  }

  /**
   * Test connection to a specific platform
   */
  async testConnection(platform: 'webflow' | 'wordpress'): Promise<APIResponse> {
    switch (platform) {
      case 'webflow':
        if (!this.webflowAdapter) {
          return { success: false, error: 'Webflow not configured' };
        }
        return this.webflowAdapter.testConnection();
        
      case 'wordpress':
        if (!this.wordpressAdapter) {
          return { success: false, error: 'WordPress not configured' };
        }
        return this.wordpressAdapter.testConnection();
        
      default:
        return { success: false, error: 'Unsupported platform' };
    }
  }

  /**
   * Validate content using the content validator
   */
  validateContent(content: AIContent): ValidationResult {
    return this.validator.validate(content);
  }

  /**
   * Get configuration status for all platforms
   */
  getConfigurationStatus(): Record<string, boolean> {
    return {
      webflow: this.configManager.isConfigured('webflow'),
      wordpress: this.configManager.isConfigured('wordpress'),
    };
  }

  /**
   * Get configuration details (without sensitive data)
   */
  getConfiguration(): Record<string, any> {
    return this.configManager.exportConfig();
  }

  /**
   * Batch publish multiple content items
   */
  async batchPublish(
    contentItems: AIContent[], 
    platform: 'webflow' | 'wordpress',
    options?: {
      concurrency?: number;
      stopOnError?: boolean;
    },
  ): Promise<PublishResult[]> {
    const concurrency = options?.concurrency || 5;
    const stopOnError = options?.stopOnError || false;
    const results: PublishResult[] = [];

    // Process in batches to avoid overwhelming the APIs
    for (let i = 0; i < contentItems.length; i += concurrency) {
      const batch = contentItems.slice(i, i + concurrency);
      const batchPromises = batch.map(content => this.publish(content, platform));
      
      const batchResults = await Promise.allSettled(batchPromises);
      
      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
          
          if (stopOnError && !result.value.success) {
            return results; // Stop processing on first error
          }
        } else {
          const errorResult: PublishResult = {
            success: false,
            platform,
            message: 'Batch publish failed',
            errors: [result.reason?.message || 'Unknown error'],
          };
          results.push(errorResult);
          
          if (stopOnError) {
            return results; // Stop processing on first error
          }
        }
      }
    }

    return results;
  }

  /**
   * Private method to publish to Webflow
   */
  private async publishToWebflow(content: AIContent): Promise<PublishResult> {
    if (!this.webflowAdapter) {
      return this.createErrorResult('webflow', 'Webflow not configured. Call configureWebflow() first.');
    }

    return this.webflowAdapter.publishContent(content);
  }

  /**
   * Private method to publish to WordPress
   */
  private async publishToWordPress(content: AIContent): Promise<PublishResult> {
    if (!this.wordpressAdapter) {
      return this.createErrorResult('wordpress', 'WordPress not configured. Call configureWordPress() first.');
    }

    return this.wordpressAdapter.publishContent(content);
  }

  /**
   * Create a standardized error result
   */
  private createErrorResult(platform: 'webflow' | 'wordpress', message: string): PublishResult {
    return {
      success: false,
      platform,
      message,
      errors: [message],
    };
  }

  /**
   * Clear all configurations
   */
  clearConfiguration(): void {
    this.configManager.clearAll();
    this.webflowAdapter = undefined;
    this.wordpressAdapter = undefined;
  }
}
