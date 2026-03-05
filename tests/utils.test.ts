describe('Utils Module', () => {
  test('should generate random ID', () => {
    const { generateId } = require('../dist/utils');
    
    const id = generateId();
    expect(id).toBeDefined();
    expect(typeof id).toBe('string');
    expect(id.length).toBeGreaterThan(0);
  });

  test('should generate ID with custom length', () => {
    const { generateId } = require('../dist/utils');
    
    const id = generateId(32);
    expect(id.length).toBe(64);
  });

  test('should hash string', () => {
    const { hashString } = require('../dist/utils');
    
    const hash = hashString('test');
    expect(hash).toBeDefined();
    expect(typeof hash).toBe('string');
  });

  test('should generate token', () => {
    const { generateToken } = require('../dist/utils');
    
    const token = generateToken();
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  test('should generate API key with prefix', () => {
    const { generateApiKey } = require('../dist/utils');
    
    const key = generateApiKey('sk');
    expect(key).toMatch(/^sk_/);
  });

  test('should sleep', async () => {
    const { sleep } = require('../dist/utils');
    
    const start = Date.now();
    await sleep(50);
    const elapsed = Date.now() - start;
    
    expect(elapsed).toBeGreaterThanOrEqual(45);
  });

  test('should retry on failure', async () => {
    const { retry } = require('../dist/utils');
    
    let attempts = 0;
    const fn = async () => {
      attempts++;
      if (attempts < 3) throw new Error('Failed');
      return 'success';
    };
    
    const result = await retry(fn, { maxAttempts: 3, delayMs: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should parse query int', () => {
    const { parseQueryInt } = require('../dist/utils');
    
    expect(parseQueryInt('10', 5)).toBe(10);
    expect(parseQueryInt('abc', 5)).toBe(5);
    expect(parseQueryInt(undefined, 5)).toBe(5);
  });

  test('should parse query bool', () => {
    const { parseQueryBool } = require('../dist/utils');
    
    expect(parseQueryBool('true', false)).toBe(true);
    expect(parseQueryBool('false', true)).toBe(false);
  });
});
