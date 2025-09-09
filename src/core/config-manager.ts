/**
 * Configuration manager for handling API keys and platform configurations
 */

import { 
  PublisherConfig, 
  WebflowConfig, 
  WordPressConfig, 
  GhostConfig,
  MediumConfig,
  LinkedInConfig,
  TwitterConfig,
  SubstackConfig,
  PlatformConfig 
} from '../types/config';

export class ConfigManager {
  private configs: Map<string, PlatformConfig> = new Map();
  private globalConfig: Partial<PublisherConfig> = {};

  constructor(config?: PublisherConfig) {
    if (config) {
      this.setGlobalConfig(config);
    }
  }

  /**
   * Set global configuration
   */
  setGlobalConfig(config: PublisherConfig): void {
    this.globalConfig = { ...this.globalConfig, ...config };
    
    if (config.webflow) {
      this.setWebflowConfig(config.webflow);
    }
    
    if (config.wordpress) {
      this.setWordPressConfig(config.wordpress);
    }
  }

  /**
   * Configure Webflow integration
   */
  setWebflowConfig(config: WebflowConfig): void {
    this.validateWebflowConfig(config);
    
    this.configs.set('webflow', {
      type: 'webflow',
      config: {
        ...config,
        baseUrl: config.baseUrl || 'https://api.webflow.com',
      },
      isConfigured: true,
    });
  }

  /**
   * Configure WordPress integration
   */
  setWordPressConfig(config: WordPressConfig): void {
    this.validateWordPressConfig(config);
    
    this.configs.set('wordpress', {
      type: 'wordpress',
      config: {
        ...config,
        apiVersion: config.apiVersion || 'wp/v2',
      },
      isConfigured: true,
    });
  }

  /**
   * Configure Ghost integration
   */
  setGhostConfig(config: GhostConfig): void {
    this.configs.set('ghost', {
      type: 'ghost',
      config,
      isConfigured: true,
    });
  }

  /**
   * Configure Medium integration
   */
  setMediumConfig(config: MediumConfig): void {
    this.configs.set('medium', {
      type: 'medium',
      config,
      isConfigured: true,
    });
  }

  /**
   * Configure LinkedIn integration
   */
  setLinkedInConfig(config: LinkedInConfig): void {
    this.configs.set('linkedin', {
      type: 'linkedin',
      config,
      isConfigured: true,
    });
  }

  /**
   * Configure Twitter integration
   */
  setTwitterConfig(config: TwitterConfig): void {
    this.configs.set('twitter', {
      type: 'twitter',
      config,
      isConfigured: true,
    });
  }

  /**
   * Configure Substack integration
   */
  setSubstackConfig(config: SubstackConfig): void {
    this.configs.set('substack', {
      type: 'substack',
      config,
      isConfigured: true,
    });
  }

  /**
   * Get configuration for a specific platform
   */
  getConfig(platform: string): PlatformConfig | undefined {
    return this.configs.get(platform);
  }

  /**
   * Get Webflow configuration
   */
  getWebflowConfig(): WebflowConfig | undefined {
    const config = this.configs.get('webflow');
    return config?.config as WebflowConfig;
  }

  /**
   * Get WordPress configuration
   */
  getWordPressConfig(): WordPressConfig | undefined {
    const config = this.configs.get('wordpress');
    return config?.config as WordPressConfig;
  }

  /**
   * Get Ghost configuration
   */
  getGhostConfig(): GhostConfig | undefined {
    const config = this.configs.get('ghost');
    return config?.config as GhostConfig;
  }

  /**
   * Get Medium configuration
   */
  getMediumConfig(): MediumConfig | undefined {
    const config = this.configs.get('medium');
    return config?.config as MediumConfig;
  }

  /**
   * Get LinkedIn configuration
   */
  getLinkedInConfig(): LinkedInConfig | undefined {
    const config = this.configs.get('linkedin');
    return config?.config as LinkedInConfig;
  }

  /**
   * Get Twitter configuration
   */
  getTwitterConfig(): TwitterConfig | undefined {
    const config = this.configs.get('twitter');
    return config?.config as TwitterConfig;
  }

  /**
   * Get Substack configuration
   */
  getSubstackConfig(): SubstackConfig | undefined {
    const config = this.configs.get('substack');
    return config?.config as SubstackConfig;
  }

  /**
   * Get global configuration
   */
  getGlobalConfig(): Partial<PublisherConfig> {
    return this.globalConfig;
  }

  /**
   * Check if a platform is configured
   */
  isConfigured(platform: string): boolean {
    const config = this.configs.get(platform);
    return config?.isConfigured || false;
  }

  /**
   * Get all configured platforms
   */
  getConfiguredPlatforms(): string[] {
    return Array.from(this.configs.entries())
      .filter(([, config]) => config.isConfigured)
      .map(([platform]) => platform);
  }

  /**
   * Remove configuration for a platform
   */
  removeConfig(platform: 'webflow' | 'wordpress'): void {
    this.configs.delete(platform);
  }

  /**
   * Clear all configurations
   */
  clearAll(): void {
    this.configs.clear();
    this.globalConfig = {};
  }

  /**
   * Validate Webflow configuration
   */
  private validateWebflowConfig(config: WebflowConfig): void {
    if (!config.apiKey || config.apiKey.trim() === '') {
      throw new Error('Webflow API key is required');
    }
    
    if (!config.siteId || config.siteId.trim() === '') {
      throw new Error('Webflow site ID is required');
    }
    
    // Validate API key format (basic check)
    if (!config.apiKey.match(/^[a-f0-9]{64}$/)) {
      console.warn('Webflow API key format may be invalid. Expected 64-character hexadecimal string.');
    }
  }

  /**
   * Validate WordPress configuration
   */
  private validateWordPressConfig(config: WordPressConfig): void {
    if (!config.siteUrl || config.siteUrl.trim() === '') {
      throw new Error('WordPress site URL is required');
    }
    
    if (!config.username || config.username.trim() === '') {
      throw new Error('WordPress username is required');
    }
    
    if (!config.password || config.password.trim() === '') {
      throw new Error('WordPress password is required');
    }
    
    // Validate URL format
    try {
      new URL(config.siteUrl);
    } catch {
      throw new Error('Invalid WordPress site URL format');
    }
    
    // Ensure URL ends with wp-json
    if (!config.siteUrl.includes('/wp-json')) {
      config.siteUrl = config.siteUrl.replace(/\/$/, '') + '/wp-json';
    }
  }

  /**
   * Export configuration (without sensitive data)
   */
  exportConfig(): Record<string, any> {
    const exported: Record<string, any> = {};
    
    this.configs.forEach((config, platform) => {
      exported[platform] = {
        type: config.type,
        isConfigured: config.isConfigured,
        // Only export non-sensitive configuration
        ...(platform === 'webflow' && {
          siteId: (config.config as WebflowConfig).siteId,
          baseUrl: (config.config as WebflowConfig).baseUrl,
        }),
        ...(platform === 'wordpress' && {
          siteUrl: (config.config as WordPressConfig).siteUrl,
          username: (config.config as WordPressConfig).username,
          apiVersion: (config.config as WordPressConfig).apiVersion,
        }),
      };
    });
    
    return {
      platforms: exported,
      globalConfig: {
        timeout: this.globalConfig.timeout,
        debug: this.globalConfig.debug,
        retryConfig: this.globalConfig.retryConfig,
      },
    };
  }
}
