describe('Rate Limit Module', () => {
  test('should create rate limiter middleware', () => {
    const { rateLimit } = require('../src/rate-limit');
    
    const middleware = rateLimit({ window: '1m', limit: 100 });
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  test('should create rate limiter with defaults', () => {
    const { rateLimit } = require('../src/rate-limit');
    
    const middleware = rateLimit();
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  test('should create custom rate limiter', () => {
    const { createRateLimiter } = require('../src/rate-limit');
    
    const limiter = createRateLimiter({ window: '1m', limit: 10 });
    expect(limiter).toBeDefined();
    expect(limiter.middleware).toBeDefined();
    expect(limiter.destroy).toBeDefined();
  });

  test('should use custom key generator', () => {
    const { rateLimit } = require('../src/rate-limit');
    
    const middleware = rateLimit({
      window: '1m',
      limit: 100,
      keyGenerator: (req: any) => req.userId || 'anonymous'
    });
    
    expect(middleware).toBeDefined();
  });

  test('should use custom skip function', () => {
    const { rateLimit } = require('../src/rate-limit');
    
    const middleware = rateLimit({
      window: '1m',
      limit: 100,
      skip: (req: any) => req.skipRateLimit === true
    });
    
    expect(middleware).toBeDefined();
  });
});
