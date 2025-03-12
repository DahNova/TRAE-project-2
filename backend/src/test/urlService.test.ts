import { UrlCrawlerService } from '../services/urlCrawlerService';
import { HttpService } from '../services/httpService';

// Mock the HttpService
jest.mock('../services/httpService');

describe('UrlCrawlerService', () => {
  let urlCrawlerService: UrlCrawlerService;
  let mockHttpService: jest.Mocked<HttpService>;

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Setup mock implementation
    mockHttpService = new HttpService() as jest.Mocked<HttpService>;
    mockHttpService.fetch = jest.fn();
    
    // Create service with mocked dependencies
    urlCrawlerService = new UrlCrawlerService();
    // @ts-ignore - we're replacing the private property
    urlCrawlerService['httpService'] = mockHttpService;
  });

  describe('checkUrl', () => {
    it('should correctly handle a successful HTML response', async () => {
      // Mock a successful HTML response
      mockHttpService.fetch.mockResolvedValue({
        data: '<html><head><title>Test Page</title><meta name="description" content="Test Description"></head><body><h1>Test Header</h1></body></html>',
        status: 200,
        headers: {
          'content-type': 'text/html; charset=utf-8'
        },
        redirectChain: [],
        responseTime: 100,
        url: 'https://example.com'
      });

      const result = await urlCrawlerService.checkUrl('https://example.com');

      expect(result).toMatchObject({
        url: expect.any(String),
        status: 200,
        title: 'Test Page',
        description: 'Test Description',
        h1: 'Test Header',
        responseTime: expect.any(Number),
        timestamp: expect.any(Date)
      });

      expect(mockHttpService.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          followRedirects: true
        })
      );
    });

    it('should correctly handle a non-HTML response', async () => {
      // Mock a successful non-HTML response
      mockHttpService.fetch.mockResolvedValue({
        data: '{"key": "value"}',
        status: 200,
        headers: {
          'content-type': 'application/json'
        },
        redirectChain: [],
        responseTime: 100,
        url: 'https://example.com/api'
      });

      const result = await urlCrawlerService.checkUrl('https://example.com/api');

      expect(result).toMatchObject({
        url: expect.any(String),
        status: 200,
        title: '',
        description: '',
        h1: '',
        responseTime: expect.any(Number),
        timestamp: expect.any(Date)
      });
    });

    it('should correctly handle an error response', async () => {
      // Mock an error response
      mockHttpService.fetch.mockResolvedValue({
        data: '',
        status: 404,
        headers: {},
        redirectChain: [],
        responseTime: 100,
        url: 'https://example.com/not-found'
      });

      const result = await urlCrawlerService.checkUrl('https://example.com/not-found');

      expect(result).toMatchObject({
        url: expect.any(String),
        status: 404,
        responseTime: expect.any(Number),
        timestamp: expect.any(Date)
      });
    });

    it('should handle exceptions gracefully', async () => {
      // Mock a network error
      mockHttpService.fetch.mockRejectedValue(new Error('Network error'));

      const result = await urlCrawlerService.checkUrl('https://example.com');

      expect(result).toMatchObject({
        url: expect.any(String),
        status: 0,
        responseTime: 0,
        errors: ['Network error'],
        timestamp: expect.any(Date)
      });
    });
  });
});