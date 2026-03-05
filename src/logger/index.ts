import pino, { Logger, LoggerOptions, Bindings } from 'pino';
import { config } from '../config';

export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig extends Partial<LoggerOptions> {
  level?: LogLevel;
  name?: string;
  prettyPrint?: boolean;
}

export interface RequestLoggerOptions {
  logLevel?: LogLevel;
  autoLogging?: boolean;
}

class LoggerManager {
  private loggers: Map<string, Logger> = new Map();
  private defaultLogger: Logger;

  constructor() {
    const level = (config.get('LOG_LEVEL') as LogLevel) || 'info';
    this.defaultLogger = pino({
      level,
      name: 'saas-backend-kit',
      formatters: {
        bindings: (bindings: Bindings) => ({
          ...bindings,
          service: 'saas-backend-kit',
        }),
      },
    });
  }

  createLogger(options: LoggerConfig = {}): Logger {
    const name = options.name || 'default';
    
    if (this.loggers.has(name)) {
      return this.loggers.get(name)!;
    }

    const level = options.level || (config.get('LOG_LEVEL') as LogLevel) || 'info';
    
    const logger = pino({
      level,
      name: options.name,
      ...options,
    });

    this.loggers.set(name, logger);
    return logger;
  }

  getLogger(name?: string): Logger {
    if (name) {
      return this.loggers.get(name) || this.defaultLogger;
    }
    return this.defaultLogger;
  }

  child(bindings: Bindings, options?: { name?: string }): Logger {
    const name = options?.name || 'child';
    const parent = options?.name ? this.getLogger(name) : this.defaultLogger;
    return parent.child(bindings);
  }
}

const loggerManager = new LoggerManager();

export const logger = {
  info: (message: string, ...args: unknown[]) => loggerManager.getLogger().info(message, ...args),
  warn: (message: string, ...args: unknown[]) => loggerManager.getLogger().warn(message, ...args),
  error: (message: string, ...args: unknown[]) => loggerManager.getLogger().error(message, ...args),
  debug: (message: string, ...args: unknown[]) => loggerManager.getLogger().debug(message, ...args),
  trace: (message: string, ...args: unknown[]) => loggerManager.getLogger().trace(message, ...args),
  fatal: (message: string, ...args: unknown[]) => loggerManager.getLogger().fatal(message, ...args),
  child: (bindings: Bindings, options?: { name?: string }) => loggerManager.child(bindings, options),
  create: (options?: LoggerConfig) => loggerManager.createLogger(options),
  get: (name?: string) => loggerManager.getLogger(name),
};

export function createRequestLogger(options: RequestLoggerOptions = {}) {
  const logLevel = options.logLevel || 'info';
  const logger = loggerManager.getLogger('http');

  return function requestLogger(
    req: { method: string; url: string; headers: Record<string, string | string[] | undefined> },
    res: { statusCode: number; statusMessage?: string },
    elapsed: number
  ) {
    const log = logger.child({
      method: req.method,
      url: req.url,
      status: res.statusCode,
      responseTime: elapsed,
      ip: req.headers['x-forwarded-for'] || req.headers['x-real-ip'] || 'unknown',
      userAgent: req.headers['user-agent'],
    });

    if (res.statusCode >= 500) {
      log.error(`Request completed`);
    } else if (res.statusCode >= 400) {
      log.warn(`Request completed`);
    } else {
      log.info(`Request completed`);
    }
  };
}

export default logger;
