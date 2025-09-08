/**
 * Tests for ContentValidator
 */

import { ContentValidator } from '../core/content-validator';
import { AIContent } from '../types/content';

describe('ContentValidator', () => {
  let validator: ContentValidator;

  beforeEach(() => {
    validator = new ContentValidator();
  });

  describe('Basic validation', () => {
    it('should validate a valid blog post', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Blog Post Title',
        content: 'This is a valid blog post content with sufficient length.',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject content with empty title', () => {
      const content: AIContent = {
        type: 'blog',
        title: '',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title is required',
        code: 'TITLE_REQUIRED'
      });
    });

    it('should reject content with short title', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Hi',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'title',
        message: 'Title must be at least 3 characters long',
        code: 'TITLE_TOO_SHORT'
      });
    });

    it('should reject content with empty content', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: '',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'content',
        message: 'Content is required',
        code: 'CONTENT_REQUIRED'
      });
    });

    it('should reject invalid content type', () => {
      const content: any = {
        type: 'invalid-type',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'type',
        message: 'Invalid content type. Must be one of: blog, faq, article, product-description, landing-page',
        code: 'INVALID_CONTENT_TYPE'
      });
    });
  });

  describe('Warnings', () => {
    it('should warn about missing excerpt', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'excerpt',
        message: 'Excerpt is recommended for better SEO',
        code: 'EXCERPT_MISSING'
      });
    });

    it('should warn about missing tags', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'tags',
        message: 'Tags are recommended for better content organization',
        code: 'TAGS_MISSING'
      });
    });

    it('should warn about too many tags', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        tags: Array(15).fill('tag'),
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'tags',
        message: 'Too many tags may dilute SEO effectiveness. Consider using 5-10 tags.',
        code: 'TOO_MANY_TAGS'
      });
    });
  });

  describe('SEO validation', () => {
    it('should warn about missing SEO data', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.warnings).toContainEqual({
        field: 'seo',
        message: 'SEO data is recommended for better search visibility',
        code: 'SEO_MISSING'
      });
    });

    it('should warn about long meta description', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        seo: {
          metaDescription: 'This is a very long meta description that exceeds the recommended 160 character limit for optimal display in search engine results pages and may be truncated by search engines which is not ideal for SEO purposes.'
        },
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.warnings).toContainEqual({
        field: 'seo.metaDescription',
        message: 'Meta description should be under 160 characters for optimal display',
        code: 'META_DESCRIPTION_TOO_LONG'
      });
    });
  });

  describe('FAQ validation', () => {
    it('should validate FAQ content with proper structure', () => {
      const content: AIContent = {
        type: 'faq',
        title: 'FAQ Title',
        content: 'FAQ content here',
        faqs: [
          {
            question: 'What is this?',
            answer: 'This is an answer'
          }
        ],
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
    });

    it('should require FAQ items for FAQ content type', () => {
      const content: AIContent = {
        type: 'faq',
        title: 'FAQ Title',
        content: 'FAQ content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'faqs',
        message: 'FAQ items are required for FAQ content type',
        code: 'FAQ_ITEMS_REQUIRED'
      });
    });

    it('should require question and answer in FAQ items', () => {
      const content: AIContent = {
        type: 'faq',
        title: 'FAQ Title',
        content: 'FAQ content here',
        faqs: [
          {
            question: '',
            answer: 'Valid answer'
          },
          {
            question: 'Valid question',
            answer: ''
          }
        ],
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContainEqual({
        field: 'faqs[0].question',
        message: 'FAQ question is required',
        code: 'FAQ_QUESTION_REQUIRED'
      });
      expect(result.errors).toContainEqual({
        field: 'faqs[1].answer',
        message: 'FAQ answer is required',
        code: 'FAQ_ANSWER_REQUIRED'
      });
    });
  });

  describe('Landing page validation', () => {
    it('should warn about missing CTA for landing pages', () => {
      const content: AIContent = {
        type: 'landing-page',
        title: 'Landing Page Title',
        content: 'Landing page content here',
        status: 'published'
      };

      const result = validator.validate(content);
      expect(result.isValid).toBe(true);
      expect(result.warnings).toContainEqual({
        field: 'ctaText',
        message: 'Call-to-action text is recommended for landing pages',
        code: 'CTA_TEXT_MISSING'
      });
      expect(result.warnings).toContainEqual({
        field: 'ctaUrl',
        message: 'Call-to-action URL is recommended for landing pages',
        code: 'CTA_URL_MISSING'
      });
    });
  });

  describe('isValid method', () => {
    it('should return boolean for quick validation', () => {
      const validContent: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const invalidContent: AIContent = {
        type: 'blog',
        title: '',
        content: 'Valid content here',
        status: 'published'
      };

      expect(validator.isValid(validContent)).toBe(true);
      expect(validator.isValid(invalidContent)).toBe(false);
    });
  });
});
