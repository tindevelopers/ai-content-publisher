/**
 * Advanced usage examples for the AI Content Publisher SDK
 * Demonstrates content testing, scheduling, and bulk publishing
 */

import { 
  AIContentPublisher, 
  ContentManager, 
  ContentTester,
  ContentScheduler,
  BulkPublisher,
  AIContent,
  PlatformType,
  ScheduleConfig,
  BulkPublishConfig
} from '../index';

// Example 1: Content Testing and Optimization
export async function testAndOptimizeContent() {
  console.log('=== Content Testing and Optimization Example ===');

  const publisher = new AIContentPublisher();
  
  // Configure platforms
  await publisher.configureWebflow('your-webflow-api-key-placeholder', 'your-site-id');
  await publisher.configureLinkedIn('your-linkedin-access-token', 'your-user-id');
  await publisher.configureTwitter('api-key', 'api-secret', 'access-token', 'access-token-secret');

  const tester = new ContentTester();

  // Create sample content
  const content: AIContent = {
    type: 'article',
    title: 'The Future of AI in Content Creation: A Comprehensive Guide to Automated Publishing Systems',
    content: 'Artificial Intelligence is revolutionizing how we create and distribute content...',
    excerpt: 'Discover how AI is transforming content creation and publishing workflows.',
    tags: ['AI', 'Content Creation', 'Automation', 'Publishing', 'Technology'],
    status: 'draft',
  };

  // Test content for multiple platforms
  const platforms: PlatformType[] = ['webflow', 'linkedin', 'twitter'];
  const testResults = tester.testContentForMultiplePlatforms(content, platforms);

  console.log('Content Test Results:');
  for (const [platform, result] of testResults) {
    console.log(`\n${platform.toUpperCase()}:`);
    console.log(`  Compatible: ${result.isCompatible}`);
    console.log(`  Score: ${result.score}/100`);
    console.log(`  Issues: ${result.issues.length}`);
    
    if (result.issues.length > 0) {
      console.log('  Issues:');
      result.issues.forEach(issue => {
        console.log(`    - ${issue.severity.toUpperCase()}: ${issue.message}`);
        if (issue.suggestion) {
          console.log(`      Suggestion: ${issue.suggestion}`);
        }
      });
    }

    if (result.suggestions.length > 0) {
      console.log('  Suggestions:');
      result.suggestions.forEach(suggestion => {
        console.log(`    - ${suggestion}`);
      });
    }
  }

  // Get best platforms for this content
  const bestPlatforms = tester.getBestPlatformsForContent(content, platforms);
  console.log(`\nBest platforms for this content: ${bestPlatforms.join(', ')}`);
}

// Example 2: Content Scheduling System
export async function scheduleContentExample() {
  console.log('\n=== Content Scheduling Example ===');

  const publisher = new AIContentPublisher();
  
  // Configure platforms
  await publisher.configureWebflow('your-webflow-api-key-placeholder', 'your-site-id');
  await publisher.configureLinkedIn('your-linkedin-access-token', 'your-user-id');

  // Configure scheduler
  const scheduleConfig: ScheduleConfig = {
    platforms: ['webflow', 'linkedin'],
    frequency: {
      type: 'daily',
      time: '09:00',
    },
    timezone: 'America/New_York',
    optimalTimes: {
      webflow: [
        { dayOfWeek: 1, hour: 9, engagement: 85 }, // Monday 9 AM
        { dayOfWeek: 3, hour: 14, engagement: 90 }, // Wednesday 2 PM
        { dayOfWeek: 5, hour: 10, engagement: 88 }, // Friday 10 AM
      ],
      linkedin: [
        { dayOfWeek: 2, hour: 8, engagement: 92 }, // Tuesday 8 AM
        { dayOfWeek: 4, hour: 12, engagement: 89 }, // Thursday 12 PM
      ],
    },
    autoTest: true,
    retryFailed: true,
    maxRetries: 3,
  };

  const scheduler = new ContentScheduler(publisher, scheduleConfig);

  // Add content to schedule
  const content1: AIContent = {
    type: 'article',
    title: 'Weekly Tech Update',
    content: 'This week in technology...',
    tags: ['technology', 'weekly-update'],
    status: 'draft',
  };

  const content2: AIContent = {
    type: 'linkedin-article',
    title: 'Professional Development Tips',
    content: 'Here are 5 key tips for professional growth...',
    tags: ['professional-development', 'career'],
    status: 'draft',
  };

  // Schedule content
  const queuedContent1 = scheduler.addToQueue(content1, ['webflow'], {
    priority: 'high',
    autoSchedule: true,
  });

  const queuedContent2 = scheduler.addToQueue(content2, ['linkedin'], {
    priority: 'medium',
    scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  });

  console.log(`Scheduled content 1: ${queuedContent1.id}`);
  console.log(`Scheduled content 2: ${queuedContent2.id}`);

  // Start the scheduler
  scheduler.start();

  // Get scheduler status
  const status = scheduler.getStatus();
  console.log('Scheduler Status:', status);

  // Publish all ready content
  const publishResult = await scheduler.publishAllReady();
  console.log('Publish Result:', publishResult);

  // Stop scheduler when done
  scheduler.stop();
}

