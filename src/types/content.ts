/**
 * Content types and interfaces for AI-generated content
 */

export type ContentType = 'blog' | 'faq' | 'article' | 'product-description' | 'landing-page';
export type ContentStatus = 'draft' | 'published' | 'scheduled';

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
  
  // WordPress specific
  authorId?: number;
  featuredImageId?: number;
  
  // Webflow specific
  collectionId?: string;
  slug?: string;
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
  platform: 'webflow' | 'wordpress';
  publishedAt?: Date;
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
