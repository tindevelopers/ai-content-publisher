/**
 * Tests for Logger
 */

import { SDKLogger, LogLevel, createLogger } from '../core/logger';

// Mock winston to avoid actual file operations during tests
jest.mock('winston', () => ({
  createLogger: jest.fn(() => ({
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
    http: jest.fn(),
    verbose: jest.fn(),
    debug: jest.fn(),
    silly: jest.fn(),
    on: jest.fn(),
    end: jest.fn()
  })),
  transports: {
    Console: jest.fn(),
    File: jest.fn()
  },
  format: {
    combine: jest.fn(() => 'combined-format'),
    timestamp: jest.fn(() => 'timestamp-format'),
    errors: jest.fn(() => 'errors-format'),
    json: jest.fn(() => 'json-format'),
    printf: jest.fn(() => 'printf-format'),
    colorize: jest.fn(() => 'colorize-format')
  }
}));

describe('SDKLogger', () => {
  let logger: SDKLogger;
  let mockWinstonLogger: any;

  beforeEach(() => {
    const winston = require('winston');
    mockWinstonLogger = {
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      http: jest.fn(),
      verbose: jest.fn(),
      debug: jest.fn(),
      silly: jest.fn(),
      on: jest.fn(),
      end: jest.fn()
    };
    winston.createLogger.mockReturnValue(mockWinstonLogger);
    
    logger = new SDKLogger({
      level: LogLevel.DEBUG,
      enableConsole: true,
      enableFile: false
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('basic logging methods', () => {
    it('should log error messages', () => {
      logger.error('Test error message');
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Test error message',
        {}
      );
    });

    it('should log info messages with context', () => {
      const context = {
        platform: 'webflow',
        contentId: 'test-123',
        operation: 'publish'
      };
      
      logger.info('Publishing content', context);
      
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Publishing content',
        {
          platform: 'webflow',
          contentId: 'test-123',
          operation: 'publish'
        }
      );
    });

    it('should log warnings with metadata', () => {
      const context = {
        platform: 'wordpress',
        metadata: { retryCount: 2, maxRetries: 3 }
      };
      
      logger.warn('Retry attempt', context);
      
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Retry attempt',
        {
          platform: 'wordpress',
          metadata: { retryCount: 2, maxRetries: 3 }
        }
      );
    });

    it('should format error objects correctly', () => {
      const error = new Error('Test error');
      error.stack = 'Error stack trace';
      
      const context = {
        error,
        operation: 'test'
      };
      
      logger.error('Operation failed', context);
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Operation failed',
        {
          operation: 'test',
          error: {
            name: 'Error',
            message: 'Test error',
            stack: 'Error stack trace'
          }
        }
      );
    });
  });

  describe('convenience methods', () => {
    it('should log API calls correctly', () => {
      logger.logApiCall('POST', '/api/content', 201, 1500, {
        platform: 'webflow',
        contentId: 'test-123'
      });
      
      expect(mockWinstonLogger.http).toHaveBeenCalledWith(
        'POST /api/content - 201 (1500ms)',
        {
          platform: 'webflow',
          contentId: 'test-123',
          operation: 'api_call',
          statusCode: 201,
          duration: 1500,
          metadata: {
            method: 'POST',
            url: '/api/content'
          }
        }
      );
    });

    it('should log API errors with error level', () => {
      logger.logApiCall('GET', '/api/content', 500, 2000);
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'GET /api/content - 500 (2000ms)',
        {
          operation: 'api_call',
          statusCode: 500,
          duration: 2000,
          metadata: {
            method: 'GET',
            url: '/api/content'
          }
        }
      );
    });

    it('should log publish attempts', () => {
      logger.logPublishAttempt('wordpress', 'content-123', true, 3000);
      
      expect(mockWinstonLogger.info).toHaveBeenCalledWith(
        'Content publish succeeded for wordpress',
        {
          platform: 'wordpress',
          contentId: 'content-123',
          operation: 'publish_content',
          duration: 3000,
          metadata: {
            success: true
          }
        }
      );
    });

    it('should log failed publish attempts with error', () => {
      const error = new Error('Network timeout');
      
      logger.logPublishAttempt('medium', 'content-456', false, 5000, error);
      
      expect(mockWinstonLogger.error).toHaveBeenCalledWith(
        'Content publish failed for medium',
        {
          platform: 'medium',
          contentId: 'content-456',
          operation: 'publish_content',
          duration: 5000,
          error: {
            name: 'Error',
            message: 'Network timeout',
            stack: error.stack
          },
          metadata: {
            success: false
          }
        }
      );
    });

    it('should log retry attempts', () => {
      const error = new Error('Temporary failure');
      
      logger.logRetryAttempt('publish_content', 2, 3, error, {
        platform: 'twitter',
        contentId: 'tweet-789'
      });
      
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Retry attempt 2/3 for publish_content',
        {
          platform: 'twitter',
          contentId: 'tweet-789',
          operation: 'retry_attempt',
          error: {
            name: 'Error',
            message: 'Temporary failure',
            stack: error.stack
          },
          metadata: {
            attempt: 2,
            maxRetries: 3
          }
        }
      );
    });

    it('should log circuit breaker state changes', () => {
      logger.logCircuitBreakerStateChange('webflow_api', 'closed', 'open', 5);
      
      expect(mockWinstonLogger.warn).toHaveBeenCalledWith(
        'Circuit breaker webflow_api state changed from closed to open',
        {
          operation: 'circuit_breaker_state_change',
          metadata: {
            circuitBreakerKey: 'webflow_api',
            oldState: 'closed',
            newState: 'open',
            failureCount: 5
          }
        }
      );
    });
  });

  describe('performance timer', () => {
    it('should create and complete timer', (done) => {
      const endTimer = logger.startTimer('test_operation');
      
      setTimeout(() => {
        endTimer();
        
        expect(mockWinstonLogger.debug).toHaveBeenCalledWith(
          'Timer test_operation completed',
          expect.objectContaining({
            operation: 'performance_timer',
            duration: expect.any(Number),
            metadata: { label: 'test_operation' }
          })
        );
        done();
      }, 10);
    });
  });

  describe('configuration', () => {
    it('should update configuration', () => {
      const newConfig = {
        level: LogLevel.ERROR,
        enableFile: true
      };
      
      logger.updateConfig(newConfig);
      
      const config = logger.getConfig();
      expect(config.level).toBe(LogLevel.ERROR);
      expect(config.enableFile).toBe(true);
    });

    it('should get current configuration', () => {
      const config = logger.getConfig();
      
      expect(config).toEqual(expect.objectContaining({
        level: LogLevel.DEBUG,
        enableConsole: true,
        enableFile: false
      }));
    });
  });

  describe('flush', () => {
    it('should flush logs', async () => {
      mockWinstonLogger.on.mockImplementation((event: string, callback: () => void) => {
        if (event === 'finish') {
          setTimeout(callback, 10);
        }
      });
      
      const flushPromise = logger.flush();
      
      expect(mockWinstonLogger.end).toHaveBeenCalled();
      await expect(flushPromise).resolves.toBeUndefined();
    });
  });
});

describe('createLogger factory', () => {
  it('should create logger with custom config', () => {
    const customLogger = createLogger({
      level: LogLevel.WARN,
      enableFile: true,
      filename: 'custom.log'
    });
    
    expect(customLogger).toBeInstanceOf(SDKLogger);
    
    const config = customLogger.getConfig();
    expect(config.level).toBe(LogLevel.WARN);
    expect(config.enableFile).toBe(true);
    expect(config.filename).toBe('custom.log');
  });
});

describe('LogLevel enum', () => {
  it('should have all expected log levels', () => {
    expect(LogLevel.ERROR).toBe('error');
    expect(LogLevel.WARN).toBe('warn');
    expect(LogLevel.INFO).toBe('info');
    expect(LogLevel.HTTP).toBe('http');
    expect(LogLevel.VERBOSE).toBe('verbose');
    expect(LogLevel.DEBUG).toBe('debug');
    expect(LogLevel.SILLY).toBe('silly');
  });
});
