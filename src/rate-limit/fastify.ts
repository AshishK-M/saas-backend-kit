import { FastifyInstance, FastifyRequest, FastifyReply, HookHandlerDoneFunction } from 'fastify';
import { RateLimitOptions, InMemoryRateLimiter } from './express';

export function registerRateLimitPlugin(fastify: FastifyInstance, options: RateLimitOptions = {}, done: HookHandlerDoneFunction) {
  const limiter = new (require('./express').createRateLimiter.constructor)(options);
  
  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    const key = options.keyGenerator 
      ? options.keyGenerator(request.raw as any)
      : request.ip || 'unknown';
    
    const windowMs = parseWindowMs(options.window || '1m');
    const record = (limiter as any).store.increment(key, windowMs);
    const limit = options.limit || 100;
    const remaining = Math.max(0, limit - record.count);

    reply.header('X-RateLimit-Limit', limit);
    reply.header('X-RateLimit-Remaining', remaining);
    reply.header('X-RateLimit-Reset', Math.ceil(record.resetTime / 1000));

    if (record.count > limit) {
      reply.status(429).send({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.',
      });
      return reply;
    }
  });

  done();
}

function parseWindowMs(window: string): number {
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
