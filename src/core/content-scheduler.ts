/**
 * Content scheduling system for automated publishing
 */

import { AIContent, PlatformType, PublishResult } from '../types/content';
import { AIContentPublisher } from './ai-content-publisher';
import { ContentTester, ContentTestResult } from './content-tester';

export interface ScheduleConfig {
  platforms: PlatformType[];
  frequency: ScheduleFrequency;
  timezone?: string;
  optimalTimes?: {
    [platform in PlatformType]?: OptimalTime[];
  };
  contentQueue?: QueuedContent[];
  autoTest?: boolean;
  retryFailed?: boolean;
  maxRetries?: number;
}

export interface ScheduleFrequency {
  type: 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';
  interval?: number; // for custom frequency
  days?: number[]; // 0-6 for weekly, 1-31 for monthly
  time?: string; // HH:MM format
  startDate?: Date;
  endDate?: Date;
}

export interface OptimalTime {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  engagement: number; // 0-100 engagement score
}

export interface QueuedContent {
  id: string;
  content: AIContent;
  platforms: PlatformType[];
  scheduledFor: Date;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'testing' | 'ready' | 'publishing' | 'published' | 'failed';
  testResults?: Map<PlatformType, ContentTestResult>;
  publishResults?: PublishResult[];
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleResult {
  success: boolean;
  scheduledContent: QueuedContent[];
  errors: string[];
  nextRun?: Date;
}

export class ContentScheduler {
  private publisher: AIContentPublisher;
  private tester: ContentTester;
  private scheduleConfig: ScheduleConfig;
  private contentQueue: Map<string, QueuedContent> = new Map();
  private isRunning: boolean = false;
  private intervalId?: NodeJS.Timeout;

  constructor(publisher: AIContentPublisher, config: ScheduleConfig) {
    this.publisher = publisher;
    this.tester = new ContentTester();
    this.scheduleConfig = config;
    
    // Initialize content queue if provided
    if (config.contentQueue) {
      config.contentQueue.forEach(item => {
        this.contentQueue.set(item.id, item);
      });
    }
  }

  /**
   * Start the scheduling system
   */
  start(): void {
    if (this.isRunning) {
      console.warn('Scheduler is already running');
      return;
    }

    this.isRunning = true;
    console.log('Content scheduler started');

    // Start the main scheduling loop
    this.startSchedulingLoop();
  }

  /**
   * Stop the scheduling system
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn('Scheduler is not running');
      return;
    }

    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = undefined;
    }

    console.log('Content scheduler stopped');
  }

  /**
   * Add content to the publishing queue
   */
  addToQueue(content: AIContent, platforms: PlatformType[], options?: {
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    scheduledFor?: Date;
    autoSchedule?: boolean;
  }): QueuedContent {
    const id = this.generateContentId();
    const priority = options?.priority || 'medium';
    const scheduledFor = options?.scheduledFor || this.calculateOptimalTime(platforms);
    
    const queuedContent: QueuedContent = {
      id,
      content,
      platforms,
      scheduledFor,
      priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.contentQueue.set(id, queuedContent);

    // Auto-test if enabled
    if (this.scheduleConfig.autoTest) {
      this.testContent(queuedContent);
    }

    console.log(`Content added to queue: ${id}, scheduled for: ${scheduledFor.toISOString()}`);
    return queuedContent;
  }

  /**
   * Remove content from the queue
   */
  removeFromQueue(contentId: string): boolean {
    return this.contentQueue.delete(contentId);
  }

  /**
   * Update content in the queue
   */
  updateQueuedContent(contentId: string, updates: Partial<QueuedContent>): boolean {
    const content = this.contentQueue.get(contentId);
    if (!content) {
      return false;
    }

    const updatedContent = {
      ...content,
      ...updates,
      updatedAt: new Date(),
    };

    this.contentQueue.set(contentId, updatedContent);
    return true;
  }

  /**
   * Get content from the queue
   */
  getQueuedContent(contentId: string): QueuedContent | undefined {
    return this.contentQueue.get(contentId);
  }

  /**
   * Get all queued content
   */
  getAllQueuedContent(): QueuedContent[] {
    return Array.from(this.contentQueue.values());
  }

  /**
   * Get content ready for publishing
   */
  getReadyContent(): QueuedContent[] {
    const now = new Date();
    return Array.from(this.contentQueue.values())
      .filter(content => 
        content.status === 'ready' && 
        content.scheduledFor <= now
      )
      .sort((a, b) => {
        // Sort by priority first, then by scheduled time
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return a.scheduledFor.getTime() - b.scheduledFor.getTime();
      });
  }

  /**
   * Publish all ready content
   */
  async publishAllReady(): Promise<ScheduleResult> {
    const readyContent = this.getReadyContent();
    const results: PublishResult[] = [];
    const errors: string[] = [];

    console.log(`Publishing ${readyContent.length} ready content items`);

    for (const queuedContent of readyContent) {
      try {
        // Update status to publishing
        this.updateQueuedContent(queuedContent.id, { status: 'publishing' });

        // Publish to all platforms
        const publishResults = await this.publisher.publishToMultiple(
          queuedContent.content,
          queuedContent.platforms
        );

        // Update with results
        this.updateQueuedContent(queuedContent.id, {
          status: this.allSuccessful(publishResults) ? 'published' : 'failed',
          publishResults,
        });

        results.push(...publishResults);

        console.log(`Published content ${queuedContent.id}:`, publishResults);

      } catch (error: any) {
        const errorMessage = `Failed to publish content ${queuedContent.id}: ${error.message}`;
        errors.push(errorMessage);
        
        // Update status to failed
        this.updateQueuedContent(queuedContent.id, { 
          status: 'failed',
          retryCount: (queuedContent.retryCount || 0) + 1,
        });

        console.error(errorMessage);
      }
    }

    return {
      success: errors.length === 0,
      scheduledContent: readyContent,
      errors,
    };
  }

  /**
   * Test content for all platforms
   */
  async testContent(queuedContent: QueuedContent): Promise<void> {
    this.updateQueuedContent(queuedContent.id, { status: 'testing' });

    try {
      const testResults = this.tester.testContentForMultiplePlatforms(
        queuedContent.content,
        queuedContent.platforms
      );

      const isReady = Array.from(testResults.values()).every(result => result.isCompatible);
      
      this.updateQueuedContent(queuedContent.id, {
        status: isReady ? 'ready' : 'pending',
        testResults,
      });

      console.log(`Content ${queuedContent.id} tested:`, isReady ? 'ready' : 'needs attention');

    } catch (error: any) {
      console.error(`Failed to test content ${queuedContent.id}:`, error.message);
      this.updateQueuedContent(queuedContent.id, { status: 'pending' });
    }
  }

  /**
   * Start the main scheduling loop
   */
  private startSchedulingLoop(): void {
    // Check every minute for content ready to publish
    this.intervalId = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.processScheduledContent();
      } catch (error: any) {
        console.error('Error in scheduling loop:', error.message);
      }
    }, 60000); // Check every minute

