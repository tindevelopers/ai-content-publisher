# AI Content Publisher SDK

A powerful TypeScript SDK for publishing AI-generated content across multiple platforms including CMS systems (Webflow, WordPress, Ghost, Medium, Reddit, Blogger), social media platforms (Instagram, LinkedIn, Facebook, X/Twitter, Tumblr), and newsletter platforms (Substack). Streamline your content publishing workflow with advanced features like content testing, automated scheduling, and bulk publishing.

## Features

- 🚀 **Unified Interface** - Single API for multiple platforms
- 🔐 **Secure Authentication** - API key management for all platforms
- ✅ **Content Validation** - Built-in validation with helpful error messages
- 🎯 **Type Safety** - Full TypeScript support with comprehensive types
- 📦 **Batch Publishing** - Publish multiple content items efficiently
- 🔄 **Multi-Platform** - Publish to multiple platforms simultaneously
- 🎨 **Content Mapping** - Automatic field mapping between platforms
- 📊 **SEO Optimization** - Built-in SEO metadata handling
- 🧪 **Content Testing** - Test content compatibility across platforms
- ⏰ **Automated Scheduling** - Schedule content with optimal timing
- 📈 **Bulk Operations** - Handle large-scale content publishing
- 🎛️ **Content Management** - Unified content management system

## Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/tindevelopers/ai-content-publisher.git
cd ai-content-publisher
npm install
npm run build
```

## Quick Start

```typescript
import { AIContentPublisher, AIContent } from './src/index';

// Initialize the publisher
const publisher = new AIContentPublisher();

// Configure platforms
await publisher.configureWebflow('your-api-key', 'your-site-id');
await publisher.configureWordPress('https://yoursite.com', 'username', 'app-password');

// Create content
const content: AIContent = {
  type: 'blog',
  title: 'My AI-Generated Blog Post',
  content: '<p>This is amazing AI-generated content!</p>',
  excerpt: 'A brief summary of the post',
  tags: ['AI', 'Technology'],
  categories: ['Tech News'],
  status: 'published'
};

// Publish to both platforms
const results = await publisher.publishToMultiple(content, ['webflow', 'wordpress']);
console.log(results);
```

## Supported Platforms

### CMS Platforms
- **Webflow** - Modern website builder with CMS
- **WordPress** - Popular content management system
- **Ghost** - Professional publishing platform
- **Medium** - Publishing platform for writers
- **Reddit** - Community discussion platform
- **Blogger** - Google's blogging platform

### Social Media Platforms
- **Instagram** - Visual content and stories
- **LinkedIn** - Professional networking and articles
- **Facebook** - Social media posts and pages
- **X/Twitter** - Microblogging and threads
- **Tumblr** - Microblogging and multimedia

### Newsletter Platforms
- **Substack** - Newsletter and subscription platform

## Supported Content Types

### CMS Content Types
- **Blog Posts** - Standard blog articles with SEO optimization
- **FAQ Items** - Question and answer content with structured data
- **Articles** - Long-form content with rich formatting
- **Product Descriptions** - E-commerce content with specifications
- **Landing Pages** - Marketing pages with CTAs and conversion tracking

### Social Media Content Types
- **Social Posts** - Standard social media posts
- **Social Stories** - Temporary visual content
- **Social Reels** - Short-form video content
- **Social Carousels** - Multi-image posts

### Newsletter Content Types
- **Newsletters** - Email newsletter content
- **Newsletter Issues** - Individual newsletter editions
- **Newsletter Series** - Multi-part newsletter content

### Platform-Specific Content Types
- **Medium Stories** - Medium-specific article format
- **LinkedIn Articles** - Professional long-form content
- **Twitter Threads** - Multi-tweet content series
- **Reddit Posts** - Community discussion posts
- **Tumblr Posts** - Microblogging content

## Configuration

### Webflow Setup

1. Get your Webflow API key from your [Webflow account settings](https://webflow.com/dashboard/account/general)
2. Find your Site ID in your Webflow project settings
3. Optionally, get your Collection ID for default publishing

```typescript
await publisher.configureWebflow(
  'your-webflow-api-key',
  'your-site-id',
  'default-collection-id' // Optional
);
```

### WordPress Setup

1. Create an Application Password in your WordPress admin
2. Ensure the WordPress REST API is enabled
3. Configure your site URL and credentials

```typescript
await publisher.configureWordPress(
  'https://yoursite.com',
  'your-username',
  'your-application-password',
  {
    defaultCategory: 'AI Generated',
    defaultAuthor: 1
  }
);
```

## API Reference

### Main Methods

#### `publish(content, platform)`
Publish content to a specific platform.

```typescript
const result = await publisher.publish(content, 'webflow');
```

#### `publishToMultiple(content, platforms)`
Publish content to multiple platforms simultaneously.

```typescript
const results = await publisher.publishToMultiple(content, ['webflow', 'wordpress']);
```

#### `batchPublish(contentItems, platform, options)`
Publish multiple content items in batches.

```typescript
const results = await publisher.batchPublish(contentItems, 'wordpress', {
  concurrency: 3,
  stopOnError: false
});
```

#### `validateContent(content)`
Validate content before publishing.

```typescript
const validation = publisher.validateContent(content);
if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}
```

### Content Structure

```typescript
interface AIContent {
  type: 'blog' | 'faq' | 'article' | 'product-description' | 'landing-page';
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  status?: 'draft' | 'published' | 'scheduled';
  seo?: {
    metaTitle?: string;
    metaDescription?: string;
    keywords?: string[];
  };
  images?: ContentImage[];
  publishDate?: Date;
  
