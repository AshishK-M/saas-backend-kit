describe('JWT Module', () => {
  test('should create JWT service', () => {
    const { JWTService } = require('../dist/auth/jwt');
    const jwt = new JWTService({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' });
    
    expect(jwt).toBeDefined();
    expect(jwt.generateToken).toBeDefined();
    expect(jwt.verifyToken).toBeDefined();
  });

  test('should generate and verify token', () => {
    const { JWTService } = require('../dist/auth/jwt');
    const jwt = new JWTService({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' });
    
    const payload = { userId: '123', email: 'test@example.com', role: 'user' };
    const token = jwt.generateToken(payload);
    
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
    
    const verified = jwt.verifyToken(token);
    expect(verified.userId).toBe('123');
    expect(verified.email).toBe('test@example.com');
  });

  test('should generate token pair', () => {
    const { JWTService } = require('../dist/auth/jwt');
    const jwt = new JWTService({ 
      jwtSecret: 'test-secret-key-that-is-at-least-32-chars',
      refreshSecret: 'test-refresh-secret-that-is-at-least-32-char'
    });
    
    const payload = { userId: '123', email: 'test@example.com', role: 'user' };
    const tokens = jwt.generateTokenPair(payload);
    
    expect(tokens).toHaveProperty('accessToken');
    expect(tokens).toHaveProperty('refreshToken');
    expect(tokens.accessToken).not.toBe(tokens.refreshToken);
  });

  test('should refresh tokens', () => {
    const { JWTService } = require('../dist/auth/jwt');
    const jwt = new JWTService({ 
      jwtSecret: 'test-secret-key-that-is-at-least-32-chars',
      refreshSecret: 'test-refresh-secret-that-is-at-least-32-char'
    });
    
    const payload = { userId: '123', email: 'test@example.com', role: 'user' };
    const tokens = jwt.generateTokenPair(payload);
    
    const newTokens = jwt.refreshTokens(tokens.refreshToken);
    
    expect(newTokens).toHaveProperty('accessToken');
    expect(newTokens).toHaveProperty('refreshToken');
  });

  test('should verify refresh token separately', () => {
    const { JWTService } = require('../dist/auth/jwt');
    const jwt = new JWTService({ 
      jwtSecret: 'test-secret-key-that-is-at-least-32-chars',
      refreshSecret: 'test-refresh-secret-that-is-at-least-32-char'
    });
    
    const payload = { userId: '123', email: 'test@example.com', role: 'user' };
    const { refreshToken } = jwt.generateTokenPair(payload);
    
    const verified = jwt.verifyRefreshToken(refreshToken);
    expect(verified.userId).toBe('123');
  });
});
