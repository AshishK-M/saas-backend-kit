import { Request, Response, NextFunction, RequestHandler } from 'express';
import { config } from '../config';

export interface RateLimitOptions {
  window?: string;
  limit?: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skipSuccessfulRequests?: boolean;
  skipFailedRequests?: boolean;
  skip?: (req: Request) => boolean;
}

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class InMemoryRateLimiter {
  private store: Map<string, RateLimitRecord> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.store.entries()) {
      if (record.resetTime < now) {
        this.store.delete(key);
      }
    }
  }

  increment(key: string, windowMs: number): RateLimitRecord {
    const now = Date.now();
    const record = this.store.get(key);

    if (!record || record.resetTime < now) {
      const resetTime = now + windowMs;
      this.store.set(key, { count: 1, resetTime });
      return { count: 1, resetTime };
    }

    record.count++;
    return record;
  }

  get(key: string): RateLimitRecord | undefined {
    return this.store.get(key);
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
  }
}

class RateLimiter {
  private options: Required<RateLimitOptions>;
  private store: InMemoryRateLimiter;

  constructor(options: RateLimitOptions = {}) {
    const defaultWindow = config.get('RATE_LIMIT_WINDOW') || '1m';
    const defaultLimit = parseInt(config.get('RATE_LIMIT_LIMIT') || '100', 10);

    this.options = {
      window: options.window || defaultWindow,
      limit: options.limit || defaultLimit,
      keyGenerator: options.keyGenerator || ((req: Request) => req.ip || 'unknown'),
      handler: options.handler || this.defaultHandler,
      skipSuccessfulRequests: options.skipSuccessfulRequests || false,
      skipFailedRequests: options.skipFailedRequests || false,
      skip: options.skip || (() => false),
    };

    this.store = new InMemoryRateLimiter();
  }

  private getWindowMs(): number {
    const window = this.options.window;
    const match = window.match(/^(\d+)(s|m|h|d)$/);
    if (!match) return 60000;

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's': return value * 1000;
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default: return 60000;
    }
  }

  private defaultHandler(req: Request, res: Response): void {
    res.status(429).json({
      error: 'Too many requests',
      message: `Rate limit exceeded. Please try again later.`,
    });
  }

  middleware(): RequestHandler {
    const windowMs = this.getWindowMs();

    return (req: Request, res: Response, next: NextFunction) => {
      if (this.options.skip(req)) {
        return next();
      }

      const key = this.options.keyGenerator(req);
      const record = this.store.increment(key, windowMs);

      const remaining = Math.max(0, this.options.limit - record.count);
      const resetTime = new Date(record.resetTime);

      res.setHeader('X-RateLimit-Limit', this.options.limit);
      res.setHeader('X-RateLimit-Remaining', remaining);
      res.setHeader('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

      if (record.count > this.options.limit) {
        return this.options.handler(req, res);
      }

      next();
    };
  }

  destroy(): void {
    this.store.destroy();
  }
}

export function rateLimit(options: RateLimitOptions = {}): RequestHandler {
  const limiter = new RateLimiter(options);
  return limiter.middleware();
}

export function createRateLimiter(options: RateLimitOptions): RateLimiter {
  return new RateLimiter(options);
}

export default rateLimit;
