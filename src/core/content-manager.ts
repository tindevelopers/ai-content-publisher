/**
 * Comprehensive content management system that integrates testing, scheduling, and bulk publishing
 */

import { AIContent, PlatformType, PublishResult } from '../types/content';
import { AIContentPublisher } from './ai-content-publisher';
import { ContentTester, ContentTestResult } from './content-tester';
import { ContentScheduler, QueuedContent, ScheduleConfig } from './content-scheduler';
import { BulkPublisher, BulkPublishItem, BulkPublishConfig } from './bulk-publisher';

export interface ContentManagerConfig {
  publisher: AIContentPublisher;
  scheduleConfig?: ScheduleConfig;
  bulkPublishConfig?: BulkPublishConfig;
  autoTest?: boolean;
  autoOptimize?: boolean;
}

export interface ContentOptimizationResult {
  originalContent: AIContent;
  optimizedContent: AIContent;
  improvements: string[];
  scoreImprovement: number;
}

export interface PublishAllResult {
  success: boolean;
  totalItems: number;
  successfulItems: number;
  failedItems: number;
  results: Map<string, PublishResult[]>;
  errors: string[];
  summary: {
    totalPublishes: number;
    successfulPublishes: number;
    failedPublishes: number;
    averageScore: number;
  };
}

export class ContentManager {
  private publisher: AIContentPublisher;
  private tester: ContentTester;
  private scheduler?: ContentScheduler;
  private bulkPublisher: BulkPublisher;
  private config: ContentManagerConfig;

  constructor(config: ContentManagerConfig) {
    this.publisher = config.publisher;
    this.tester = new ContentTester();
    this.config = config;

    // Initialize bulk publisher
    this.bulkPublisher = new BulkPublisher(
      this.publisher,
      config.bulkPublishConfig || {
        platforms: ['webflow', 'wordpress'],
        concurrency: 3,
        autoTest: true,
      },
    );

    // Initialize scheduler if config provided
    if (config.scheduleConfig) {
      this.scheduler = new ContentScheduler(this.publisher, config.scheduleConfig);
    }
  }

  /**
   * Test content for all available platforms
   */
  async testContentForAllPlatforms(content: AIContent, platforms?: PlatformType[]): Promise<Map<PlatformType, ContentTestResult>> {
    const targetPlatforms = platforms || this.getAvailablePlatforms();
    return this.tester.testContentForMultiplePlatforms(content, targetPlatforms);
  }

  /**
   * Optimize content for specific platforms
   */
  async optimizeContentForPlatforms(content: AIContent, platforms: PlatformType[]): Promise<ContentOptimizationResult> {
    const testResults = await this.testContentForAllPlatforms(content, platforms);
    const originalScore = this.calculateAverageScore(testResults);
    
    const optimizedContent = { ...content };
    const improvements: string[] = [];
    let scoreImprovement = 0;

    // Optimize based on test results
    for (const [platform, result] of testResults) {
      if (!result.isCompatible) {
        const optimization = this.optimizeForPlatform(optimizedContent, platform, result);
        optimizedContent.title = optimization.title;
        optimizedContent.content = optimization.content;
        optimizedContent.excerpt = optimization.excerpt;
        optimizedContent.tags = optimization.tags;
        
        improvements.push(...optimization.improvements);
      }
    }

    // Re-test optimized content
    const optimizedTestResults = await this.testContentForAllPlatforms(optimizedContent, platforms);
    const optimizedScore = this.calculateAverageScore(optimizedTestResults);
    scoreImprovement = optimizedScore - originalScore;

    return {
      originalContent: content,
      optimizedContent,
      improvements,
      scoreImprovement,
    };
  }

