/**
 * AI Content Publisher SDK
 * 
 * A TypeScript SDK for publishing AI-generated content to Webflow and WordPress
 */

// Main exports
export { AIContentPublisher } from './core/ai-content-publisher';
export { ConfigManager } from './core/config-manager';
export { ContentValidator } from './core/content-validator';
export { ContentTester } from './core/content-tester';
export { ContentScheduler } from './core/content-scheduler';
export { BulkPublisher } from './core/bulk-publisher';
export { ContentManager } from './core/content-manager';

// Error handling and logging
export { 
  RetryHandler, 
  CircuitBreaker, 
  RetryableError, 
  ErrorType, 
  CircuitState,
  DEFAULT_RETRY_CONFIGS 
} from './core/retry-handler';
export { 
  SDKLogger, 
  LogLevel, 
  createLogger, 
  logger 
} from './core/logger';

// Import for utility functions
import { AIContentPublisher } from './core/ai-content-publisher';
import { ContentValidator } from './core/content-validator';
import type { PublisherConfig } from './types/config';
import type { AIContent } from './types/content';

// Adapters
export { WebflowAdapter } from './adapters/webflow-adapter';
export { WordPressAdapter } from './adapters/wordpress-adapter';
export { GhostAdapter } from './adapters/ghost-adapter';
export { MediumAdapter } from './adapters/medium-adapter';
export { LinkedInAdapter } from './adapters/linkedin-adapter';
export { TwitterAdapter } from './adapters/twitter-adapter';
export { SubstackAdapter } from './adapters/substack-adapter';

// Type exports
export type {
  // Content types
  AIContent,
  ContentType,
  ContentStatus,
  PlatformType,
  ContentImage,
  SEOData,
  FAQItem,
  ProductSpecification,
  SocialMediaPost,
  SocialMediaStory,
  SocialMediaReel,
  SocialMediaCarousel,
  NewsletterContent,
  NewsletterSection,
  TwitterThread,
  RedditPost,
  TumblrPost,
  ValidationResult,
  ValidationError,
  PublishResult,
  Collection,
  CollectionField
} from './types/content';

export type {
  // Configuration types
  PublisherConfig,
  WebflowConfig,
  WordPressConfig,
  GhostConfig,
  MediumConfig,
  RedditConfig,
  BloggerConfig,
  InstagramConfig,
  LinkedInConfig,
  FacebookConfig,
  TwitterConfig,
  TumblrConfig,
  SubstackConfig,
  RetryConfig,
  PlatformConfig,
  APIResponse,
  RequestOptions
} from './types/config';

// Advanced feature types
export type { ScheduleConfig } from './core/content-scheduler';
export type { BulkPublishConfig } from './core/bulk-publisher';
export type { ContentManagerConfig } from './core/content-manager';

// Utility functions
export const createContentPublisher = (config?: PublisherConfig) => {
  return new AIContentPublisher(config);
};

export const validateContent = (content: AIContent) => {
  const validator = new ContentValidator();
  return validator.validate(content);
};

// Version
export const VERSION = '1.0.0';

// Default export
export default AIContentPublisher;
// Tools and utilities
