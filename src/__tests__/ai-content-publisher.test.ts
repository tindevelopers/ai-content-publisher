/**
 * Tests for AIContentPublisher
 */

import { AIContentPublisher } from '../core/ai-content-publisher';
import { AIContent } from '../types/content';

// Mock the adapters
jest.mock('../adapters/webflow-adapter');
jest.mock('../adapters/wordpress-adapter');

describe('AIContentPublisher', () => {
  let publisher: AIContentPublisher;

  beforeEach(() => {
    publisher = new AIContentPublisher();
  });

  describe('Configuration', () => {
    it('should configure Webflow successfully', async () => {
      // Mock successful connection test
      const mockWebflowAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true })
      };
      
      (require('../adapters/webflow-adapter').WebflowAdapter as jest.Mock)
        .mockImplementation(() => mockWebflowAdapter);

      await expect(
        publisher.configureWebflow('test-api-key', 'test-site-id')
      ).resolves.not.toThrow();

      expect(publisher.getConfigurationStatus().webflow).toBe(true);
    });

    it('should configure WordPress successfully', async () => {
      // Mock successful connection test
      const mockWordPressAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true })
      };
      
      (require('../adapters/wordpress-adapter').WordPressAdapter as jest.Mock)
        .mockImplementation(() => mockWordPressAdapter);

      await expect(
        publisher.configureWordPress('https://test.com', 'user', 'pass')
      ).resolves.not.toThrow();

      expect(publisher.getConfigurationStatus().wordpress).toBe(true);
    });

    it('should throw error for invalid Webflow configuration', async () => {
      // Mock failed connection test
      const mockWebflowAdapter = {
        testConnection: jest.fn().mockResolvedValue({ 
          success: false, 
          error: 'Invalid API key' 
        })
      };
      
      (require('../adapters/webflow-adapter').WebflowAdapter as jest.Mock)
        .mockImplementation(() => mockWebflowAdapter);

      await expect(
        publisher.configureWebflow('invalid-key', 'test-site-id')
      ).rejects.toThrow('Webflow configuration failed: Invalid API key');
    });
  });

  describe('Content validation', () => {
    it('should validate content before publishing', async () => {
      const invalidContent: AIContent = {
        type: 'blog',
        title: '', // Invalid - empty title
        content: 'Valid content',
        status: 'published'
      };

      const result = await publisher.publish(invalidContent, 'webflow');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Content validation failed');
      expect(result.errors).toContain('title: Title is required');
    });

    it('should return validation result', () => {
      const content: AIContent = {
        type: 'blog',
        title: 'Valid Title',
        content: 'Valid content here',
        status: 'published'
      };

      const validation = publisher.validateContent(content);
      expect(validation.isValid).toBe(true);
    });
  });

  describe('Publishing', () => {
    const validContent: AIContent = {
      type: 'blog',
      title: 'Test Blog Post',
      content: 'This is test content for the blog post.',
      status: 'published'
    };

    beforeEach(() => {
      // Mock successful publishing
      const mockWebflowAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true }),
        publishContent: jest.fn().mockResolvedValue({
          success: true,
          platform: 'webflow',
          contentId: 'test-id',
          url: 'https://test.webflow.io/test-id'
        })
      };

      const mockWordPressAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true }),
        publishContent: jest.fn().mockResolvedValue({
          success: true,
          platform: 'wordpress',
          contentId: '123',
          url: 'https://test.com/test-post'
        })
      };

      (require('../adapters/webflow-adapter').WebflowAdapter as jest.Mock)
        .mockImplementation(() => mockWebflowAdapter);
      
      (require('../adapters/wordpress-adapter').WordPressAdapter as jest.Mock)
        .mockImplementation(() => mockWordPressAdapter);
    });

    it('should publish to Webflow', async () => {
      await publisher.configureWebflow('test-key', 'test-site');
      
      const result = await publisher.publish(validContent, 'webflow');
      
      expect(result.success).toBe(true);
      expect(result.platform).toBe('webflow');
      expect(result.contentId).toBe('test-id');
    });

    it('should publish to WordPress', async () => {
      await publisher.configureWordPress('https://test.com', 'user', 'pass');
      
      const result = await publisher.publish(validContent, 'wordpress');
      
      expect(result.success).toBe(true);
      expect(result.platform).toBe('wordpress');
      expect(result.contentId).toBe('123');
    });

    it('should publish to multiple platforms', async () => {
      await publisher.configureWebflow('test-key', 'test-site');
      await publisher.configureWordPress('https://test.com', 'user', 'pass');
      
      const results = await publisher.publishToMultiple(validContent, ['webflow', 'wordpress']);
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
      expect(results.map(r => r.platform)).toEqual(['webflow', 'wordpress']);
    });

    it('should fail when platform not configured', async () => {
      const result = await publisher.publish(validContent, 'webflow');
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Webflow not configured. Call configureWebflow() first.');
    });

    it('should handle unsupported platform', async () => {
      const result = await publisher.publish(validContent, 'unsupported' as any);
      
      expect(result.success).toBe(false);
      expect(result.message).toBe('Unsupported platform');
    });
  });

  describe('Batch publishing', () => {
    const contentItems: AIContent[] = [
      {
        type: 'blog',
        title: 'Post 1 Title',
        content: 'This is valid content for post 1 with sufficient length.',
        status: 'published'
      },
      {
        type: 'blog',
        title: 'Post 2 Title',
        content: 'This is valid content for post 2 with sufficient length.',
        status: 'published'
      }
    ];

    it('should batch publish content items', async () => {
      // Mock successful publishing
      const mockWordPressAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true }),
        publishContent: jest.fn()
          .mockResolvedValueOnce({
            success: true,
            platform: 'wordpress',
            contentId: '1'
          })
          .mockResolvedValueOnce({
            success: true,
            platform: 'wordpress',
            contentId: '2'
          })
      };

      (require('../adapters/wordpress-adapter').WordPressAdapter as jest.Mock)
        .mockImplementation(() => mockWordPressAdapter);

      await publisher.configureWordPress('https://test.com', 'user', 'pass');
      
      const results = await publisher.batchPublish(contentItems, 'wordpress');
      
      expect(results).toHaveLength(2);
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle batch publishing errors', async () => {
      // Mock mixed success/failure
      const mockWordPressAdapter = {
        testConnection: jest.fn().mockResolvedValue({ success: true }),
        publishContent: jest.fn()
          .mockResolvedValueOnce({
            success: true,
            platform: 'wordpress',
            contentId: '1'
          })
          .mockResolvedValueOnce({
            success: false,
            platform: 'wordpress',
            message: 'Publishing failed'
          })
      };

      (require('../adapters/wordpress-adapter').WordPressAdapter as jest.Mock)
        .mockImplementation(() => mockWordPressAdapter);

      await publisher.configureWordPress('https://test.com', 'user', 'pass');
      
      const results = await publisher.batchPublish(contentItems, 'wordpress', {
        stopOnError: false
      });
      
      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Utility methods', () => {
    it('should return configuration status', () => {
      const status = publisher.getConfigurationStatus();
      expect(status).toEqual({
        webflow: false,
        wordpress: false
      });
    });

    it('should clear configuration', () => {
      publisher.clearConfiguration();
      const status = publisher.getConfigurationStatus();
      expect(status.webflow).toBe(false);
      expect(status.wordpress).toBe(false);
    });
  });
});