// Example 3: Bulk Publishing System
export async function bulkPublishingExample() {
  console.log('\n=== Bulk Publishing Example ===');

  const publisher = new AIContentPublisher();
  
  // Configure platforms
  await publisher.configureWebflow('your-webflow-api-key-placeholder', 'your-site-id');
  await publisher.configureLinkedIn('your-linkedin-access-token', 'your-user-id');
  await publisher.configureTwitter('api-key', 'api-secret', 'access-token', 'access-token-secret');

  // Configure bulk publisher
  const bulkConfig: BulkPublishConfig = {
    platforms: ['webflow', 'linkedin', 'twitter'],
    concurrency: 3,
    delayBetweenPublishes: 2000,
    autoTest: true,
    stopOnError: false,
    retryFailed: true,
    maxRetries: 2,
    retryDelay: 5000,
  };

  const bulkPublisher = new BulkPublisher(publisher, bulkConfig);

  // Create multiple content items
  const contentItems = [
    {
      content: {
        type: 'article',
        title: 'AI Trends 2024',
        content: 'The latest trends in artificial intelligence...',
        tags: ['AI', 'trends', '2024'],
        status: 'draft',
      } as AIContent,
      platforms: ['webflow', 'linkedin'] as PlatformType[],
      priority: 'high' as const,
    },
    {
      content: {
        type: 'social-post',
        title: 'Quick Tech Tip',
        content: 'Here\'s a quick tip for developers...',
        tags: ['tech', 'tip'],
        status: 'draft',
      } as AIContent,
      platforms: ['twitter', 'linkedin'] as PlatformType[],
      priority: 'medium' as const,
    },
    {
      content: {
        type: 'newsletter',
        title: 'Weekly Newsletter',
        content: 'Welcome to our weekly newsletter...',
        tags: ['newsletter', 'weekly'],
        status: 'draft',
      } as AIContent,
      platforms: ['webflow'] as PlatformType[],
      priority: 'low' as const,
    },
  ];

  // Add items to bulk publisher
  const bulkItems = bulkPublisher.addItems(contentItems);
  console.log(`Added ${bulkItems.length} items to bulk publisher`);

  // Test all items
  await bulkPublisher.testAllItems();

  // Get status
  const status = bulkPublisher.getStatus();
  console.log('Bulk Publisher Status:', status);

  // Publish all items
  const result = await bulkPublisher.publishAll();
  console.log('Bulk Publish Result:', result);

  // Get detailed results
  console.log('\nDetailed Results:');
  for (const [itemId, publishResults] of result.results) {
    console.log(`\nItem ${itemId}:`);
    publishResults.forEach(publishResult => {
      console.log(`  ${publishResult.platform}: ${publishResult.success ? 'SUCCESS' : 'FAILED'}`);
      if (publishResult.url) {
        console.log(`    URL: ${publishResult.url}`);
      }
      if (publishResult.errors && publishResult.errors.length > 0) {
        console.log(`    Errors: ${publishResult.errors.join(', ')}`);
      }
    });
  }
}

// Example 4: Comprehensive Content Management
export async function comprehensiveContentManagement() {
  console.log('\n=== Comprehensive Content Management Example ===');

  const publisher = new AIContentPublisher();
  
  // Configure all platforms
  await publisher.configureWebflow('your-webflow-api-key-placeholder', 'your-site-id');
  await publisher.configureLinkedIn('your-linkedin-access-token', 'your-user-id');
  await publisher.configureTwitter('api-key', 'api-secret', 'access-token', 'access-token-secret');
  await publisher.configureMedium('your-medium-access-token', 'your-user-id');

  // Configure content manager
  const contentManager = new ContentManager({
    publisher,
    scheduleConfig: {
      platforms: ['webflow', 'linkedin', 'twitter'],
      frequency: {
        type: 'daily',
        time: '10:00',
      },
      autoTest: true,
      retryFailed: true,
    },
    bulkPublishConfig: {
      platforms: ['webflow', 'linkedin', 'twitter', 'medium'],
      concurrency: 2,
      autoTest: true,
    },
    autoTest: true,
    autoOptimize: true,
  });

  // Create content
  const content: AIContent = {
    type: 'article',
    title: 'The Complete Guide to AI Content Publishing',
    content: 'In this comprehensive guide, we\'ll explore how artificial intelligence is transforming content publishing workflows...',
    excerpt: 'Learn how AI is revolutionizing content creation and distribution across multiple platforms.',
    tags: ['AI', 'Content Publishing', 'Automation', 'Guide'],
    status: 'draft',
  };

  // Test content for all platforms
  const testResults = await contentManager.testContentForAllPlatforms(content);
  console.log('Content Test Results:');
  for (const [platform, result] of testResults) {
    console.log(`  ${platform}: ${result.score}/100 (${result.isCompatible ? 'Compatible' : 'Needs optimization'})`);
  }

  // Optimize content if needed
  const optimization = await contentManager.optimizeContentForPlatforms(content, ['webflow', 'linkedin', 'twitter']);
  if (optimization.scoreImprovement > 0) {
    console.log(`Content optimized! Score improved by ${optimization.scoreImprovement} points`);
    console.log('Improvements made:', optimization.improvements);
  }

  // Publish immediately to specific platforms
  const immediateResults = await contentManager.publishNow(content, ['webflow', 'linkedin']);
  console.log('Immediate publish results:', immediateResults.map(r => `${r.platform}: ${r.success ? 'SUCCESS' : 'FAILED'}`));

  // Schedule content for later
  const scheduledContent = await contentManager.scheduleContent(content, ['twitter', 'medium'], {
    priority: 'high',
    autoSchedule: true,
  });
  console.log(`Content scheduled: ${scheduledContent.id}`);

  // Add to bulk queue
  const bulkItem = contentManager.addToBulkQueue(content, ['webflow', 'linkedin'], 'medium');
  console.log(`Added to bulk queue: ${bulkItem.id}`);

  // Start scheduler
  contentManager.startScheduler();

  // Get comprehensive status
  const status = contentManager.getStatus();
  console.log('Content Manager Status:', status);

  // Test and optimize all pending content
  await contentManager.testAndOptimizeAllPending();

  // Publish all ready content
  const publishAllResult = await contentManager.publishAllNow();
  console.log('Publish All Result:', {
    success: publishAllResult.success,
    totalItems: publishAllResult.totalItems,
    successfulItems: publishAllResult.successfulItems,
    failedItems: publishAllResult.failedItems,
  });

  // Stop scheduler
  contentManager.stopScheduler();
}

