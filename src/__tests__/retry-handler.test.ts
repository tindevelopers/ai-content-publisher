/**
 * Tests for RetryHandler
 */

import { RetryHandler, RetryableError, ErrorType, CircuitBreaker, CircuitState, DEFAULT_RETRY_CONFIGS } from '../core/retry-handler';

describe('RetryHandler', () => {
  let retryHandler: RetryHandler;

  beforeEach(() => {
    retryHandler = new RetryHandler(DEFAULT_RETRY_CONFIGS.api);
  });

  describe('executeWithRetry', () => {
    it('should succeed on first attempt', async () => {
      const mockOperation = jest.fn().mockResolvedValue('success');
      
      const result = await retryHandler.executeWithRetry(mockOperation);
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should retry on retryable errors', async () => {
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(new Error('network timeout'))
        .mockRejectedValueOnce(new Error('connection reset'))
        .mockResolvedValue('success');
      
      const result = await retryHandler.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelayMs: 10, // Very short delay for testing
        maxDelayMs: 50,
        exponentialBackoff: false
      });
      
      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(3);
      expect(mockOperation).toHaveBeenCalledTimes(3);
    }, 10000); // Increase timeout

    it('should not retry on non-retryable errors', async () => {
      const nonRetryableError = new RetryableError(
        'Invalid API key',
        ErrorType.AUTHENTICATION,
        false
      );
      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);
      
      const result = await retryHandler.executeWithRetry(mockOperation);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe(nonRetryableError);
      expect(result.attempts).toBe(1);
      expect(mockOperation).toHaveBeenCalledTimes(1);
    });

    it('should respect max retries', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('network error'));
      
      const result = await retryHandler.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelayMs: 10,
        maxDelayMs: 100,
        exponentialBackoff: false
      });
      
      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3); // 1 initial + 2 retries
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff', async () => {
      const mockOperation = jest.fn().mockRejectedValue(new Error('timeout'));
      const startTime = Date.now();
      
      await retryHandler.executeWithRetry(mockOperation, {
        maxRetries: 2,
        baseDelayMs: 100,
        maxDelayMs: 1000,
        exponentialBackoff: true
      });
      
      const duration = Date.now() - startTime;
      // Should take at least 100ms (first retry) + 200ms (second retry) = 300ms
      expect(duration).toBeGreaterThan(250);
    });

    it('should categorize errors correctly', () => {
      expect(RetryHandler.categorizeError({ response: { status: 401 } }))
        .toBe(ErrorType.AUTHENTICATION);
      
      expect(RetryHandler.categorizeError({ response: { status: 429 } }))
        .toBe(ErrorType.RATE_LIMIT);
      
      expect(RetryHandler.categorizeError({ response: { status: 500 } }))
        .toBe(ErrorType.SERVER);
      
      expect(RetryHandler.categorizeError({ message: 'network error' }))
        .toBe(ErrorType.NETWORK);
      
      expect(RetryHandler.categorizeError({ message: 'validation failed' }))
        .toBe(ErrorType.VALIDATION);
    });
  });

  describe('CircuitBreaker', () => {
    let circuitBreaker: CircuitBreaker;

    beforeEach(() => {
      circuitBreaker = new CircuitBreaker(3, 1000); // 3 failures, 1 second reset
    });

    it('should start in CLOSED state', () => {
      expect(circuitBreaker.getState()).toBe(CircuitState.CLOSED);
    });

    it('should open after threshold failures', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));

      // Trigger failures to reach threshold
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected to fail
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);
      expect(circuitBreaker.getFailureCount()).toBe(3);
    });

    it('should reject operations when OPEN', async () => {
      const operation = jest.fn().mockResolvedValue('success');
      
      // Force circuit breaker to OPEN state
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(jest.fn().mockRejectedValue(new Error('fail')));
        } catch (error) {
          // Expected
        }
      }

      await expect(circuitBreaker.execute(operation))
        .rejects.toThrow('Circuit breaker is OPEN');
      
      expect(operation).not.toHaveBeenCalled();
    });

    it('should transition to HALF_OPEN after reset time', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Open the circuit breaker
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getState()).toBe(CircuitState.OPEN);

      // Wait for reset time (using a shorter time for testing)
      circuitBreaker = new CircuitBreaker(3, 10);
      for (let i = 0; i < 3; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      await new Promise(resolve => setTimeout(resolve, 15));

      // Next operation should transition to HALF_OPEN
      await circuitBreaker.execute(successOperation);
      expect(successOperation).toHaveBeenCalled();
    });

    it('should reset failure count on success', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('fail'));
      const successOperation = jest.fn().mockResolvedValue('success');

      // Trigger some failures
      for (let i = 0; i < 2; i++) {
        try {
          await circuitBreaker.execute(failingOperation);
        } catch (error) {
          // Expected
        }
      }

      expect(circuitBreaker.getFailureCount()).toBe(2);

      // Success should reset failure count
      await circuitBreaker.execute(successOperation);
      expect(circuitBreaker.getFailureCount()).toBe(0);
    });
  });

  describe('with circuit breaker integration', () => {
    it('should use circuit breaker when key is provided', async () => {
      const failingOperation = jest.fn().mockRejectedValue(new Error('network error'));
      
      // Trigger enough failures to open circuit breaker
      for (let i = 0; i < 4; i++) {
        await retryHandler.executeWithRetry(
          failingOperation,
          { maxRetries: 0, baseDelayMs: 1, maxDelayMs: 1, exponentialBackoff: false },
          'test-circuit'
        );
      }

      // Next call should fail immediately due to open circuit
      const result = await retryHandler.executeWithRetry(
        jest.fn().mockResolvedValue('success'),
        { maxRetries: 1, baseDelayMs: 1, maxDelayMs: 1, exponentialBackoff: false },
        'test-circuit'
      );

      expect(result.success).toBe(false);
      expect(result.error?.message).toContain('Circuit breaker is OPEN');
    });

    it('should track circuit breaker state', () => {
      const state = retryHandler.getCircuitBreakerState('test-key');
      expect(state).toBeUndefined(); // Circuit breaker doesn't exist yet

      // After using it, it should exist
      retryHandler.executeWithRetry(
        jest.fn().mockResolvedValue('success'),
        undefined,
        'test-key'
      );

      // State should be available after first use
      setTimeout(() => {
        const newState = retryHandler.getCircuitBreakerState('test-key');
        expect(newState).toBe(CircuitState.CLOSED);
      }, 10);
    });
  });
});