  /**
   * Publish content immediately to specified platforms
   */
  async publishNow(content: AIContent, platforms: PlatformType[]): Promise<PublishResult[]> {
    console.log(`Publishing content immediately to: ${platforms.join(', ')}`);
    
    // Test content first if auto-test is enabled
    if (this.config.autoTest) {
      const testResults = await this.testContentForAllPlatforms(content, platforms);
      const incompatiblePlatforms = Array.from(testResults.entries())
        .filter(([, result]) => !result.isCompatible)
        .map(([platform]) => platform);

      if (incompatiblePlatforms.length > 0) {
        console.warn(`Content may not be optimal for: ${incompatiblePlatforms.join(', ')}`);
        
        // Auto-optimize if enabled
        if (this.config.autoOptimize) {
          const optimization = await this.optimizeContentForPlatforms(content, platforms);
          console.log(`Content optimized, score improved by ${optimization.scoreImprovement} points`);
          return this.publisher.publishToMultiple(optimization.optimizedContent, platforms);
        }
      }
    }

    return this.publisher.publishToMultiple(content, platforms);
  }

  /**
   * Publish all ready content immediately
   */
  async publishAllNow(): Promise<PublishAllResult> {
    console.log('Publishing all ready content immediately');
    
    // Get all ready content from scheduler and bulk publisher
    const schedulerReady = this.scheduler?.getReadyContent() || [];
    const bulkReady = this.bulkPublisher.getItemsByStatus('ready');

    if (schedulerReady.length === 0 && bulkReady.length === 0) {
      console.log('No content ready for immediate publishing');
      return this.bulkPublisher['createEmptyResult']();
    }

    // Combine all ready content
    const allReadyContent: Array<{ content: AIContent; platforms: PlatformType[] }> = [];

    // Add scheduler content
    for (const queuedContent of schedulerReady) {
      allReadyContent.push({
        content: queuedContent.content,
        platforms: queuedContent.platforms,
      });
    }

    // Add bulk publisher content
    for (const bulkItem of bulkReady) {
      allReadyContent.push({
        content: bulkItem.content,
        platforms: bulkItem.platforms,
      });
    }

    // Add to bulk publisher and publish
    this.bulkPublisher.addItems(allReadyContent);
    const result = await this.bulkPublisher.publishAll();

    // Update scheduler items
    if (this.scheduler) {
      for (const queuedContent of schedulerReady) {
        const publishResults = result.results.get(queuedContent.id);
        if (publishResults) {
          this.scheduler.updateQueuedContent(queuedContent.id, {
            status: publishResults.every(r => r.success) ? 'published' : 'failed',
            publishResults,
          });
        }
      }
    }

    return result;
  }

