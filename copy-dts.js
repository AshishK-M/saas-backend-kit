const fs = require('fs');
const path = require('path');

const typeDefs = {
  'auth/index.d.ts': `import { RequestHandler } from 'express';

export type Role = string;
export type Permission = string;

export interface User {
  id: string;
  email: string;
  password?: string;
  role: Role;
  name?: string;
  picture?: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthOptions {
  jwtSecret?: string;
  jwtExpiresIn?: string;
  refreshSecret?: string;
  refreshExpiresIn?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData extends LoginCredentials {
  name?: string;
  role?: Role;
}

export declare class AuthService {
  initialize(): Promise<void>;
  register(data: RegisterData): Promise<{ user: User; tokens: TokenPair }>;
  login(credentials: LoginCredentials): Promise<{ user: User; tokens: TokenPair }>;
  refresh(refreshToken: string): Promise<TokenPair>;
  getGoogleAuthUrl(state?: string): Promise<string>;
  handleGoogleCallback(code: string): Promise<{ user: User; tokens: TokenPair }>;
  getMiddleware(): RequestHandler;
  requireUser(): RequestHandler;
  requireRole(role: string): RequestHandler;
  requirePermission(permission: string): RequestHandler;
}

export declare function createAuth(options?: AuthOptions): AuthService;
export declare function auth(): AuthService;
export declare const Auth: { initialize: (options?: AuthOptions) => any };
`,
  'queue/index.d.ts': `export interface QueueOptions {
  name: string;
  defaultJobOptions?: any;
}

export interface JobData {
  [key: string]: unknown;
}

export type JobProcessor = (job: any) => Promise<unknown>;

export interface Queue {
  add(name: string, data: JobData, opts?: any): Promise<any>;
  addBulk(jobs: any[]): Promise<any[]>;
  getJobCounts(): Promise<any>;
  getJobs(statuses: string[], start?: number, end?: number): Promise<any[]>;
  close(): Promise<void>;
}

export declare const createQueue: (name: string, options?: Partial<QueueOptions>) => Queue;
export declare const addJob: (queueName: string, jobName: string, data: JobData, options?: any) => Promise<any>;
export declare const processJob: (queueName: string, processor: JobProcessor, options?: any) => any;
export declare const queue: {
  create: typeof createQueue;
  add: typeof addJob;
  process: typeof processJob;
  get: (name: string) => Queue | undefined;
  getJobCounts: (name: string) => Promise<any>;
  getJobs: (name: string, start?: number, end?: number) => Promise<any[]>;
  close: (name: string) => Promise<void>;
  closeAll: () => Promise<void>;
  setRedisOptions: (options: any) => void;
};
`,
  'notifications/index.d.ts': `export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  from?: string;
}

export interface SMSOptions {
  to: string;
  message: string;
  from?: string;
}

export interface WebhookOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

export interface SlackOptions {
  text?: string;
  blocks?: any[];
}

export declare const notify: {
  email: (options: EmailOptions) => Promise<{ messageId: string }>;
  sms: (options: SMSOptions) => Promise<{ sid: string }>;
  webhook: (options: WebhookOptions) => Promise<{ status: number; body: unknown }>;
  slack: (options: SlackOptions) => Promise<{ ok: boolean }>;
};
`,
  'logger/index.d.ts': `export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface LoggerConfig {
  level?: LogLevel;
  name?: string;
}

export interface Logger {
  info(message: string, ...args: any[]): void;
  warn(message: string, ...args: any[]): void;
  error(message: string, ...args: any[]): void;
  debug(message: string, ...args: any[]): void;
  trace(message: string, ...args: any[]): void;
  fatal(message: string, ...args: any[]): void;
  child(bindings: any, options?: { name?: string }): Logger;
}

export declare const logger: Logger;
`,
  'rate-limit/index.d.ts': `import { Request, Response } from 'express';

export interface RateLimitOptions {
  window?: string;
  limit?: number;
  keyGenerator?: (req: Request) => string;
  handler?: (req: Request, res: Response) => void;
  skip?: (req: Request) => boolean;
}

export declare function rateLimit(options?: RateLimitOptions): (req: Request, res: Response, next: any) => void;
`,
  'config/index.d.ts': `export type LogLevel = 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace';

export interface EnvConfig {
  NODE_ENV: 'development' | 'production' | 'test';
  PORT: string;
  DATABASE_URL?: string;
  REDIS_URL: string;
  JWT_SECRET?: string;
  JWT_EXPIRES_IN?: string;
  [key: string]: any;
}

export declare const config: {
  load: () => EnvConfig;
  get: <K extends keyof EnvConfig>(key: K) => EnvConfig[K];
  int: (key: keyof EnvConfig) => number;
  bool: (key: keyof EnvConfig) => boolean;
  isProduction: () => boolean;
  isDevelopment: () => boolean;
  isTest: () => boolean;
  getAll: () => EnvConfig;
};
`,
  'response/index.d.ts': `import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  meta: { page: number; limit: number; total: number; totalPages: number };
}

export declare class ResponseHelper {
  static success<T>(res: Response, data?: T, message?: string, statusCode?: number): Response;
  static created<T>(res: Response, data?: T, message?: string): Response;
  static updated<T>(res: Response, data?: T, message?: string): Response;
  static deleted(res: Response, message?: string): Response;
  static error(res: Response, error: string, statusCode?: number): Response;
  static badRequest(res: Response, error?: string): Response;
  static unauthorized(res: Response, error?: string): Response;
  static forbidden(res: Response, error?: string): Response;
  static notFound(res: Response, error?: string): Response;
  static validationError(res: Response, error: string): Response;
  static internalError(res: Response, error?: string): Response;
  static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number): Response;
}

export declare const response: typeof ResponseHelper;
`,
  'upload/index.d.ts': `export interface S3Config {
  region?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  bucket: string;
  endpoint?: string;
  forcePathStyle?: boolean;
}

export interface UploadOptions {
  key?: string;
  contentType?: string;
  expiresIn?: number;
  metadata?: Record<string, string>;
}

export interface UploadResult {
  key: string;
  url: string;
  bucket: string;
  contentType?: string;
  size?: number;
}

export interface SignedUrlOptions {
  expiresIn?: number;
}

export interface FileObject {
  key: string;
  lastModified?: Date;
  size?: number;
  contentType?: string;
}

export declare const upload: {
  initialize: (config: S3Config) => void;
  file: (file: Buffer | Uint8Array | string, options?: UploadOptions) => Promise<UploadResult>;
  image: (file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions) => Promise<UploadResult>;
  video: (file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions) => Promise<UploadResult>;
  delete: (key: string) => Promise<void>;
  getSignedUrl: (key: string, options?: SignedUrlOptions) => Promise<string>;
  getPublicUrl: (key: string) => Promise<string>;
  listFiles: (prefix?: string, maxKeys?: number) => Promise<FileObject[]>;
};

export declare class S3Service {
  initialize(config: S3Config): void;
  isInitialized(): boolean;
  upload(file: Buffer | Uint8Array | string, options?: UploadOptions): Promise<UploadResult>;
  uploadImage(file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions): Promise<UploadResult>;
  uploadVideo(file: Buffer | Uint8Array | string, filename: string, options?: UploadOptions): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getSignedUrl(key: string, options?: SignedUrlOptions): Promise<string>;
  getPublicUrl(key: string): Promise<string>;
  listFiles(prefix?: string, maxKeys?: number): Promise<FileObject[]>;
}
`,
  'index.d.ts': `export * from './auth';
export * from './queue';
export * from './notifications';
export * from './logger';
export * from './rate-limit';
export * from './config';
export * from './response';
export * from './upload';

export interface AppOptions {
  framework?: 'express' | 'fastify';
  auth?: boolean | any;
  queue?: boolean | { redisUrl?: string };
  notifications?: boolean;
  rateLimit?: boolean | any;
  logger?: boolean | any;
  config?: boolean;
}

export interface Plugin {
  name: string;
  initialize: (app: any) => Promise<void> | void;
}

export declare function createApp(options?: AppOptions): any;
export declare function createExpressApp(options?: AppOptions): any;
`
};

for (const [filePath, content] of Object.entries(typeDefs)) {
  const fullPath = path.join('dist', filePath);
  const dir = path.dirname(fullPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(fullPath, content);
}

console.log('Type definitions written successfully');
