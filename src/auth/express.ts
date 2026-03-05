import bcrypt from 'bcryptjs';
import { Request, Response, NextFunction, RequestHandler } from 'express';
import { JWTPayload, LoginCredentials, RegisterData, User, AuthOptions } from './types';
import { jwtService } from './jwt';
import { rbacService } from './rbac';
import { oauthService } from './oauth';

export interface AuthUser extends JWTPayload {
  id: string;
  email: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface UserStore {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  create(data: RegisterData): Promise<User>;
  update(id: string, data: Partial<User>): Promise<User>;
}

class InMemoryUserStore implements UserStore {
  private users: Map<string, User> = new Map();

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) return user;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async create(data: RegisterData): Promise<User> {
    const id = Math.random().toString(36).substr(2, 9);
    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user: User = {
      id,
      email: data.email,
      password: hashedPassword,
      role: data.role || 'user',
      name: data.name,
    };
    this.users.set(id, user);
    return user;
  }

  async update(id: string, data: Partial<User>): Promise<User> {
    const user = this.users.get(id);
    if (!user) throw new Error('User not found');
    const updated = { ...user, ...data };
    this.users.set(id, updated);
    return updated;
  }
}

export class AuthService {
  private userStore: UserStore;
  private options: Required<AuthOptions>;
  private initialized: boolean = false;

  constructor(options: AuthOptions = {}, userStore?: UserStore) {
    this.options = {
      jwtSecret: options.jwtSecret || process.env.JWT_SECRET || 'default-secret-change-in-production',
      jwtExpiresIn: options.jwtExpiresIn || '7d',
      refreshSecret: options.refreshSecret || process.env.JWT_REFRESH_SECRET || 'default-secret-change-in-production',
      refreshExpiresIn: options.refreshExpiresIn || '30d',
      googleClientId: options.googleClientId || process.env.GOOGLE_CLIENT_ID || '',
      googleClientSecret: options.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || '',
      googleRedirectUri: options.googleRedirectUri || process.env.GOOGLE_REDIRECT_URI || '',
    };

    this.userStore = userStore || new InMemoryUserStore();
  }

  async initialize(): Promise<void> {
    if (this.options.googleClientId && this.options.googleClientSecret && this.options.googleRedirectUri) {
      oauthService.registerProvider('google', {
        name: 'google',
        clientId: this.options.googleClientId,
        clientSecret: this.options.googleClientSecret,
        redirectUri: this.options.googleRedirectUri,
        authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
        tokenUrl: 'https://oauth2.googleapis.com/token',
        userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      });
    }
    this.initialized = true;
  }

  async register(data: RegisterData): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const existing = await this.userStore.findByEmail(data.email);
    if (existing) {
      throw new Error('User already exists');
    }

    const user = await this.userStore.create(data);
    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async login(credentials: LoginCredentials): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const user = await this.userStore.findByEmail(credentials.email);
    if (!user || !user.password) {
      throw new Error('Invalid credentials');
    }

    const isValid = await bcrypt.compare(credentials.password, user.password);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    return jwtService.refreshTokens(refreshToken);
  }

  async getGoogleAuthUrl(state?: string): Promise<string> {
    return oauthService.getAuthorizationUrl('google', state);
  }

  async handleGoogleCallback(code: string): Promise<{ user: User; tokens: { accessToken: string; refreshToken: string } }> {
    const { accessToken } = await oauthService.exchangeCode('google', code);
    const userInfo = await oauthService.getUserInfo('google', accessToken);

    let user = await this.userStore.findByEmail(userInfo.email);
    
    if (!user) {
      user = await this.userStore.create({
        email: userInfo.email,
        password: Math.random().toString(36).substr(2, 20),
        name: userInfo.name,
        role: 'user',
      });
    }

    const tokens = jwtService.generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return { user, tokens };
  }

  getMiddleware(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'No token provided' });
      }

      const token = authHeader.substring(7);
      
      try {
        const payload = jwtService.verifyToken(token);
        req.user = {
          ...payload,
          id: payload.userId,
        };
        next();
      } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
      }
    };
  }

  requireUser(): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      next();
    };
  }

  requireRole(role: string): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!rbacService.hasRole(req.user.role, role)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }

  requirePermission(permission: string): RequestHandler {
    return (req: Request, res: Response, next: NextFunction) => {
      if (!req.user) {
        return res.status(401).json({ error: 'Authentication required' });
      }
      if (!rbacService.hasPermission(req.user.role, permission)) {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }
      next();
    };
  }
}

let authServiceInstance: AuthService | null = null;

export function createAuth(options?: AuthOptions, userStore?: UserStore): AuthService {
  authServiceInstance = new AuthService(options, userStore);
  return authServiceInstance;
}

export function auth(): AuthService {
  if (!authServiceInstance) {
    authServiceInstance = new AuthService();
  }
  return authServiceInstance;
}

export const Auth = {
  initialize: (options?: AuthOptions) => {
    const service = createAuth(options);
    return {
      service,
      getMiddleware: () => service.getMiddleware(),
      requireUser: () => service.requireUser(),
      requireRole: (role: string) => service.requireRole(role),
      requirePermission: (permission: string) => service.requirePermission(permission),
    };
  },
};
