describe('Auth Module', () => {
  const mockUserStore = {
    users: new Map(),
    
    async findByEmail(email: string) {
      for (const user of this.users.values()) {
        if (user.email === email) return user;
      }
      return null;
    },
    
    async findById(id: string) {
      return this.users.get(id) || null;
    },
    
    async create(data: any) {
      const id = Math.random().toString(36).substr(2, 9);
      const user = { id, email: data.email, role: data.role || 'user', ...data };
      this.users.set(id, user);
      return user;
    },
    
    async update(id: string, data: any) {
      const user = this.users.get(id);
      if (!user) throw new Error('User not found');
      const updated = { ...user, ...data };
      this.users.set(id, updated);
      return updated;
    }
  };

  test('should create auth service', () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    expect(auth).toBeDefined();
    expect(auth.initialize).toBeDefined();
    expect(auth.register).toBeDefined();
    expect(auth.login).toBeDefined();
  });

  test('should register a new user', async () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    const result = await auth.register({
      email: 'test@example.com',
      password: 'password123',
      name: 'Test User'
    });
    
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe('test@example.com');
    expect(result.tokens).toHaveProperty('accessToken');
    expect(result.tokens).toHaveProperty('refreshToken');
  });

  test('should login with valid credentials', async () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    await auth.register({
      email: 'login@test.com',
      password: 'password123'
    });
    
    const result = await auth.login({
      email: 'login@test.com',
      password: 'password123'
    });
    
    expect(result.user).toBeDefined();
    expect(result.tokens).toHaveProperty('accessToken');
  });

  test('should fail login with invalid credentials', async () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    await auth.register({
      email: 'fail@test.com',
      password: 'password123'
    });
    
    await expect(auth.login({
      email: 'fail@test.com',
      password: 'wrongpassword'
    })).rejects.toThrow('Invalid credentials');
  });

  test('should throw error for duplicate registration', async () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    await auth.register({
      email: 'duplicate@test.com',
      password: 'password123'
    });
    
    await expect(auth.register({
      email: 'duplicate@test.com',
      password: 'password123'
    })).rejects.toThrow('User already exists');
  });

  test('should generate middleware', () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    const middleware = auth.getMiddleware();
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  test('should create requireUser middleware', () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    const middleware = auth.requireUser();
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });

  test('should create requireRole middleware', () => {
    const { createAuth } = require('../dist/auth');
    const auth = createAuth({ jwtSecret: 'test-secret-key-that-is-at-least-32-chars' }, mockUserStore);
    
    const middleware = auth.requireRole('admin');
    expect(middleware).toBeDefined();
    expect(typeof middleware).toBe('function');
  });
});
