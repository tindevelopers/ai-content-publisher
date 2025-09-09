/**
 * Main AI Content Publisher class - Unified interface for publishing content
 */

import { ConfigManager } from './config-manager';
import { ContentValidator } from './content-validator';
import { WebflowAdapter } from '../adapters/webflow-adapter';
import { WordPressAdapter } from '../adapters/wordpress-adapter';
import { GhostAdapter } from '../adapters/ghost-adapter';
import { MediumAdapter } from '../adapters/medium-adapter';
import { LinkedInAdapter } from '../adapters/linkedin-adapter';
import { TwitterAdapter } from '../adapters/twitter-adapter';
import { SubstackAdapter } from '../adapters/substack-adapter';
import { 
  PublisherConfig, 
  WebflowConfig, 
  WordPressConfig, 
  GhostConfig,
  MediumConfig,
  LinkedInConfig,
  TwitterConfig,
  SubstackConfig,
  APIResponse, 
} from '../types/config';
import { 
  AIContent, 
  PublishResult, 
  ValidationResult, 
  Collection,
  PlatformType,
} from '../types/content';

export class AIContentPublisher {
  private configManager: ConfigManager;
  private validator: ContentValidator;
  
  // CMS Adapters
  private webflowAdapter?: WebflowAdapter;
  private wordpressAdapter?: WordPressAdapter;
  private ghostAdapter?: GhostAdapter;
  private mediumAdapter?: MediumAdapter;
  
  // Social Media Adapters
  private linkedinAdapter?: LinkedInAdapter;
  private twitterAdapter?: TwitterAdapter;
  
  // Newsletter Adapters
  private substackAdapter?: SubstackAdapter;

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
    // CMS Adapters
    const webflowConfig = this.configManager.getWebflowConfig();
    if (webflowConfig) {
      this.webflowAdapter = new WebflowAdapter(webflowConfig);
    }

    const wordpressConfig = this.configManager.getWordPressConfig();
    if (wordpressConfig) {
      this.wordpressAdapter = new WordPressAdapter(wordpressConfig);
    }

    const ghostConfig = this.configManager.getGhostConfig();
    if (ghostConfig) {
      this.ghostAdapter = new GhostAdapter(ghostConfig);
    }

    const mediumConfig = this.configManager.getMediumConfig();
    if (mediumConfig) {
      this.mediumAdapter = new MediumAdapter(mediumConfig);
    }

    // Social Media Adapters
    const linkedinConfig = this.configManager.getLinkedInConfig();
    if (linkedinConfig) {
      this.linkedinAdapter = new LinkedInAdapter(linkedinConfig);
    }

    const twitterConfig = this.configManager.getTwitterConfig();
    if (twitterConfig) {
      this.twitterAdapter = new TwitterAdapter(twitterConfig);
    }

