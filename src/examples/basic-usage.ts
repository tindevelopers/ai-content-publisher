/**
 * Basic usage examples for the AI Content Publisher SDK
 */

import { AIContentPublisher, AIContent } from '../index';

async function basicExample() {
  // Initialize the publisher
  const publisher = new AIContentPublisher();

  try {
    // Configure Webflow
    await publisher.configureWebflow(
      'your-webflow-api-key-placeholder',
      'your-site-id',
      'your-default-collection-id', // Optional
    );

    // Configure WordPress
    await publisher.configureWordPress(
      'https://yoursite.com',
      'your-username',
      'your-application-password',
      {
        defaultCategory: 'AI Generated',
        defaultAuthor: 1,
      },
    );

    // Create AI-generated content
    const blogPost: AIContent = {
      type: 'blog',
      title: 'The Future of AI in Content Creation',
      content: `
        <h2>Introduction</h2>
        <p>Artificial Intelligence is revolutionizing how we create and manage content...</p>
        
        <h2>Key Benefits</h2>
        <ul>
          <li>Increased efficiency</li>
          <li>Consistent quality</li>
          <li>24/7 content generation</li>
        </ul>
        
        <h2>Conclusion</h2>
        <p>The future of content creation is bright with AI-powered tools...</p>
      `,
      excerpt: 'Explore how AI is transforming content creation and what it means for the future.',
      tags: ['AI', 'Content Creation', 'Technology', 'Automation'],
      categories: ['Technology', 'AI News'],
      status: 'published',
      seo: {
        metaTitle: 'AI Content Creation: The Future is Here',
        metaDescription: 'Discover how AI is revolutionizing content creation with automated writing, SEO optimization, and more.',
        keywords: ['ai content', 'automated writing', 'content creation', 'artificial intelligence'],
      },
      images: [
        {
          url: 'https://example.com/ai-content-creation.jpg',
          alt: 'AI Content Creation Illustration',
          caption: 'The future of content creation with AI',
        },
      ],
    };

    // Publish to Webflow
    console.log('Publishing to Webflow...');
    const webflowResult = await publisher.publish(blogPost, 'webflow');
    console.log('Webflow Result:', webflowResult);

    // Publish to WordPress
    console.log('Publishing to WordPress...');
    const wpResult = await publisher.publish(blogPost, 'wordpress');
    console.log('WordPress Result:', wpResult);

    // Or publish to both platforms simultaneously
    console.log('Publishing to both platforms...');
    const multiResults = await publisher.publishToMultiple(blogPost, ['webflow', 'wordpress']);
    console.log('Multi-platform Results:', multiResults);

  } catch (error) {
    console.error('Error:', error);
  }
}

async function faqExample() {
  const publisher = new AIContentPublisher();

  // Configure your platforms first...

  const faqContent: AIContent = {
    type: 'faq',
    title: 'Frequently Asked Questions about AI Content',
    content: 'Here are the most common questions about AI-generated content.',
    faqs: [
      {
        question: 'How accurate is AI-generated content?',
        answer: 'AI-generated content accuracy depends on the training data and model used. Modern AI can produce highly accurate and relevant content when properly configured.',
        order: 1,
      },
      {
        question: 'Can AI content rank well in search engines?',
        answer: 'Yes, AI-generated content can rank well if it provides value to users and follows SEO best practices. The key is ensuring the content is helpful and original.',
        order: 2,
      },
      {
        question: 'How do I ensure AI content matches my brand voice?',
        answer: 'You can train AI models on your existing content, provide clear style guidelines, and review/edit the output to maintain brand consistency.',
        order: 3,
      },
    ],
    tags: ['FAQ', 'AI Content', 'Help'],
    categories: ['Support'],
    status: 'published',
  };

  const result = await publisher.publish(faqContent, 'wordpress');
  console.log('FAQ Published:', result);
}

async function batchPublishExample() {
  const publisher = new AIContentPublisher();

  // Configure your platforms first...

  const contentItems: AIContent[] = [
    {
      type: 'blog',
      title: 'AI Content Creation Tips',
      content: 'Content about AI tips...',
      status: 'published',
    },
    {
      type: 'article',
      title: 'The Future of Marketing with AI',
      content: 'Content about AI in marketing...',
      status: 'published',
    },
    {
      type: 'blog',
      title: 'Getting Started with AI Tools',
      content: 'Content about AI tools...',
      status: 'draft',
    },
  ];

  // Batch publish to WordPress
  const results = await publisher.batchPublish(contentItems, 'wordpress', {
    concurrency: 3, // Process 3 items at a time
    stopOnError: false, // Continue even if some items fail
  });

  console.log('Batch Publish Results:', results);
  
  // Check success rate
  const successCount = results.filter(r => r.success).length;
  console.log(`Successfully published ${successCount}/${results.length} items`);
}

async function contentValidationExample() {
  const publisher = new AIContentPublisher();

  const invalidContent: AIContent = {
    type: 'blog',
    title: '', // Invalid - empty title
    content: 'Short', // Warning - very short content
    status: 'published',
  };

  // Validate before publishing
  const validation = publisher.validateContent(invalidContent);
  
  if (!validation.isValid) {
    console.log('Validation Errors:');
    validation.errors.forEach(error => {
      console.log(`- ${error.field}: ${error.message}`);
    });
  }

  if (validation.warnings && validation.warnings.length > 0) {
    console.log('Validation Warnings:');
    validation.warnings.forEach(warning => {
      console.log(`- ${warning.field}: ${warning.message}`);
    });
  }
}

async function collectionManagementExample() {
  const publisher = new AIContentPublisher();

  // Configure your platforms first...

  try {
    // Get available collections from Webflow
    const webflowCollections = await publisher.getAvailableCollections('webflow');
    console.log('Webflow Collections:', webflowCollections);

    // Get available post types from WordPress
    const wpCollections = await publisher.getAvailableCollections('wordpress');
    console.log('WordPress Post Types:', wpCollections);

    // Test connections
    const webflowStatus = await publisher.testConnection('webflow');
    const wpStatus = await publisher.testConnection('wordpress');
    
    console.log('Connection Status:');
    console.log('Webflow:', webflowStatus.success ? 'Connected' : 'Failed');
    console.log('WordPress:', wpStatus.success ? 'Connected' : 'Failed');

  } catch (error) {
    console.error('Error checking collections:', error);
  }
}

// Export examples for testing
export {
  basicExample,
  faqExample,
  batchPublishExample,
  contentValidationExample,
  collectionManagementExample,
};