  // Type-specific fields
  faqs?: FAQItem[];
  specifications?: ProductSpecification[];
  ctaText?: string;
  ctaUrl?: string;
}
```

## Examples

### Basic Blog Post

```typescript
const blogPost: AIContent = {
  type: 'blog',
  title: 'The Future of AI in Content Creation',
  content: `
    <h2>Introduction</h2>
    <p>AI is revolutionizing content creation...</p>
    
    <h2>Key Benefits</h2>
    <ul>
      <li>Increased efficiency</li>
      <li>Consistent quality</li>
      <li>24/7 content generation</li>
    </ul>
  `,
  excerpt: 'Explore how AI is transforming content creation.',
  tags: ['AI', 'Content Creation', 'Technology'],
  categories: ['Technology'],
  status: 'published',
  seo: {
    metaTitle: 'AI Content Creation: The Future is Here',
    metaDescription: 'Discover how AI is revolutionizing content creation.',
    keywords: ['ai content', 'automated writing', 'content creation']
  }
};

const result = await publisher.publish(blogPost, 'webflow');
```

### FAQ Content

```typescript
const faqContent: AIContent = {
  type: 'faq',
  title: 'AI Content FAQ',
  content: 'Common questions about AI-generated content.',
  faqs: [
    {
      question: 'How accurate is AI-generated content?',
      answer: 'AI content accuracy depends on the model and training data used.',
      order: 1
    },
    {
      question: 'Can AI content rank in search engines?',
      answer: 'Yes, when it provides value and follows SEO best practices.',
      order: 2
    }
  ],
  status: 'published'
};
```

### Batch Publishing

```typescript
const contentItems: AIContent[] = [
  { type: 'blog', title: 'Post 1', content: '...', status: 'published' },
  { type: 'blog', title: 'Post 2', content: '...', status: 'published' },
  { type: 'blog', title: 'Post 3', content: '...', status: 'draft' }
];

const results = await publisher.batchPublish(contentItems, 'wordpress', {
  concurrency: 2,
  stopOnError: false
});
```

## Error Handling

The SDK provides comprehensive error handling with detailed error messages:

```typescript
const result = await publisher.publish(content, 'webflow');

if (!result.success) {
  console.error('Publishing failed:', result.message);
  console.error('Errors:', result.errors);
} else {
  console.log('Published successfully!');
  console.log('Content ID:', result.contentId);
  console.log('URL:', result.url);
}
```

## Content Validation

Built-in validation helps catch issues before publishing:

```typescript
const validation = publisher.validateContent(content);

// Check for errors
if (!validation.isValid) {
  validation.errors.forEach(error => {
    console.log(`Error in ${error.field}: ${error.message}`);
  });
}

// Check for warnings
if (validation.warnings) {
  validation.warnings.forEach(warning => {
    console.log(`Warning in ${warning.field}: ${warning.message}`);
  });
}
```

## SEO Optimization

The SDK automatically handles SEO optimization:

- Meta titles and descriptions
- Image alt tags
- URL slug generation
- Schema markup for structured data
- OpenGraph tags for social sharing

## Platform-Specific Features

### Webflow
- CMS Collection integration
- Custom field mapping
- Asset management
- Designer API compatibility

### WordPress
- REST API integration
- Custom post types
- Category and tag management
- Media library integration
- Plugin compatibility (Yoast SEO, etc.)

## Advanced Features

### Content Testing System

Test content compatibility across platforms before publishing:

```typescript
import { ContentTester } from 'ai-content-publisher';

const tester = new ContentTester();