    // Newsletter Adapters
    const substackConfig = this.configManager.getSubstackConfig();
    if (substackConfig) {
      this.substackAdapter = new SubstackAdapter(substackConfig);
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
   * Configure Ghost integration
   */
  async configureGhost(siteUrl: string, adminApiKey: string, options?: {
    contentApiKey?: string;
    defaultTag?: string;
    defaultAuthor?: string;
  }): Promise<void> {
    const config: GhostConfig = {
      siteUrl,
      adminApiKey,
      contentApiKey: options?.contentApiKey,
      defaultTag: options?.defaultTag,
      defaultAuthor: options?.defaultAuthor,
    };

    this.configManager.setGhostConfig(config);
    this.ghostAdapter = new GhostAdapter(config);

    // Test the connection
    const testResult = await this.ghostAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`Ghost configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Configure Medium integration
   */
  async configureMedium(accessToken: string, userId: string, options?: {
    defaultPublication?: string;
    defaultTags?: string[];
  }): Promise<void> {
    const config: MediumConfig = {
      accessToken,
      userId,
      defaultPublication: options?.defaultPublication,
      defaultTags: options?.defaultTags,
    };

    this.configManager.setMediumConfig(config);
    this.mediumAdapter = new MediumAdapter(config);

    // Test the connection
    const testResult = await this.mediumAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`Medium configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Configure LinkedIn integration
   */
  async configureLinkedIn(accessToken: string, userId: string, options?: {
    organizationId?: string;
    defaultHashtags?: string[];
  }): Promise<void> {
    const config: LinkedInConfig = {
      accessToken,
      userId,
      organizationId: options?.organizationId,
      defaultHashtags: options?.defaultHashtags,
    };

    this.configManager.setLinkedInConfig(config);
    this.linkedinAdapter = new LinkedInAdapter(config);

    // Test the connection
    const testResult = await this.linkedinAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`LinkedIn configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Configure Twitter integration
   */
  async configureTwitter(apiKey: string, apiSecret: string, accessToken: string, accessTokenSecret: string, options?: {
    bearerToken?: string;
    defaultHashtags?: string[];
  }): Promise<void> {
    const config: TwitterConfig = {
      apiKey,
      apiSecret,
      accessToken,
      accessTokenSecret,
      bearerToken: options?.bearerToken,
      defaultHashtags: options?.defaultHashtags,
    };

    this.configManager.setTwitterConfig(config);
    this.twitterAdapter = new TwitterAdapter(config);

    // Test the connection
    const testResult = await this.twitterAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`Twitter configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Configure Substack integration
   */
  async configureSubstack(apiKey: string, publicationId: string, options?: {
    defaultSection?: string;
  }): Promise<void> {
    const config: SubstackConfig = {
      apiKey,
      publicationId,
      defaultSection: options?.defaultSection,
    };

    this.configManager.setSubstackConfig(config);
    this.substackAdapter = new SubstackAdapter(config);

    // Test the connection
    const testResult = await this.substackAdapter.testConnection();
    if (!testResult.success) {
      throw new Error(`Substack configuration failed: ${testResult.error}`);
    }
  }

  /**
   * Main method to publish content to specified platform
   */
  async publish(content: AIContent, platform: PlatformType): Promise<PublishResult> {
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
      // CMS Platforms
      case 'webflow':
        return this.publishToWebflow(content);
      case 'wordpress':
        return this.publishToWordPress(content);
      case 'ghost':
        return this.publishToGhost(content);
      case 'medium':
        return this.publishToMedium(content);
      
      // Social Media Platforms
      case 'linkedin':
        return this.publishToLinkedIn(content);
      case 'twitter':
        return this.publishToTwitter(content);
      
      // Newsletter Platforms
      case 'substack':
        return this.publishToSubstack(content);
      
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
  async publishToMultiple(content: AIContent, platforms: PlatformType[]): Promise<PublishResult[]> {
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
  async getAvailableCollections(platform: PlatformType): Promise<Collection[]> {
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

      case 'ghost': {
        if (!this.ghostAdapter) return [];
        return await this.ghostAdapter.getAvailableCollections();
      }

      case 'medium': {
        if (!this.mediumAdapter) return [];
        return await this.mediumAdapter.getPublications();
      }

      case 'substack': {
        if (!this.substackAdapter) return [];
        return await this.substackAdapter.getSections();
      }
        
      default:
        return [];
    }
  }

  /**
   * Test connection to a specific platform
   */
  async testConnection(platform: PlatformType): Promise<APIResponse> {
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

      case 'ghost':
        if (!this.ghostAdapter) {
          return { success: false, error: 'Ghost not configured' };
        }
        return this.ghostAdapter.testConnection();

      case 'medium':
        if (!this.mediumAdapter) {
          return { success: false, error: 'Medium not configured' };
        }
        return this.mediumAdapter.testConnection();

      case 'linkedin':
        if (!this.linkedinAdapter) {
          return { success: false, error: 'LinkedIn not configured' };
        }
        return this.linkedinAdapter.testConnection();

      case 'twitter':
        if (!this.twitterAdapter) {
          return { success: false, error: 'Twitter not configured' };
        }
        return this.twitterAdapter.testConnection();

      case 'substack':
        if (!this.substackAdapter) {
          return { success: false, error: 'Substack not configured' };
        }
        return this.substackAdapter.testConnection();
        
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
      ghost: this.configManager.isConfigured('ghost'),
      medium: this.configManager.isConfigured('medium'),
      linkedin: this.configManager.isConfigured('linkedin'),
      twitter: this.configManager.isConfigured('twitter'),
      substack: this.configManager.isConfigured('substack'),
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
    platform: PlatformType,
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
   * Private method to publish to Ghost
   */
  private async publishToGhost(content: AIContent): Promise<PublishResult> {
    if (!this.ghostAdapter) {
      return this.createErrorResult('ghost', 'Ghost not configured. Call configureGhost() first.');
    }
    return this.ghostAdapter.publishContent(content);
  }

  /**
   * Private method to publish to Medium
   */
  private async publishToMedium(content: AIContent): Promise<PublishResult> {
    if (!this.mediumAdapter) {
      return this.createErrorResult('medium', 'Medium not configured. Call configureMedium() first.');
    }
    return this.mediumAdapter.publishContent(content);
  }

  /**
   * Private method to publish to LinkedIn
   */
  private async publishToLinkedIn(content: AIContent): Promise<PublishResult> {
    if (!this.linkedinAdapter) {
      return this.createErrorResult('linkedin', 'LinkedIn not configured. Call configureLinkedIn() first.');
    }
    return this.linkedinAdapter.publishContent(content);
  }

  /**
   * Private method to publish to Twitter
   */
  private async publishToTwitter(content: AIContent): Promise<PublishResult> {
    if (!this.twitterAdapter) {
      return this.createErrorResult('twitter', 'Twitter not configured. Call configureTwitter() first.');
    }
    return this.twitterAdapter.publishContent(content);
  }

  /**
   * Private method to publish to Substack
   */
  private async publishToSubstack(content: AIContent): Promise<PublishResult> {
    if (!this.substackAdapter) {
      return this.createErrorResult('substack', 'Substack not configured. Call configureSubstack() first.');
    }
    return this.substackAdapter.publishContent(content);
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
  private createErrorResult(platform: PlatformType, message: string): PublishResult {
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
