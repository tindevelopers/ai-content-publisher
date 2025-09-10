/**
 * Advanced retry handler with exponential backoff and circuit breaker pattern
 */

export interface RetryConfig {
  maxRetries: number;
  baseDelayMs: number;
  maxDelayMs: number;
  exponentialBackoff: boolean;
  jitterMs?: number;
  retryableErrors?: string[];
  circuitBreakerThreshold?: number;
  circuitBreakerResetTimeMs?: number;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
  totalTime: number;
}

export enum CircuitState {
  CLOSED = 'closed',
  OPEN = 'open',
  HALF_OPEN = 'half_open'
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount: number = 0;
  private lastFailureTime: number = 0;
  private successCount: number = 0;

  constructor(
    private threshold: number = 5,
    private resetTimeMs: number = 60000
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (Date.now() - this.lastFailureTime < this.resetTimeMs) {
        throw new Error('Circuit breaker is OPEN - operation not allowed');
      }
      this.state = CircuitState.HALF_OPEN;
      this.successCount = 0;
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failureCount = 0;
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= 3) { // Require 3 successes to close
        this.state = CircuitState.CLOSED;
      }
    }
  }

  private onFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    
    if (this.failureCount >= this.threshold) {
      this.state = CircuitState.OPEN;
    }
  }

  getState(): CircuitState {
    return this.state;
  }

  getFailureCount(): number {
    return this.failureCount;
  }

  reset(): void {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = 0;
  }
}

export enum ErrorType {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  RATE_LIMIT = 'rate_limit',
  VALIDATION = 'validation',
  SERVER = 'server',
  CLIENT = 'client',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

export class RetryableError extends Error {
  constructor(
    message: string,
    public type: ErrorType,
    public isRetryable: boolean = true,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'RetryableError';
  }
}

export class RetryHandler {
  private circuitBreakers: Map<string, CircuitBreaker> = new Map();

  constructor(private defaultConfig: RetryConfig) {}

  async executeWithRetry<T>(
    operation: () => Promise<T>,
    config?: Partial<RetryConfig>,
    circuitBreakerKey?: string
  ): Promise<RetryResult<T>> {
    const finalConfig: RetryConfig = { ...this.defaultConfig, ...config };
    const startTime = Date.now();
    let lastError: Error | undefined;
    let attempts = 0;

    // Get or create circuit breaker
    let circuitBreaker: CircuitBreaker | undefined;
    if (circuitBreakerKey) {
      if (!this.circuitBreakers.has(circuitBreakerKey)) {
        this.circuitBreakers.set(
          circuitBreakerKey,
          new CircuitBreaker(
            finalConfig.circuitBreakerThreshold,
            finalConfig.circuitBreakerResetTimeMs
          )
        );
      }
      circuitBreaker = this.circuitBreakers.get(circuitBreakerKey);
    }

    for (attempts = 1; attempts <= finalConfig.maxRetries + 1; attempts++) {
      try {
        const result = circuitBreaker 
          ? await circuitBreaker.execute(operation)
          : await operation();

        return {
          success: true,
          data: result,
          attempts,
          totalTime: Date.now() - startTime
        };
      } catch (error: any) {
        lastError = error;
        
        // Check if error is retryable
        if (!this.isRetryableError(error, finalConfig)) {
          break;
        }

        // Don't retry on last attempt
        if (attempts > finalConfig.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff and jitter
        const delay = this.calculateDelay(attempts, finalConfig);
        await this.sleep(delay);
      }
    }

    return {
      success: false,
      error: lastError,
      attempts,
      totalTime: Date.now() - startTime
    };
  }

  private isRetryableError(error: any, config: RetryConfig): boolean {
    // Check if it's a RetryableError
    if (error instanceof RetryableError) {
      return error.isRetryable;
    }

    // Check for specific error types
    const errorMessage = error.message?.toLowerCase() || '';
    const statusCode = error.response?.status || error.statusCode;

    // Network errors are usually retryable
    if (errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('connection') ||
        errorMessage.includes('econnreset') ||
        errorMessage.includes('enotfound')) {
      return true;
    }

    // HTTP status codes that are retryable
    if (statusCode) {
      const retryableStatusCodes = [408, 429, 500, 502, 503, 504];
      if (retryableStatusCodes.includes(statusCode)) {
        return true;
      }
    }

    // Check custom retryable errors
    if (config.retryableErrors) {
      return config.retryableErrors.some(retryableError => 
        errorMessage.includes(retryableError.toLowerCase())
      );
    }

    return false;
  }

  private calculateDelay(attempt: number, config: RetryConfig): number {
    let delay = config.baseDelayMs;

    if (config.exponentialBackoff) {
      delay = Math.min(
        config.baseDelayMs * Math.pow(2, attempt - 1),
        config.maxDelayMs
      );
    }

    // Add jitter to prevent thundering herd
    if (config.jitterMs) {
      const jitter = Math.random() * config.jitterMs;
      delay += jitter;
    }

    return Math.min(delay, config.maxDelayMs);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getCircuitBreakerState(key: string): CircuitState | undefined {
    return this.circuitBreakers.get(key)?.getState();
  }

  resetCircuitBreaker(key: string): void {
    this.circuitBreakers.get(key)?.reset();
  }

  static categorizeError(error: any): ErrorType {
    const message = error.message?.toLowerCase() || '';
    const statusCode = error.response?.status || error.statusCode;

    if (statusCode === 401 || statusCode === 403) {
      return ErrorType.AUTHENTICATION;
    }

    if (statusCode === 429) {
      return ErrorType.RATE_LIMIT;
    }

    if (statusCode >= 400 && statusCode < 500) {
      return ErrorType.CLIENT;
    }

    if (statusCode >= 500) {
      return ErrorType.SERVER;
    }

    if (message.includes('timeout')) {
      return ErrorType.TIMEOUT;
    }

    if (message.includes('network') || 
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('enotfound')) {
      return ErrorType.NETWORK;
    }

    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION;
    }

    return ErrorType.UNKNOWN;
  }
}

// Default retry configurations for different scenarios
export const DEFAULT_RETRY_CONFIGS = {
  network: {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
    exponentialBackoff: true,
    jitterMs: 500,
    circuitBreakerThreshold: 5,
    circuitBreakerResetTimeMs: 60000
  },
  api: {
    maxRetries: 2,
    baseDelayMs: 2000,
    maxDelayMs: 8000,
    exponentialBackoff: true,
    jitterMs: 1000,
    circuitBreakerThreshold: 3,
    circuitBreakerResetTimeMs: 30000
  },
  upload: {
    maxRetries: 5,
    baseDelayMs: 2000,
    maxDelayMs: 30000,
    exponentialBackoff: true,
    jitterMs: 2000,
    circuitBreakerThreshold: 10,
    circuitBreakerResetTimeMs: 120000
  }
} as const;