// Test content for a single platform
const result = tester.testContentForPlatform(content, 'webflow');
console.log(`Compatibility: ${result.isCompatible}`);
console.log(`Score: ${result.score}/100`);

// Test content for multiple platforms
const platforms = ['webflow', 'linkedin', 'twitter'];
const results = tester.testContentForMultiplePlatforms(content, platforms);

// Get best platforms for content
const bestPlatforms = tester.getBestPlatformsForContent(content, platforms);
```

### Content Scheduling System

Automate content publishing with optimal timing:

```typescript
import { ContentScheduler, ScheduleConfig } from 'ai-content-publisher';

const scheduleConfig: ScheduleConfig = {
  platforms: ['webflow', 'linkedin', 'twitter'],
  frequency: {
    type: 'daily',
    time: '09:00',
    timezone: 'America/New_York',
  },
  autoTest: true,
  retryFailed: true,
};

const scheduler = new ContentScheduler(publisher, scheduleConfig);

// Add content to schedule
const queuedContent = scheduler.addToQueue(content, ['webflow'], {
  priority: 'high',
  autoSchedule: true,
});

// Start scheduler
scheduler.start();
```

### Bulk Publishing System

Handle large-scale content publishing efficiently:

```typescript
import { BulkPublisher, BulkPublishConfig } from 'ai-content-publisher';

const bulkConfig: BulkPublishConfig = {
  platforms: ['webflow', 'linkedin', 'twitter'],
  concurrency: 3,
  autoTest: true,
  retryFailed: true,
};

const bulkPublisher = new BulkPublisher(publisher, bulkConfig);

// Add items to bulk publisher
const items = bulkPublisher.addItems([
  {
    content: articleContent,
    platforms: ['webflow', 'linkedin'],
    priority: 'high',
  },
]);

// Publish all items
const result = await bulkPublisher.publishAll();
```

### Content Manager

Unified interface for all content operations:

```typescript
import { ContentManager } from 'ai-content-publisher';

const contentManager = new ContentManager({
  publisher,
  scheduleConfig: {
    platforms: ['webflow', 'linkedin', 'twitter'],
    frequency: { type: 'daily', time: '10:00' },
    autoTest: true,
  },
  autoTest: true,
  autoOptimize: true,
});

// Test content for all platforms
const testResults = await contentManager.testContentForAllPlatforms(content);

// Publish immediately
const results = await contentManager.publishNow(content, ['webflow', 'linkedin']);

// Schedule content
const scheduled = await contentManager.scheduleContent(content, ['twitter'], {
  priority: 'high',
});

// Publish all ready content
const publishAllResult = await contentManager.publishAllNow();
```

For detailed information about advanced features, see the [Advanced Features Guide](ADVANCED_FEATURES.md).

## Advanced Usage

### Custom Configuration

```typescript
const publisher = new AIContentPublisher({
  webflow: {
    apiKey: 'your-key',
    siteId: 'your-site-id',
    defaultCollectionId: 'collection-id'
  },
  wordpress: {
    siteUrl: 'https://yoursite.com',
    username: 'admin',
    password: 'app-password',
    defaultCategory: 'AI Content'
  },
  linkedin: {
    accessToken: 'your-linkedin-token',
    userId: 'your-user-id'
  },
  twitter: {
    apiKey: 'your-api-key',
    apiSecret: 'your-api-secret',
    accessToken: 'your-access-token',
    accessTokenSecret: 'your-access-token-secret'
  },
  retryConfig: {
    maxRetries: 3,
    backoffMs: 1000
  },
  timeout: 30000
});
```

### Environment Variables

You can also configure using environment variables:

```bash
WEBFLOW_API_KEY=your-webflow-api-key
WEBFLOW_SITE_ID=your-site-id
WORDPRESS_SITE_URL=https://yoursite.com
WORDPRESS_USERNAME=your-username
WORDPRESS_PASSWORD=your-app-password
```

## Requirements

- Node.js 16+
- TypeScript 4.5+
- Valid Webflow API key (for Webflow publishing)
- WordPress site with REST API enabled (for WordPress publishing)

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📚 [Documentation](https://docs.example.com)
- 💬 [Discord Community](https://discord.gg/example)
- 🐛 [Report Issues](https://github.com/your-org/ai-content-publisher/issues)
- 📧 [Email Support](mailto:support@example.com)

---

Built with ❤️ for the AI content creation community.

## Latest Updates

- **v1.1.0** - Added advanced features: content testing, scheduling, bulk publishing, and content management
- **v1.0.1** - Enhanced error handling and improved TypeScript definitions
- **v1.0.0** - Initial release with Webflow and WordPress support