    // Also run immediately
    this.processScheduledContent();
  }

  /**
   * Process scheduled content
   */
  private async processScheduledContent(): Promise<void> {
    const readyContent = this.getReadyContent();
    
    if (readyContent.length > 0) {
      console.log(`Found ${readyContent.length} content items ready for publishing`);
      await this.publishAllReady();
    }

    // Retry failed content if enabled
    if (this.scheduleConfig.retryFailed) {
      await this.retryFailedContent();
    }
  }

  /**
   * Retry failed content
   */
  private async retryFailedContent(): Promise<void> {
    const failedContent = Array.from(this.contentQueue.values())
      .filter(content => 
        content.status === 'failed' && 
        (content.retryCount || 0) < (this.scheduleConfig.maxRetries || 3)
      );

    for (const content of failedContent) {
      console.log(`Retrying failed content: ${content.id}`);
      
      // Reset status and retry
      this.updateQueuedContent(content.id, { 
        status: 'pending',
        scheduledFor: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
      });
    }
  }

  /**
   * Calculate optimal publishing time for platforms
   */
  private calculateOptimalTime(platforms: PlatformType[]): Date {
    const now = new Date();
    const optimalTimes = this.scheduleConfig.optimalTimes;
    
    if (!optimalTimes) {
      // Default to 1 hour from now
      return new Date(now.getTime() + 60 * 60 * 1000);
    }

    // Find the best time across all platforms
    let bestTime = new Date(now.getTime() + 60 * 60 * 1000); // Default: 1 hour from now
    let bestScore = 0;

    for (const platform of platforms) {
      const platformTimes = optimalTimes[platform];
      if (platformTimes) {
        for (const time of platformTimes) {
          const scheduledTime = this.createTimeForDay(now, time.dayOfWeek, time.hour);
          
          // Only consider future times
          if (scheduledTime > now && time.engagement > bestScore) {
            bestTime = scheduledTime;
            bestScore = time.engagement;
          }
        }
      }
    }

    return bestTime;
  }

  /**
   * Create a date for a specific day of week and hour
   */
  private createTimeForDay(baseDate: Date, dayOfWeek: number, hour: number): Date {
    const date = new Date(baseDate);
    const currentDay = date.getDay();
    const daysUntilTarget = (dayOfWeek - currentDay + 7) % 7;
    
    date.setDate(date.getDate() + daysUntilTarget);
    date.setHours(hour, 0, 0, 0);
    
    return date;
  }

  /**
   * Check if all publish results were successful
   */
  private allSuccessful(results: PublishResult[]): boolean {
    return results.every(result => result.success);
  }

  /**
   * Generate unique content ID
   */
  private generateContentId(): string {
    return `content_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isRunning: boolean;
    queueSize: number;
    readyCount: number;
    failedCount: number;
    nextRun?: Date;
  } {
    const allContent = Array.from(this.contentQueue.values());
    const readyCount = allContent.filter(c => c.status === 'ready').length;
    const failedCount = allContent.filter(c => c.status === 'failed').length;
    
    const nextReady = allContent
      .filter(c => c.status === 'ready')
      .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime())[0];

    return {
      isRunning: this.isRunning,
      queueSize: this.contentQueue.size,
      readyCount,
      failedCount,
      nextRun: nextReady?.scheduledFor,
    };
  }

  /**
   * Update schedule configuration
   */
  updateConfig(newConfig: Partial<ScheduleConfig>): void {
    this.scheduleConfig = { ...this.scheduleConfig, ...newConfig };
    console.log('Schedule configuration updated');
  }
}
