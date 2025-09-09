/**
 * Bulk publishing system for managing multiple content items
 */

import { AIContent, PlatformType, PublishResult } from '../types/content';
import { AIContentPublisher } from './ai-content-publisher';
import { ContentTester, ContentTestResult } from './content-tester';

export interface BulkPublishConfig {
  platforms: PlatformType[];
  concurrency?: number;
  delayBetweenPublishes?: number; // milliseconds
  autoTest?: boolean;
  stopOnError?: boolean;
  retryFailed?: boolean;
  maxRetries?: number;
  retryDelay?: number; // milliseconds
}

export interface BulkPublishItem {
  id: string;
  content: AIContent;
  platforms: PlatformType[];
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'testing' | 'ready' | 'publishing' | 'published' | 'failed';
  testResults?: Map<PlatformType, ContentTestResult>;
  publishResults?: PublishResult[];
  retryCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BulkPublishResult {
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

export class BulkPublisher {
  private publisher: AIContentPublisher;
  private tester: ContentTester;
  private config: BulkPublishConfig;
  private items: Map<string, BulkPublishItem> = new Map();
  private isPublishing: boolean = false;

  constructor(publisher: AIContentPublisher, config: BulkPublishConfig) {
    this.publisher = publisher;
    this.tester = new ContentTester();
    this.config = {
      concurrency: 5,
      delayBetweenPublishes: 2000,
      autoTest: true,
      stopOnError: false,
      retryFailed: true,
      maxRetries: 3,
      retryDelay: 5000,
      ...config,
    };
  }

  /**
   * Add content items for bulk publishing
   */
  addItems(contentItems: Array<{
    content: AIContent;
    platforms: PlatformType[];
    priority?: 'low' | 'medium' | 'high' | 'urgent';
  }>): BulkPublishItem[] {
    const items: BulkPublishItem[] = [];

    for (const item of contentItems) {
      const id = this.generateItemId();
      const bulkItem: BulkPublishItem = {
        id,
        content: item.content,
        platforms: item.platforms,
        priority: item.priority || 'medium',
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      this.items.set(id, bulkItem);
      items.push(bulkItem);
    }

    console.log(`Added ${items.length} items for bulk publishing`);
    return items;
  }

  /**
   * Add a single content item
   */
  addItem(content: AIContent, platforms: PlatformType[], priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium'): BulkPublishItem {
    const id = this.generateItemId();
    const item: BulkPublishItem = {
      id,
      content,
      platforms,
      priority,
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.items.set(id, item);
    return item;
  }

  /**
   * Remove an item from bulk publishing
   */
  removeItem(itemId: string): boolean {
    return this.items.delete(itemId);
  }

  /**
   * Get all items
   */
  getAllItems(): BulkPublishItem[] {
    return Array.from(this.items.values());
  }

  /**
   * Get items by status
   */
  getItemsByStatus(status: BulkPublishItem['status']): BulkPublishItem[] {
    return Array.from(this.items.values()).filter(item => item.status === status);
  }

  /**
   * Test all pending items
   */
  async testAllItems(): Promise<void> {
    const pendingItems = this.getItemsByStatus('pending');
    console.log(`Testing ${pendingItems.length} pending items`);

    for (const item of pendingItems) {
      await this.testItem(item);
    }
  }

  /**
   * Test a single item
   */
  async testItem(item: BulkPublishItem): Promise<void> {
    this.updateItemStatus(item.id, 'testing');

    try {
      const testResults = this.tester.testContentForMultiplePlatforms(
        item.content,
        item.platforms
      );

      const isReady = Array.from(testResults.values()).every(result => result.isCompatible);
      
      this.updateItem(item.id, {
        status: isReady ? 'ready' : 'pending',
        testResults,
      });

      console.log(`Item ${item.id} tested:`, isReady ? 'ready' : 'needs attention');

    } catch (error: any) {
      console.error(`Failed to test item ${item.id}:`, error.message);
      this.updateItemStatus(item.id, 'pending');
    }
  }

  /**
   * Publish all ready items
   */
  async publishAll(): Promise<BulkPublishResult> {
    if (this.isPublishing) {
      throw new Error('Bulk publishing is already in progress');
    }

    this.isPublishing = true;
    console.log('Starting bulk publish operation');

    try {
      // Test items if auto-test is enabled
      if (this.config.autoTest) {
        await this.testAllItems();
      }

      const readyItems = this.getItemsByStatus('ready');
      if (readyItems.length === 0) {
        console.log('No items ready for publishing');
        return this.createEmptyResult();
      }

      // Sort items by priority
      const sortedItems = this.sortItemsByPriority(readyItems);

      // Publish items in batches
      const results = await this.publishItemsInBatches(sortedItems);

      return results;

    } finally {
      this.isPublishing = false;
    }
  }

  /**
   * Publish items in batches with concurrency control
   */
  private async publishItemsInBatches(items: BulkPublishItem[]): Promise<BulkPublishResult> {
    const results = new Map<string, PublishResult[]>();
    const errors: string[] = [];
    let successfulItems = 0;
    let failedItems = 0;
    let totalPublishes = 0;
    let successfulPublishes = 0;
    let failedPublishes = 0;
    let totalScore = 0;

    const concurrency = this.config.concurrency || 5;
    const delay = this.config.delayBetweenPublishes || 2000;

    // Process items in batches
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);
      console.log(`Processing batch ${Math.floor(i / concurrency) + 1}/${Math.ceil(items.length / concurrency)}`);

      // Process batch concurrently
      const batchPromises = batch.map(item => this.publishItem(item));
      const batchResults = await Promise.allSettled(batchPromises);

      // Process batch results
      for (let j = 0; j < batchResults.length; j++) {
        const result = batchResults[j];
        const item = batch[j];

        if (result.status === 'fulfilled') {
          const publishResults = result.value;
          results.set(item.id, publishResults);

          const itemSuccessful = publishResults.every(r => r.success);
          if (itemSuccessful) {
            successfulItems++;
            this.updateItemStatus(item.id, 'published');
          } else {
            failedItems++;
            this.updateItemStatus(item.id, 'failed');
          }

          // Update statistics
          totalPublishes += publishResults.length;
          successfulPublishes += publishResults.filter(r => r.success).length;
          failedPublishes += publishResults.filter(r => !r.success).length;

          // Calculate average score from test results
          if (item.testResults) {
            const scores = Array.from(item.testResults.values()).map(r => r.score);
            totalScore += scores.reduce((sum, score) => sum + score, 0) / scores.length;
          }

        } else {
          // Handle rejected promise
          const error = result.reason;
          errors.push(`Failed to publish item ${item.id}: ${error.message}`);
          failedItems++;
          this.updateItemStatus(item.id, 'failed');
        }
      }

      // Delay between batches to avoid overwhelming APIs
      if (i + concurrency < items.length) {
        await this.delay(delay);
      }
    }

    // Retry failed items if enabled
    if (this.config.retryFailed) {
      await this.retryFailedItems();
    }

    const averageScore = items.length > 0 ? totalScore / items.length : 0;

    return {
      success: failedItems === 0,
      totalItems: items.length,
      successfulItems,
      failedItems,
      results,
      errors,
      summary: {
        totalPublishes,
        successfulPublishes,
        failedPublishes,
        averageScore,
      },
    };
  }

  /**
   * Publish a single item
   */
  private async publishItem(item: BulkPublishItem): Promise<PublishResult[]> {
    this.updateItemStatus(item.id, 'publishing');

    try {
      const publishResults = await this.publisher.publishToMultiple(
        item.content,
        item.platforms
      );

      this.updateItem(item.id, {
        publishResults,
        status: publishResults.every(r => r.success) ? 'published' : 'failed',
      });

      return publishResults;

    } catch (error: any) {
      this.updateItemStatus(item.id, 'failed');
      throw error;
    }
  }

  /**
   * Retry failed items
   */
  private async retryFailedItems(): Promise<void> {
    const failedItems = this.getItemsByStatus('failed');
    const maxRetries = this.config.maxRetries || 3;

    for (const item of failedItems) {
      const retryCount = item.retryCount || 0;
      
      if (retryCount < maxRetries) {
        console.log(`Retrying failed item ${item.id} (attempt ${retryCount + 1}/${maxRetries})`);
        
        this.updateItem(item.id, {
          status: 'pending',
          retryCount: retryCount + 1,
        });

        // Wait before retrying
        await this.delay(this.config.retryDelay || 5000);
        
        // Retry the item
        try {
          await this.publishItem(item);
        } catch (error: any) {
          console.error(`Retry failed for item ${item.id}:`, error.message);
        }
      }
    }
  }

  /**
   * Sort items by priority
   */
  private sortItemsByPriority(items: BulkPublishItem[]): BulkPublishItem[] {
    const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 };
    
    return items.sort((a, b) => {
      const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      
      // If same priority, sort by creation time
      return a.createdAt.getTime() - b.createdAt.getTime();
    });
  }

  /**
   * Update item status
   */
  private updateItemStatus(itemId: string, status: BulkPublishItem['status']): void {
    this.updateItem(itemId, { status });
  }

  /**
   * Update item
   */
  private updateItem(itemId: string, updates: Partial<BulkPublishItem>): void {
    const item = this.items.get(itemId);
    if (item) {
      const updatedItem = {
        ...item,
        ...updates,
        updatedAt: new Date(),
      };
      this.items.set(itemId, updatedItem);
    }
  }

  /**
   * Create empty result
   */
  private createEmptyResult(): BulkPublishResult {
    return {
      success: true,
      totalItems: 0,
      successfulItems: 0,
      failedItems: 0,
      results: new Map(),
      errors: [],
      summary: {
        totalPublishes: 0,
        successfulPublishes: 0,
        failedPublishes: 0,
        averageScore: 0,
      },
    };
  }

  /**
   * Generate unique item ID
   */
  private generateItemId(): string {
    return `bulk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Delay utility
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get bulk publisher status
   */
  getStatus(): {
    isPublishing: boolean;
    totalItems: number;
    pendingCount: number;
    readyCount: number;
    publishedCount: number;
    failedCount: number;
  } {
    const allItems = Array.from(this.items.values());
    
    return {
      isPublishing: this.isPublishing,
      totalItems: allItems.length,
      pendingCount: allItems.filter(i => i.status === 'pending').length,
      readyCount: allItems.filter(i => i.status === 'ready').length,
      publishedCount: allItems.filter(i => i.status === 'published').length,
      failedCount: allItems.filter(i => i.status === 'failed').length,
    };
  }

  /**
   * Clear all items
   */
  clearAll(): void {
    this.items.clear();
    console.log('All bulk publish items cleared');
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<BulkPublishConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log('Bulk publish configuration updated');
  }
}
