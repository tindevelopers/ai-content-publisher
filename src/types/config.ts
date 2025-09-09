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

// CMS Platform Configurations
export interface GhostConfig {
  siteUrl: string;
  adminApiKey: string;
  contentApiKey?: string;
  defaultTag?: string;
  defaultAuthor?: string;
}

export interface MediumConfig {
  accessToken: string;
  userId: string;
  defaultPublication?: string;
  defaultTags?: string[];
}

export interface RedditConfig {
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  userAgent: string;
  defaultSubreddit?: string;
}

export interface BloggerConfig {
  apiKey: string;
  blogId: string;
  accessToken: string;
  defaultLabels?: string[];
}

// Social Media Platform Configurations
export interface InstagramConfig {
  accessToken: string;
  userId: string;
  businessAccountId?: string;
  defaultHashtags?: string[];
}

export interface LinkedInConfig {
  accessToken: string;
  userId: string;
  organizationId?: string;
  defaultHashtags?: string[];
}

export interface FacebookConfig {
  accessToken: string;
  pageId: string;
  appId: string;
  appSecret: string;
  defaultHashtags?: string[];
}

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
  defaultHashtags?: string[];
}

export interface TumblrConfig {
  consumerKey: string;
  consumerSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  blogName: string;
  defaultTags?: string[];
}

// Newsletter Platform Configurations
export interface SubstackConfig {
  apiKey: string;
  publicationId: string;
  defaultSection?: string;
}

export interface RetryConfig {
  maxRetries: number;
  backoffMs: number;
  exponentialBackoff?: boolean;
}

export interface PublisherConfig {
  // CMS Platforms
  webflow?: WebflowConfig;
  wordpress?: WordPressConfig;
  ghost?: GhostConfig;
  medium?: MediumConfig;
  reddit?: RedditConfig;
  blogger?: BloggerConfig;
  
  // Social Media Platforms
  instagram?: InstagramConfig;
  linkedin?: LinkedInConfig;
  facebook?: FacebookConfig;
  twitter?: TwitterConfig;
  tumblr?: TumblrConfig;
  
  // Newsletter Platforms
  substack?: SubstackConfig;
  
  // Global Settings
  retryConfig?: RetryConfig;
  timeout?: number;
  debug?: boolean;
}

export interface PlatformConfig {
  type: 'webflow' | 'wordpress' | 'ghost' | 'medium' | 'reddit' | 'blogger' | 
        'instagram' | 'linkedin' | 'facebook' | 'twitter' | 'tumblr' | 'substack';
  config: WebflowConfig | WordPressConfig | GhostConfig | MediumConfig | RedditConfig | 
          BloggerConfig | InstagramConfig | LinkedInConfig | FacebookConfig | 
          TwitterConfig | TumblrConfig | SubstackConfig;
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
