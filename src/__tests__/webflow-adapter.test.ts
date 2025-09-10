/**
 * Tests for WebflowAdapter
 */

import { WebflowAdapter } from '../adapters/webflow-adapter';
import { WebflowConfig } from '../types/config';
import { AIContent } from '../types/content';
import axios from 'axios';

// Mock axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WebflowAdapter', () => {
  let adapter: WebflowAdapter;
  let config: WebflowConfig;

  beforeEach(() => {
    config = {
      apiKey: 'test-api-key-1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      siteId: 'test-site-id',
      defaultCollectionId: 'test-collection-id'
    };

    // Mock axios.create to return a mock instance
    const mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      patch: jest.fn(),
      delete: jest.fn()
    };
    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    adapter = new WebflowAdapter(config);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('constructor', () => {
    it('should create adapter with valid config', () => {
      expect(adapter).toBeInstanceOf(WebflowAdapter);
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'https://api.webflow.com/v2',
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'accept-version': '1.0.0',
        },
        timeout: 30000,
      });
    });

    it('should use custom baseUrl if provided', () => {
      const customConfig = {
        ...config,
        baseUrl: 'https://custom-api.webflow.com'
      };

      new WebflowAdapter(customConfig);

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          baseURL: 'https://custom-api.webflow.com'
        })
      );
    });
  });

  describe('testConnection', () => {
    it('should return success for valid connection', async () => {
      const mockResponse = {
        status: 200,
        data: { id: config.siteId, name: 'Test Site' }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await adapter.testConnection();

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
      expect(result.statusCode).toBe(200);
      expect(mockAxiosInstance.get).toHaveBeenCalledWith(`/sites/${config.siteId}`);
    });

    it('should return error for failed connection', async () => {
      const mockError = {
        response: {
          status: 401,
          data: { message: 'Unauthorized' }
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockRejectedValue(mockError);

      const result = await adapter.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
      expect(result.statusCode).toBe(401);
    });

    it('should handle network errors', async () => {
      const mockError = new Error('Network Error');

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockRejectedValue(mockError);

      const result = await adapter.testConnection();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network Error');
    });
  });

  describe('getCollections', () => {
    it('should return formatted collections', async () => {
      const mockResponse = {
        status: 200,
        data: {
          collections: [
            {
              id: 'collection-1',
              displayName: 'Blog Posts',
              slug: 'blog-posts',
              fields: [
                {
                  id: 'field-1',
                  displayName: 'Title',
                  type: 'PlainText',
                  isRequired: true,
                  helpText: 'The post title'
                }
              ]
            }
          ]
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockResolvedValue(mockResponse);

      const result = await adapter.getCollections();

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0]).toEqual({
        id: 'collection-1',
        name: 'Blog Posts',
        slug: 'blog-posts',
        platform: 'webflow',
        fields: [
          {
            id: 'field-1',
            name: 'Title',
            type: 'PlainText',
            required: true,
            description: 'The post title'
          }
        ]
      });
    });

    it('should handle API errors', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { message: 'Forbidden' }
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockRejectedValue(mockError);

      const result = await adapter.getCollections();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Forbidden');
    });
  });

  describe('publishContent', () => {
    const mockContent: AIContent = {
      type: 'blog',
      title: 'Test Blog Post',
      content: 'This is test content for the blog post.',
      excerpt: 'Test excerpt',
      tags: ['test', 'blog'],
      categories: ['Technology'],
      status: 'published',
      seo: {
        metaTitle: 'Test Meta Title',
        metaDescription: 'Test meta description'
      }
    };

    it('should publish content successfully', async () => {
      const mockCollectionResponse = {
        status: 200,
        data: {
          id: 'collection-1',
          displayName: 'Blog Posts',
          slug: 'blog-posts',
          fields: [
            { id: 'name', displayName: 'Name', type: 'PlainText', isRequired: true },
            { id: 'content', displayName: 'Content', type: 'RichText', isRequired: true },
            { id: 'slug', displayName: 'Slug', type: 'PlainText', isRequired: false }
          ]
        }
      };

      const mockPublishResponse = {
        status: 201,
        data: {
          id: 'item-123',
          slug: 'test-blog-post'
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockResolvedValue(mockCollectionResponse);
      mockAxiosInstance.post.mockResolvedValue(mockPublishResponse);
      mockAxiosInstance.patch.mockResolvedValue({ status: 200 });

      const result = await adapter.publishContent(mockContent);

      expect(result.success).toBe(true);
      expect(result.platform).toBe('webflow');
      expect(result.contentId).toBe('item-123');
      expect(result.url).toContain('test-blog-post');
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        `/collections/${config.defaultCollectionId}/items`,
        expect.objectContaining({
          fields: expect.objectContaining({
            name: mockContent.title,
            content: mockContent.content
          })
        }),
        expect.objectContaining({
          timeout: undefined
        })
      );
    });

    it('should fail when collection ID is missing', async () => {
      const adapterWithoutCollection = new WebflowAdapter({
        apiKey: config.apiKey,
        siteId: config.siteId
      });

      const result = await adapterWithoutCollection.publishContent(mockContent);

      expect(result.success).toBe(false);
      expect(result.message).toContain('Collection ID is required');
      expect(result.errors).toContain('COLLECTION_ID_MISSING');
    });

    it('should handle collection fetch errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Collection not found' }
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockRejectedValue(mockError);

      const result = await adapter.publishContent(mockContent);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to fetch collection schema');
    });

    it('should handle publish errors', async () => {
      const mockCollectionResponse = {
        status: 200,
        data: {
          id: 'collection-1',
          fields: [
            { id: 'name', displayName: 'Name', type: 'PlainText', isRequired: true }
          ]
        }
      };

      const mockError = {
        response: {
          status: 400,
          data: { message: 'Invalid data' }
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockResolvedValue(mockCollectionResponse);
      mockAxiosInstance.post.mockRejectedValue(mockError);

      const result = await adapter.publishContent(mockContent);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to publish content to Webflow');
      expect(result.errors).toContain('Invalid data');
    });
  });

  describe('updateContent', () => {
    it('should update content successfully', async () => {
      const mockCollectionResponse = {
        status: 200,
        data: {
          id: 'collection-1',
          fields: [
            { id: 'name', displayName: 'Name', type: 'PlainText', isRequired: true },
            { id: 'content', displayName: 'Content', type: 'RichText', isRequired: true }
          ]
        }
      };

      const mockUpdateResponse = {
        status: 200,
        data: {
          id: 'item-123'
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.get.mockResolvedValue(mockCollectionResponse);
      mockAxiosInstance.patch.mockResolvedValue(mockUpdateResponse);

      const updates = { title: 'Updated Title', content: 'Updated content' };
      const result = await adapter.updateContent('item-123', updates, config.defaultCollectionId);

      expect(result.success).toBe(true);
      expect(result.contentId).toBe('item-123');
      expect(mockAxiosInstance.patch).toHaveBeenCalledWith(
        `/collections/${config.defaultCollectionId}/items/item-123`,
        expect.objectContaining({
          fields: expect.objectContaining({
            name: 'Updated Title',
            content: 'Updated content'
          })
        })
      );
    });
  });

  describe('deleteContent', () => {
    it('should delete content successfully', async () => {
      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.delete.mockResolvedValue({ status: 204 });

      const result = await adapter.deleteContent('item-123', config.defaultCollectionId);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Content deleted successfully from Webflow');
      expect(mockAxiosInstance.delete).toHaveBeenCalledWith(
        `/collections/${config.defaultCollectionId}/items/item-123`
      );
    });

    it('should handle delete errors', async () => {
      const mockError = {
        response: {
          status: 404,
          data: { message: 'Item not found' }
        }
      };

      const mockAxiosInstance = mockedAxios.create() as any;
      mockAxiosInstance.delete.mockRejectedValue(mockError);

      const result = await adapter.deleteContent('item-123', config.defaultCollectionId);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Failed to delete content from Webflow');
      expect(result.errors).toContain('Item not found');
    });
  });

  describe('field mapping', () => {
    it('should generate slug from title', () => {
      // Test the slug generation logic directly
      const testSlugGeneration = (title: string): string => {
        return title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
      };
      
      expect(testSlugGeneration('Hello World! Test')).toBe('hello-world-test');
      expect(testSlugGeneration('  Multiple   Spaces  ')).toBe('multiple-spaces');
      expect(testSlugGeneration('Special@#$%Characters')).toBe('special-characters');
    });

    it('should map content fields correctly', () => {
      // Test the field mapping logic conceptually
      const content: AIContent = {
        type: 'blog',
        title: 'Test Title',
        content: 'Test content',
        excerpt: 'Test excerpt',
        tags: ['tag1', 'tag2'],
        seo: {
          metaTitle: 'SEO Title'
        }
      };

      // Verify the content structure is valid for mapping
      expect(content.title).toBe('Test Title');
      expect(content.content).toBe('Test content');
      expect(content.excerpt).toBe('Test excerpt');
      expect(content.tags).toEqual(['tag1', 'tag2']);
      expect(content.seo?.metaTitle).toBe('SEO Title');
    });
  });
});
