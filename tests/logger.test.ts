describe('Logger Module', () => {
  test('should create logger', () => {
    const { logger } = require('../dist/logger');
    
    expect(logger).toBeDefined();
    expect(logger.info).toBeDefined();
    expect(logger.error).toBeDefined();
    expect(logger.warn).toBeDefined();
    expect(logger.debug).toBeDefined();
  });

  test('should log info message', () => {
    const { logger } = require('../dist/logger');
    
    expect(() => logger.info('test message')).not.toThrow();
  });

  test('should log error with metadata', () => {
    const { logger } = require('../dist/logger');
    
    expect(() => logger.error('error occurred', { code: 500 })).not.toThrow();
  });

  test('should create child logger', () => {
    const { logger } = require('../dist/logger');
    
    const child = logger.child({ module: 'auth' });
    expect(child).toBeDefined();
    expect(child.info).toBeDefined();
  });

  test('should create named logger', () => {
    const { logger } = require('../dist/logger');
    
    const named = logger.create({ name: 'test-logger' });
    expect(named).toBeDefined();
    expect(named.info).toBeDefined();
  });

  test('should get logger by name', () => {
    const { logger } = require('../dist/logger');
    
    logger.create({ name: 'custom-logger' });
    const custom = logger.get('custom-logger');
    expect(custom).toBeDefined();
  });
});