  /**
   * Schedule content for publishing
   */
  async scheduleContent(content: AIContent, platforms: PlatformType[], options?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    scheduledFor?: Date;
    autoSchedule?: boolean;
  }): Promise<QueuedContent> {
    if (!this.scheduler) {
      throw new Error('Scheduler not configured. Please provide scheduleConfig in ContentManagerConfig.');
    }

    return this.scheduler.addToQueue(content, platforms, options);
  }

  /**
   * Add content to bulk publishing queue
   */
  addToBulkQueue(content: AIContent, platforms: PlatformType[], priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): BulkPublishItem {
    return this.bulkPublisher.addItem(content, platforms, priority);
  }

  /**
   * Start the scheduling system
   */
  startScheduler(): void {
    if (!this.scheduler) {
      throw new Error('Scheduler not configured. Please provide scheduleConfig in ContentManagerConfig.');
    }
    this.scheduler.start();
  }

  /**
   * Stop the scheduling system
   */
  stopScheduler(): void {
    if (this.scheduler) {
      this.scheduler.stop();
    }
  }

  /**
   * Get comprehensive status of all systems
   */
  getStatus(): {
    scheduler?: {
      isRunning: boolean;
      queueSize: number;
      readyCount: number;
      failedCount: number;
      nextRun?: Date;
    };
    bulkPublisher: {
      isPublishing: boolean;
      totalItems: number;
      pendingCount: number;
      readyCount: number;
      publishedCount: number;
      failedCount: number;
    };
    configuredPlatforms: PlatformType[];
  } {
    return {
      scheduler: this.scheduler?.getStatus(),
      bulkPublisher: this.bulkPublisher.getStatus(),
      configuredPlatforms: this.getAvailablePlatforms(),
    };
  }

  /**
   * Get all queued content from both systems
   */
  getAllQueuedContent(): {
    scheduled: QueuedContent[];
    bulk: BulkPublishItem[];
  } {
    return {
      scheduled: this.scheduler?.getAllQueuedContent() || [],
      bulk: this.bulkPublisher.getAllItems(),
    };
  }

  /**
   * Test and optimize all pending content
   */
  async testAndOptimizeAllPending(): Promise<void> {
    console.log('Testing and optimizing all pending content');

    // Test scheduler content
    if (this.scheduler) {
      const scheduledContent = this.scheduler.getAllQueuedContent();
      for (const queuedContent of scheduledContent) {
        if (queuedContent.status === 'pending') {
          await this.scheduler.testContent(queuedContent);
        }
      }
    }

    // Test bulk publisher content
    await this.bulkPublisher.testAllItems();
  }

  /**
   * Get available platforms based on configuration
   */
  private getAvailablePlatforms(): PlatformType[] {
    const status = this.publisher.getConfigurationStatus();
    return Object.entries(status)
      .filter(([, isConfigured]) => isConfigured)
      .map(([platform]) => platform as PlatformType);
  }

  /**
   * Calculate average score from test results
   */
  private calculateAverageScore(testResults: Map<PlatformType, ContentTestResult>): number {
    const scores = Array.from(testResults.values()).map(result => result.score);
    return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
  }

  /**
   * Optimize content for a specific platform
   */
  private optimizeForPlatform(content: AIContent, platform: PlatformType, testResult: ContentTestResult): {
    title: string;
    content: string;
    excerpt: string;
    tags: string[];
    improvements: string[];
  } {
    let optimizedTitle = content.title;
    let optimizedContent = content.content;
    let optimizedExcerpt = content.excerpt || '';
    let optimizedTags = content.tags || [];
    const improvements: string[] = [];

    // Optimize based on issues
    for (const issue of testResult.issues) {
      switch (issue.field) {
        case 'title':
          if (issue.type === 'error' && issue.message.includes('too long')) {
            optimizedTitle = this.truncateText(optimizedTitle, 200);
            improvements.push('Shortened title for better compatibility');
          }
          break;

        case 'content':
          if (issue.type === 'error' && issue.message.includes('too long')) {
            optimizedContent = this.truncateText(optimizedContent, 1000);
            improvements.push('Shortened content for better compatibility');
          }
          break;

        case 'excerpt':
          if (issue.type === 'warning' && issue.message.includes('too long')) {
            optimizedExcerpt = this.truncateText(optimizedExcerpt, 300);
            improvements.push('Shortened excerpt for better compatibility');
          }
          break;

        case 'tags':
          if (issue.type === 'warning' && issue.message.includes('too many')) {
            optimizedTags = optimizedTags.slice(0, 5);
            improvements.push('Reduced number of tags for better compatibility');
          }
          break;
      }
    }

    return {
      title: optimizedTitle,
      content: optimizedContent,
      excerpt: optimizedExcerpt,
      tags: optimizedTags,
      improvements,
    };
  }

  /**
   * Truncate text to specified length
   */
  private truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    
    const truncated = text.substring(0, maxLength - 3);
    const lastSpace = truncated.lastIndexOf(' ');
    
    if (lastSpace > maxLength * 0.8) {
      return truncated.substring(0, lastSpace) + '...';
    }
    
    return truncated + '...';
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<ContentManagerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    
    if (newConfig.scheduleConfig && this.scheduler) {
      this.scheduler.updateConfig(newConfig.scheduleConfig);
    }
    
    if (newConfig.bulkPublishConfig) {
      this.bulkPublisher.updateConfig(newConfig.bulkPublishConfig);
    }
    
    console.log('Content manager configuration updated');
  }
}
