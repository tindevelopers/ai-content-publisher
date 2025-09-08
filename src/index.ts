/**
 * AI Content Publisher SDK
 * 
 * A TypeScript SDK for publishing AI-generated content to Webflow and WordPress
 */

// Main exports
export { AIContentPublisher } from './core/ai-content-publisher';
export { ConfigManager } from './core/config-manager';
export { ContentValidator } from './core/content-validator';

// Import for utility functions
import { AIContentPublisher } from './core/ai-content-publisher';
import { ContentValidator } from './core/content-validator';
import type { PublisherConfig } from './types/config';
import type { AIContent } from './types/content';

// Adapters
export { WebflowAdapter } from './adapters/webflow-adapter';
export { WordPressAdapter } from './adapters/wordpress-adapter';

// Type exports
export type {
  // Content types
  AIContent,
  ContentType,
  ContentStatus,
  ContentImage,
  SEOData,
  FAQItem,
  ProductSpecification,
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
  RetryConfig,
  PlatformConfig,
  APIResponse,
  RequestOptions
} from './types/config';

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
