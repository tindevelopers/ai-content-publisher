/**
 * Content types and interfaces for AI-generated content
 */

export type ContentType = 
  // CMS Content Types
  | 'blog' | 'faq' | 'article' | 'product-description' | 'landing-page'
  // Social Media Content Types
  | 'social-post' | 'social-story' | 'social-reel' | 'social-carousel'
  // Newsletter Content Types
  | 'newsletter' | 'newsletter-issue' | 'newsletter-series'
  // Platform-specific Content Types
  | 'medium-story' | 'linkedin-article' | 'twitter-thread' | 'reddit-post' | 'tumblr-post';

export type ContentStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export type PlatformType = 
  // CMS Platforms
  | 'webflow' | 'wordpress' | 'ghost' | 'medium' | 'reddit' | 'blogger'
  // Social Media Platforms
  | 'instagram' | 'linkedin' | 'facebook' | 'twitter' | 'tumblr'
  // Newsletter Platforms
  | 'substack';

export interface ContentImage {
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
}

export interface SEOData {
  metaTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  openGraph?: {
    title?: string;
    description?: string;
    image?: string;
    type?: string;
  };
  twitterCard?: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
  };
}

export interface FAQItem {
  question: string;
  answer: string;
  order?: number;
}

export interface ProductSpecification {
  name: string;
  value: string;
  unit?: string;
}

// Social Media Content Interfaces
export interface SocialMediaPost {
  text: string;
  hashtags?: string[];
  mentions?: string[];
  location?: string;
  scheduledTime?: Date;
  media?: ContentImage[];
}

export interface SocialMediaStory {
  text?: string;
  media: ContentImage;
  duration?: number; // seconds
  interactiveElements?: {
    type: 'poll' | 'question' | 'quiz' | 'link';
    data: any;
  }[];
}

export interface SocialMediaReel {
  video: {
    url: string;
    thumbnail?: string;
    duration: number;
  };
  caption?: string;
  hashtags?: string[];
  audio?: {
    name: string;
    artist?: string;
  };
}

export interface SocialMediaCarousel {
  media: ContentImage[];
  caption?: string;
  hashtags?: string[];
}

// Newsletter Content Interfaces
export interface NewsletterContent {
  subject: string;
  previewText?: string;
  sections: NewsletterSection[];
  footer?: string;
  unsubscribeUrl?: string;
}

export interface NewsletterSection {
  type: 'text' | 'image' | 'cta' | 'divider' | 'social';
  content: string;
  style?: Record<string, any>;
}

// Platform-specific Content Interfaces
export interface TwitterThread {
  tweets: {
    text: string;
    media?: ContentImage[];
  }[];
  replyTo?: string;
}

export interface RedditPost {
  subreddit: string;
  flair?: string;
  nsfw?: boolean;
  spoiler?: boolean;
  sticky?: boolean;
}

export interface TumblrPost {
  tags: string[];
  state?: 'published' | 'draft' | 'queue' | 'private';
  format?: 'html' | 'markdown';
  slug?: string;
}

export interface AIContent {
  type: ContentType;
  title: string;
  content: string;
  excerpt?: string;
  tags?: string[];
  categories?: string[];
  metadata?: Record<string, any>;
  images?: ContentImage[];
  seo?: SEOData;
  publishDate?: Date;
  status?: ContentStatus;
  
  // Type-specific content
  faqs?: FAQItem[];
  specifications?: ProductSpecification[];
  ctaText?: string;
  ctaUrl?: string;
  
  // Social Media Content
  socialPost?: SocialMediaPost;
  socialStory?: SocialMediaStory;
  socialReel?: SocialMediaReel;
  socialCarousel?: SocialMediaCarousel;
  
  // Newsletter Content
  newsletter?: NewsletterContent;
  
  // Platform-specific Content
  twitterThread?: TwitterThread;
  redditPost?: RedditPost;
  tumblrPost?: TumblrPost;
  
  // WordPress specific
  authorId?: number;
  featuredImageId?: number;
  
  // Webflow specific
  collectionId?: string;
  slug?: string;
  
  // Ghost specific
  ghostTag?: string;
  ghostAuthor?: string;
  
  // Medium specific
  mediumPublication?: string;
  mediumTags?: string[];
  
  // Substack specific
  substackSection?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

export interface PublishResult {
  success: boolean;
  contentId?: string;
  url?: string;
  message?: string;
  errors?: string[];
  platform: PlatformType;
  publishedAt?: Date;
  engagement?: {
    likes?: number;
    shares?: number;
    comments?: number;
    views?: number;
  };
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  fields: CollectionField[];
  platform: 'webflow' | 'wordpress';
}

export interface CollectionField {
  id: string;
  name: string;
  type: string;
  required: boolean;
  description?: string;
}