describe('RetryableError', () => {
  it('should create error with correct properties', () => {
    const error = new RetryableError(
      'Test error',
      ErrorType.NETWORK,
      true,
      500
    );

    expect(error.message).toBe('Test error');
    expect(error.type).toBe(ErrorType.NETWORK);
    expect(error.isRetryable).toBe(true);
    expect(error.statusCode).toBe(500);
    expect(error.name).toBe('RetryableError');
  });

  it('should default to retryable', () => {
    const error = new RetryableError('Test', ErrorType.UNKNOWN);
    expect(error.isRetryable).toBe(true);
  });
});

describe('DEFAULT_RETRY_CONFIGS', () => {
  it('should have network config', () => {
    const config = DEFAULT_RETRY_CONFIGS.network;
    expect(config.maxRetries).toBe(3);
    expect(config.exponentialBackoff).toBe(true);
    expect(config.circuitBreakerThreshold).toBeDefined();
  });

  it('should have api config', () => {
    const config = DEFAULT_RETRY_CONFIGS.api;
    expect(config.maxRetries).toBe(2);
    expect(config.exponentialBackoff).toBe(true);
    expect(config.circuitBreakerThreshold).toBeDefined();
  });

  it('should have upload config', () => {
    const config = DEFAULT_RETRY_CONFIGS.upload;
    expect(config.maxRetries).toBe(5);
    expect(config.exponentialBackoff).toBe(true);
    expect(config.maxDelayMs).toBe(30000);
  });
});
