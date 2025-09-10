/**
 * Structured logging system using Winston
 */

import winston from 'winston';

export enum LogLevel {
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  HTTP = 'http',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
  SILLY = 'silly'
}

export interface LogContext {
  platform?: string;
  contentId?: string;
  userId?: string;
  operation?: string;
  duration?: number;
  statusCode?: number;
  error?: Error;
  metadata?: Record<string, any>;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableFile: boolean;
  filename?: string;
  maxFiles?: number;
  maxSize?: string;
  format?: 'json' | 'simple';
  enableColors?: boolean;
}

class SDKLogger {
  private logger: winston.Logger;
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableFile: false,
      filename: 'sdk.log',
      maxFiles: 5,
      maxSize: '10m',
      format: 'json',
      enableColors: true,
      ...config
    };

    this.logger = this.createLogger();
  }

  private createLogger(): winston.Logger {
    const transports: winston.transport[] = [];

    // Console transport
    if (this.config.enableConsole) {
      transports.push(
        new winston.transports.Console({
          level: this.config.level,
          format: this.config.format === 'json' 
            ? winston.format.combine(
                winston.format.timestamp(),
                winston.format.errors({ stack: true }),
                winston.format.json()
              )
            : winston.format.combine(
                winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
                winston.format.errors({ stack: true }),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                  const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                  return `${timestamp} [${level.toUpperCase()}]: ${message} ${metaStr}`;
                }),
                ...(this.config.enableColors ? [winston.format.colorize({ all: true })] : [])
              )
        })
      );
    }

    // File transport
    if (this.config.enableFile) {
      transports.push(
        new winston.transports.File({
          filename: this.config.filename,
          level: this.config.level,
          maxFiles: this.config.maxFiles,
          maxsize: this.parseSize(this.config.maxSize || '10m'),
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.errors({ stack: true }),
            winston.format.json()
          )
        })
      );
    }

    return winston.createLogger({
      level: this.config.level,
      transports,
      exitOnError: false,
      // Handle uncaught exceptions and rejections
      exceptionHandlers: this.config.enableFile ? [
        new winston.transports.File({ filename: 'exceptions.log' })
      ] : [],
      rejectionHandlers: this.config.enableFile ? [
        new winston.transports.File({ filename: 'rejections.log' })
      ] : []
    });
  }

  private parseSize(size: string): number {
    const units: Record<string, number> = {
      'b': 1,
      'k': 1024,
      'm': 1024 * 1024,
      'g': 1024 * 1024 * 1024
    };

    const match = size.toLowerCase().match(/^(\d+)([bkmg]?)$/);
    if (!match) return 10 * 1024 * 1024; // Default 10MB

    const [, num, unit] = match;
    return parseInt(num) * (units[unit] || 1);
  }

  private formatMessage(message: string, context?: LogContext): [string, object] {
    const meta: any = {};

    if (context) {
      if (context.platform) meta.platform = context.platform;
      if (context.contentId) meta.contentId = context.contentId;
      if (context.userId) meta.userId = context.userId;
      if (context.operation) meta.operation = context.operation;
      if (context.duration !== undefined) meta.duration = context.duration;
      if (context.statusCode !== undefined) meta.statusCode = context.statusCode;
      if (context.error) {
        meta.error = {
          name: context.error.name,
          message: context.error.message,
          stack: context.error.stack
        };
      }
      if (context.metadata) meta.metadata = context.metadata;
    }

    return [message, meta];
  }

  error(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.error(msg, meta);
  }

  warn(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.warn(msg, meta);
  }

  info(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.info(msg, meta);
  }

  http(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.http(msg, meta);
  }

  verbose(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.verbose(msg, meta);
  }

  debug(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.debug(msg, meta);
  }

  silly(message: string, context?: LogContext): void {
    const [msg, meta] = this.formatMessage(message, context);
    this.logger.silly(msg, meta);
  }

  // Convenience methods for common operations
  logApiCall(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Partial<LogContext>
  ): void {
    const level = statusCode >= 400 ? LogLevel.ERROR : LogLevel.HTTP;
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    
    this[level](message, {
      ...context,
      operation: 'api_call',
      statusCode,
      duration,
      metadata: {
        method,
        url,
        ...context?.metadata
      }
    });
  }

  logPublishAttempt(
    platform: string,
    contentId: string,
    success: boolean,
    duration: number,
    error?: Error
  ): void {
    const level = success ? LogLevel.INFO : LogLevel.ERROR;
    const message = `Content publish ${success ? 'succeeded' : 'failed'} for ${platform}`;
    
    this[level](message, {
      platform,
      contentId,
      operation: 'publish_content',
      duration,
      error,
      metadata: {
        success
      }
    });
  }

  logRetryAttempt(
    operation: string,
    attempt: number,
    maxRetries: number,
    error: Error,
    context?: Partial<LogContext>
  ): void {
    const message = `Retry attempt ${attempt}/${maxRetries} for ${operation}`;
    
    this.warn(message, {
      ...context,
      operation: 'retry_attempt',
      error,
      metadata: {
        attempt,
        maxRetries,
        ...context?.metadata
      }
    });
  }

  logCircuitBreakerStateChange(
    key: string,
    oldState: string,
    newState: string,
    failureCount: number
  ): void {
    const message = `Circuit breaker ${key} state changed from ${oldState} to ${newState}`;
    
    this.warn(message, {
      operation: 'circuit_breaker_state_change',
      metadata: {
        circuitBreakerKey: key,
        oldState,
        newState,
        failureCount
      }
    });
  }

  // Performance monitoring
  startTimer(label: string): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.debug(`Timer ${label} completed`, {
        operation: 'performance_timer',
        duration,
        metadata: { label }
      });
      return duration;
    };
  }

  // Update logger configuration
  updateConfig(newConfig: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.logger = this.createLogger();
  }

  // Get current configuration
  getConfig(): LoggerConfig {
    return { ...this.config };
  }

  // Flush logs (useful for testing)
  async flush(): Promise<void> {
    return new Promise((resolve) => {
      this.logger.on('finish', resolve);
      this.logger.end();
    });
  }
}

// Create default logger instance
export const logger = new SDKLogger({
  level: process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.INFO,
  enableConsole: true,
  enableFile: process.env.NODE_ENV === 'production',
  format: process.env.NODE_ENV === 'development' ? 'simple' : 'json'
});

// Export logger class for custom instances
export { SDKLogger };

// Export factory function
export function createLogger(config: Partial<LoggerConfig>): SDKLogger {
  return new SDKLogger(config);
}
