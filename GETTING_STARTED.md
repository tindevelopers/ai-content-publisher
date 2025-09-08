# Getting Started with AI Content Publisher SDK

## Quick Setup Guide

### 1. Installation

```bash
npm install ai-content-publisher
```

### 2. Basic Usage (Programmatic)

```typescript
import { AIContentPublisher, AIContent } from 'ai-content-publisher';

// Initialize the publisher
const publisher = new AIContentPublisher();

// Configure your platforms
await publisher.configureWebflow('your-api-key', 'your-site-id');
await publisher.configureWordPress('https://yoursite.com', 'username', 'app-password');

// Create content
const content: AIContent = {
  type: 'blog',
  title: 'My AI-Generated Blog Post',
  content: '<p>This is amazing AI-generated content!</p>',
  excerpt: 'A brief summary',
  tags: ['AI', 'Technology'],
  categories: ['Tech News'],
  status: 'published'
};

// Publish to both platforms
const results = await publisher.publishToMultiple(content, ['webflow', 'wordpress']);
console.log('Published successfully!', results);
```

### 3. CLI Usage

Install globally for command-line usage:

```bash
npm install -g ai-content-publisher
```

Configure your platforms:

```bash
# Configure Webflow
ai-publisher config --webflow-key="your-api-key" --webflow-site="your-site-id"

# Configure WordPress
ai-publisher config --wp-url="https://yoursite.com" --wp-username="admin" --wp-password="your-app-password"
```

Check your configuration:

```bash
ai-publisher status
```

Publish content from a JSON file:

```bash
ai-publisher publish --file="content-examples/blog-post.json" --platform="webflow"
ai-publisher publish --file="content-examples/faq.json" --platform="both"
```

### 4. Content Examples

#### Blog Post (`blog-post.json`)

```json
{
  "type": "blog",
  "title": "The Future of AI in Content Creation",
  "content": "<h2>Introduction</h2><p>AI is revolutionizing content creation...</p>",
  "excerpt": "Explore how AI is transforming content creation.",
  "tags": ["AI", "Content Creation", "Technology"],
  "categories": ["Technology"],
  "status": "published",
  "seo": {
    "metaTitle": "AI Content Creation: The Future is Here",
    "metaDescription": "Discover how AI is revolutionizing content creation.",
    "keywords": ["ai content", "automated writing"]
  }
}
```

#### FAQ Content (`faq.json`)

```json
{
  "type": "faq",
  "title": "AI Content FAQ",
  "content": "Common questions about AI-generated content.",
  "faqs": [
    {
      "question": "How accurate is AI-generated content?",
      "answer": "AI content accuracy depends on the model and training data used.",
      "order": 1
    }
  ],
  "status": "published"
}
```

### 5. Platform Setup

#### Webflow Setup

1. Go to your [Webflow Account Settings](https://webflow.com/dashboard/account/general)
2. Navigate to "API Access" section
3. Generate a new API key
4. Find your Site ID in your project settings
5. (Optional) Get your Collection ID for default publishing

#### WordPress Setup

1. Go to your WordPress admin → Users → Your Profile
2. Scroll down to "Application Passwords"
3. Create a new application password
4. Make sure your site has the REST API enabled
5. Use the application password (not your regular password)

### 6. Available CLI Commands

```bash
# Configuration
ai-publisher config --help

# Publishing
ai-publisher publish --file="content.json" --platform="webflow"
ai-publisher publish --file="content.json" --platform="wordpress"
ai-publisher publish --file="content.json" --platform="both"

# Testing
ai-publisher test
ai-publisher test --platform="webflow"

# Collections
ai-publisher collections
ai-publisher collections --platform="wordpress"

# Status
ai-publisher status
```

### 7. Content Validation

The SDK automatically validates your content before publishing:

```typescript
const validation = publisher.validateContent(content);

if (!validation.isValid) {
  console.log('Validation errors:', validation.errors);
}

if (validation.warnings) {
  console.log('Warnings:', validation.warnings);
}
```

### 8. Batch Publishing

Publish multiple content items at once:

```typescript
const contentItems: AIContent[] = [
  { type: 'blog', title: 'Post 1', content: '...', status: 'published' },
  { type: 'blog', title: 'Post 2', content: '...', status: 'published' }
];

const results = await publisher.batchPublish(contentItems, 'wordpress', {
  concurrency: 3,
  stopOnError: false
});
```

### 9. Error Handling

All methods return detailed error information:

```typescript
const result = await publisher.publish(content, 'webflow');

if (!result.success) {
  console.error('Publishing failed:', result.message);
  console.error('Errors:', result.errors);
} else {
  console.log('Success! URL:', result.url);
  console.log('Content ID:', result.contentId);
}
```

### 10. Supported Content Types

- **blog**: Standard blog posts
- **faq**: Question and answer content
- **article**: Long-form articles
- **product-description**: E-commerce product content
- **landing-page**: Marketing landing pages

### 11. Environment Variables

You can also configure using environment variables:

```bash
WEBFLOW_API_KEY=your-webflow-api-key
WEBFLOW_SITE_ID=your-site-id
WORDPRESS_SITE_URL=https://yoursite.com
WORDPRESS_USERNAME=your-username
WORDPRESS_PASSWORD=your-app-password
```

### 12. TypeScript Support

The SDK is built with TypeScript and provides full type definitions:

```typescript
import { AIContent, PublishResult, ValidationResult } from 'ai-content-publisher';

// Full type safety and IntelliSense support
const content: AIContent = {
  // TypeScript will validate your content structure
};
```

## Next Steps

1. Try the example content files in the `content-examples/` directory
2. Read the full API documentation in `README.md`
3. Explore the source code examples in `src/examples/`
4. Set up your CMS platforms and start publishing!

## Need Help?

- Check the README.md for detailed API documentation
- Look at the examples in `src/examples/basic-usage.ts`
- Test your content with `ai-publisher publish --validate-only`
- Use `ai-publisher test` to verify your platform connections

Happy publishing! 🚀
