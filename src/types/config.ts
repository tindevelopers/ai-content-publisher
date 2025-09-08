/**
 * Configuration types for the AI Content Publisher SDK
 */

export interface WebflowConfig {
  apiKey: string;
  siteId: string;
  defaultCollectionId?: string;
  baseUrl?: string;
}

export interface WordPressConfig {
  siteUrl: string;
  username: string;
  password: string; // Application password
  defaultCategory?: string;
  defaultAuthor?: number;
  apiVersion?: string;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff?: boolean;
}

export interface PublisherConfig {
  webflow?: WebflowConfig;
  wordpress?: WordPressConfig;
  retryConfig?: RetryConfig;
  timeout?: number;
  debug?: boolean;
}

export interface PlatformConfig {
  type: 'webflow' | 'wordpress';
  config: WebflowConfig | WordPressConfig;
  isConfigured: boolean;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  statusCode?: number;
  headers?: Record<string, string>;
}

export interface RequestOptions {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
}
