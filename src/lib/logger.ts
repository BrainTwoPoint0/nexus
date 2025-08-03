/**
 * Production-ready logging utility
 * Replaces console.log statements with proper logging levels
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

class Logger {
  private level: LogLevel;
  private isDevelopment: boolean;

  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.level = this.isDevelopment ? LogLevel.DEBUG : LogLevel.WARN;
  }

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): string {
    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const contextStr = context ? `[${context}]` : '';
    const dataStr = data ? ` ${JSON.stringify(data)}` : '';

    return `${timestamp} ${levelName}${contextStr}: ${message}${dataStr}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  error(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog(LogLevel.ERROR)) {
      console.error(this.formatMessage(LogLevel.ERROR, message, data, context));

      // In production, you might want to send errors to an external service
      if (!this.isDevelopment) {
        // TODO: Send to error tracking service (e.g., Sentry, LogRocket)
      }
    }
  }

  warn(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog(LogLevel.WARN)) {
      console.warn(this.formatMessage(LogLevel.WARN, message, data, context));
    }
  }

  info(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog(LogLevel.INFO)) {
      console.info(this.formatMessage(LogLevel.INFO, message, data, context));
    }
  }

  debug(message: string, data?: unknown, context?: string): void {
    if (this.shouldLog(LogLevel.DEBUG) && this.isDevelopment) {
      console.log(this.formatMessage(LogLevel.DEBUG, message, data, context));
    }
  }

  // Convenience methods for common use cases
  apiCall(method: string, url: string, status?: number): void {
    this.debug(`API ${method} ${url}`, { status }, 'API');
  }

  userAction(action: string, userId?: string): void {
    this.info(`User action: ${action}`, { userId }, 'USER');
  }

  dbOperation(
    operation: string,
    table: string,
    status: 'success' | 'error',
    error?: unknown
  ): void {
    if (status === 'error') {
      this.error(`Database ${operation} failed on ${table}`, error, 'DB');
    } else {
      this.debug(`Database ${operation} on ${table}`, {}, 'DB');
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Export convenience functions for backward compatibility
export const logError = (message: string, data?: unknown, context?: string) =>
  logger.error(message, data, context);
export const logWarn = (message: string, data?: unknown, context?: string) =>
  logger.warn(message, data, context);
export const logInfo = (message: string, data?: unknown, context?: string) =>
  logger.info(message, data, context);
export const logDebug = (message: string, data?: unknown, context?: string) =>
  logger.debug(message, data, context);
