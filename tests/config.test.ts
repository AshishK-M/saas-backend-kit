describe('Config Module', () => {
  test('should load config with defaults', async () => {
    const { config } = require('../dist/config');
    const cfg = config.load();
    
    expect(cfg.NODE_ENV).toBe('test');
    expect(cfg.PORT).toBe('3000');
    expect(cfg.REDIS_URL).toBe('redis://localhost:6379');
  });

  test('should get config value', async () => {
    const { config } = require('../dist/config');
    config.load();
    
    const port = config.int('PORT');
    expect(port).toBe(3000);
  });

  test('should check environment', async () => {
    const { config } = require('../dist/config');
    config.load();
    
    expect(config.isTest()).toBe(true);
    expect(config.isProduction()).toBe(false);
    expect(config.isDevelopment()).toBe(false);
  });

  test('should get all config', async () => {
    const { config } = require('../dist/config');
    const cfg = config.getAll();
    
    expect(cfg).toHaveProperty('NODE_ENV');
    expect(cfg).toHaveProperty('PORT');
    expect(cfg).toHaveProperty('AWS_REGION');
  });
});
