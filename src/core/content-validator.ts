/**
 * Content validation for AI-generated content
 */

import { AIContent, ValidationResult, ValidationError, ContentType } from '../types/content';

export class ContentValidator {
  private readonly minTitleLength = 3;
  private readonly maxTitleLength = 200;
  private readonly minContentLength = 10;
  private readonly maxExcerptLength = 300;

  /**
   * Validate AI-generated content
   */
  validate(content: AIContent): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    // Basic validation
    this.validateTitle(content.title, errors);
    this.validateContent(content.content, errors);
    this.validateType(content.type, errors);
    
    // Optional field validation
    this.validateExcerpt(content.excerpt, errors, warnings);
    this.validateTags(content.tags, warnings);
    this.validateCategories(content.categories, warnings);
    this.validateSEO(content.seo, warnings);
    this.validateImages(content.images, warnings);
    
    // Type-specific validation
    this.validateTypeSpecificContent(content, errors, warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate content title
   */
  private validateTitle(title: string, errors: ValidationError[]): void {
    if (!title || title.trim() === '') {
      errors.push({
        field: 'title',
        message: 'Title is required',
        code: 'TITLE_REQUIRED',
      });
      return;
    }

    const trimmedTitle = title.trim();
    
    if (trimmedTitle.length < this.minTitleLength) {
      errors.push({
        field: 'title',
        message: `Title must be at least ${this.minTitleLength} characters long`,
        code: 'TITLE_TOO_SHORT',
      });
    }

    if (trimmedTitle.length > this.maxTitleLength) {
      errors.push({
        field: 'title',
        message: `Title must not exceed ${this.maxTitleLength} characters`,
        code: 'TITLE_TOO_LONG',
      });
    }
  }

  /**
   * Validate main content
   */
  private validateContent(content: string, errors: ValidationError[]): void {
    if (!content || content.trim() === '') {
      errors.push({
        field: 'content',
        message: 'Content is required',
        code: 'CONTENT_REQUIRED',
      });
      return;
    }

    const trimmedContent = content.trim();
    
    if (trimmedContent.length < this.minContentLength) {
      errors.push({
        field: 'content',
        message: `Content must be at least ${this.minContentLength} characters long`,
        code: 'CONTENT_TOO_SHORT',
      });
    }
  }

  /**
   * Validate content type
   */
  private validateType(type: ContentType, errors: ValidationError[]): void {
    const validTypes: ContentType[] = ['blog', 'faq', 'article', 'product-description', 'landing-page'];
    
    if (!validTypes.includes(type)) {
      errors.push({
        field: 'type',
        message: `Invalid content type. Must be one of: ${validTypes.join(', ')}`,
        code: 'INVALID_CONTENT_TYPE',
      });
    }
  }

  /**
   * Validate excerpt
   */
  private validateExcerpt(excerpt: string | undefined, errors: ValidationError[], warnings: ValidationError[]): void {
    if (!excerpt) {
      warnings.push({
        field: 'excerpt',
        message: 'Excerpt is recommended for better SEO',
        code: 'EXCERPT_MISSING',
      });
      return;
    }

    if (excerpt.length > this.maxExcerptLength) {
      errors.push({
        field: 'excerpt',
        message: `Excerpt must not exceed ${this.maxExcerptLength} characters`,
        code: 'EXCERPT_TOO_LONG',
      });
    }
  }

  /**
   * Validate tags
   */
  private validateTags(tags: string[] | undefined, warnings: ValidationError[]): void {
    if (!tags || tags.length === 0) {
      warnings.push({
        field: 'tags',
        message: 'Tags are recommended for better content organization',
        code: 'TAGS_MISSING',
      });
      return;
    }

    if (tags.length > 10) {
      warnings.push({
        field: 'tags',
        message: 'Too many tags may dilute SEO effectiveness. Consider using 5-10 tags.',
        code: 'TOO_MANY_TAGS',
      });
    }

    // Check for empty or invalid tags
    const invalidTags = tags.filter(tag => !tag || tag.trim() === '');
    if (invalidTags.length > 0) {
      warnings.push({
        field: 'tags',
        message: 'Some tags are empty or invalid',
        code: 'INVALID_TAGS',
      });
    }
  }

  /**
   * Validate categories
   */
  private validateCategories(categories: string[] | undefined, warnings: ValidationError[]): void {
    if (!categories || categories.length === 0) {
      warnings.push({
        field: 'categories',
        message: 'Categories are recommended for better content organization',
        code: 'CATEGORIES_MISSING',
      });
    }
  }

  /**
   * Validate SEO data
   */
  private validateSEO(seo: any, warnings: ValidationError[]): void {
    if (!seo) {
      warnings.push({
        field: 'seo',
        message: 'SEO data is recommended for better search visibility',
        code: 'SEO_MISSING',
      });
      return;
    }

    if (!seo.metaDescription) {
      warnings.push({
        field: 'seo.metaDescription',
        message: 'Meta description is recommended for SEO',
        code: 'META_DESCRIPTION_MISSING',
      });
    } else if (seo.metaDescription.length > 160) {
      warnings.push({
        field: 'seo.metaDescription',
        message: 'Meta description should be under 160 characters for optimal display',
        code: 'META_DESCRIPTION_TOO_LONG',
      });
    }

    if (!seo.metaTitle) {
      warnings.push({
        field: 'seo.metaTitle',
        message: 'Meta title is recommended for SEO',
        code: 'META_TITLE_MISSING',
      });
    } else if (seo.metaTitle.length > 60) {
      warnings.push({
        field: 'seo.metaTitle',
        message: 'Meta title should be under 60 characters for optimal display',
        code: 'META_TITLE_TOO_LONG',
      });
    }
  }

  /**
   * Validate images
   */
  private validateImages(images: any[] | undefined, warnings: ValidationError[]): void {
    if (!images || images.length === 0) {
      warnings.push({
        field: 'images',
        message: 'Images are recommended for better engagement',
        code: 'IMAGES_MISSING',
      });
      return;
    }

    images.forEach((image, index) => {
      if (!image.url) {
        warnings.push({
          field: `images[${index}].url`,
          message: 'Image URL is required',
          code: 'IMAGE_URL_MISSING',
        });
      }

      if (!image.alt) {
        warnings.push({
          field: `images[${index}].alt`,
          message: 'Alt text is recommended for accessibility and SEO',
          code: 'IMAGE_ALT_MISSING',
        });
      }
    });
  }

  /**
   * Validate type-specific content
   */
  private validateTypeSpecificContent(content: AIContent, errors: ValidationError[], warnings: ValidationError[]): void {
    switch (content.type) {
      case 'faq':
        this.validateFAQContent(content, errors);
        break;
      case 'product-description':
        this.validateProductContent(content, warnings);
        break;
      case 'landing-page':
        this.validateLandingPageContent(content, warnings);
        break;
    }
  }

  /**
   * Validate FAQ-specific content
   */
  private validateFAQContent(content: AIContent, errors: ValidationError[]): void {
    if (!content.faqs || content.faqs.length === 0) {
      errors.push({
        field: 'faqs',
        message: 'FAQ items are required for FAQ content type',
        code: 'FAQ_ITEMS_REQUIRED',
      });
      return;
    }

    content.faqs.forEach((faq, index) => {
      if (!faq.question || faq.question.trim() === '') {
        errors.push({
          field: `faqs[${index}].question`,
          message: 'FAQ question is required',
          code: 'FAQ_QUESTION_REQUIRED',
        });
      }

      if (!faq.answer || faq.answer.trim() === '') {
        errors.push({
          field: `faqs[${index}].answer`,
          message: 'FAQ answer is required',
          code: 'FAQ_ANSWER_REQUIRED',
        });
      }
    });
  }

  /**
   * Validate product description content
   */
  private validateProductContent(content: AIContent, warnings: ValidationError[]): void {
    if (!content.specifications || content.specifications.length === 0) {
      warnings.push({
        field: 'specifications',
        message: 'Product specifications are recommended for product descriptions',
        code: 'SPECIFICATIONS_MISSING',
      });
    }
  }

  /**
   * Validate landing page content
   */
  private validateLandingPageContent(content: AIContent, warnings: ValidationError[]): void {
    if (!content.ctaText) {
      warnings.push({
        field: 'ctaText',
        message: 'Call-to-action text is recommended for landing pages',
        code: 'CTA_TEXT_MISSING',
      });
    }

    if (!content.ctaUrl) {
      warnings.push({
        field: 'ctaUrl',
        message: 'Call-to-action URL is recommended for landing pages',
        code: 'CTA_URL_MISSING',
      });
    }
  }

  /**
   * Quick validation check (returns only boolean)
   */
  isValid(content: AIContent): boolean {
    return this.validate(content).isValid;
  }
}