// Example 5: Real-world Content Campaign
export async function contentCampaignExample() {
  console.log('\n=== Content Campaign Example ===');

  const publisher = new AIContentPublisher();
  
  // Configure platforms for a content campaign
  await publisher.configureWebflow('your-webflow-api-key-placeholder', 'your-site-id');
  await publisher.configureLinkedIn('your-linkedin-access-token', 'your-user-id');
  await publisher.configureTwitter('api-key', 'api-secret', 'access-token', 'access-token-secret');
  await publisher.configureMedium('your-medium-access-token', 'your-user-id');

  const contentManager = new ContentManager({
    publisher,
    scheduleConfig: {
      platforms: ['webflow', 'linkedin', 'twitter', 'medium'],
      frequency: {
        type: 'weekly',
        days: [1, 3, 5], // Monday, Wednesday, Friday
        time: '09:00',
      },
      autoTest: true,
      retryFailed: true,
    },
    autoTest: true,
    autoOptimize: true,
  });

  // Create a series of related content
  const campaignContent = [
    {
      title: 'AI in Marketing: The Future is Here',
      content: 'Artificial intelligence is revolutionizing marketing strategies...',
      tags: ['AI', 'Marketing', 'Future'],
      platforms: ['webflow', 'linkedin', 'medium'],
    },
    {
      title: '5 AI Tools Every Marketer Should Know',
      content: 'Here are the top 5 AI tools that are changing the marketing landscape...',
      tags: ['AI', 'Tools', 'Marketing'],
      platforms: ['webflow', 'linkedin', 'twitter'],
    },
    {
      title: 'Case Study: AI-Driven Campaign Results',
      content: 'We analyzed 100 AI-driven marketing campaigns to find the key success factors...',
      tags: ['AI', 'Case Study', 'Results'],
      platforms: ['webflow', 'medium'],
    },
  ];

  // Schedule the campaign
  for (let i = 0; i < campaignContent.length; i++) {
    const content: AIContent = {
      type: 'article',
      title: campaignContent[i].title,
      content: campaignContent[i].content,
      tags: campaignContent[i].tags,
      status: 'draft',
    };

    // Schedule with staggered timing
    const scheduledFor = new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000); // 1 day apart
    
    await contentManager.scheduleContent(content, campaignContent[i].platforms as PlatformType[], {
      priority: 'high',
      scheduledFor,
    });

    console.log(`Scheduled campaign content ${i + 1}: "${content.title}"`);
  }

  // Start the campaign
  contentManager.startScheduler();

  // Monitor the campaign
  const monitorCampaign = setInterval(() => {
    const status = contentManager.getStatus();
    console.log('Campaign Status:', {
      scheduled: status.scheduler?.queueSize || 0,
      ready: status.scheduler?.readyCount || 0,
      published: status.bulkPublisher.publishedCount,
      failed: status.scheduler?.failedCount || 0,
    });

    // Stop monitoring after 7 days
    if (Date.now() > Date.now() + 7 * 24 * 60 * 60 * 1000) {
      clearInterval(monitorCampaign);
      contentManager.stopScheduler();
      console.log('Campaign monitoring completed');
    }
  }, 60 * 60 * 1000); // Check every hour
}

// Run examples
export async function runAllExamples() {
  try {
    await testAndOptimizeContent();
    await scheduleContentExample();
    await bulkPublishingExample();
    await comprehensiveContentManagement();
    await contentCampaignExample();
  } catch (error) {
    console.error('Error running examples:', error);
  }
}
