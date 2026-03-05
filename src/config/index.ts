import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000'),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRES_IN: z.string().default('7d'),
  JWT_REFRESH_SECRET: z.string().min(32).optional(),
  JWT_REFRESH_EXPIRES_IN: z.string().default('30d'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().default('587'),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  TWILIO_ACCOUNT_SID: z.string().optional(),
  TWILIO_AUTH_TOKEN: z.string().optional(),
  TWILIO_PHONE_NUMBER: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),
  RATE_LIMIT_WINDOW: z.string().default('1m'),
  RATE_LIMIT_LIMIT: z.string().default('100'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export interface ConfigOptions {
  schema?: z.ZodSchema;
  envPath?: string;
  validate?: boolean;
}

class ConfigManager {
  private config: EnvConfig | null = null;
  private schema: z.ZodSchema;
  private validate: boolean;

  constructor(options: ConfigOptions = {}) {
    this.schema = options.schema || envSchema;
    this.validate = options.validate ?? true;
  }

  load(): EnvConfig {
    if (this.config) return this.config;

    const env: Record<string, string | undefined> = {};
    
    for (const key of Object.keys(this.schema.shape)) {
      env[key] = process.env[key];
    }

    if (this.validate) {
      const result = this.schema.safeParse(env);
      if (!result.success) {
        const errors = result.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        throw new Error(`Config validation failed: ${errors}`);
      }
      this.config = result.data;
    } else {
      this.config = env as EnvConfig;
    }

    return this.config;
  }

  get<K extends keyof EnvConfig>(key: K): EnvConfig[K] {
    if (!this.config) this.load();
    return this.config![key];
  }

  int(key: keyof EnvConfig): number {
    const value = this.get(key);
    if (typeof value === 'string') return parseInt(value, 10);
    return Number(value);
  }

  bool(key: keyof EnvConfig): boolean {
    const value = this.get(key);
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') return value.toLowerCase() === 'true';
    return Boolean(value);
  }

  isProduction(): boolean {
    return this.get('NODE_ENV') === 'production';
  }

  isDevelopment(): boolean {
    return this.get('NODE_ENV') === 'development';
  }

  isTest(): boolean {
    return this.get('NODE_ENV') === 'test';
  }

  getAll(): EnvConfig {
    if (!this.config) this.load();
    return this.config!;
  }
}

const globalConfig = new ConfigManager();

export const config = {
  load: () => globalConfig.load(),
  get: <K extends keyof EnvConfig>(key: K) => globalConfig.get(key),
  int: (key: keyof EnvConfig) => globalConfig.int(key),
  bool: (key: keyof EnvConfig) => globalConfig.bool(key),
  isProduction: () => globalConfig.isProduction(),
  isDevelopment: () => globalConfig.isDevelopment(),
  isTest: () => globalConfig.isTest(),
  getAll: () => globalConfig.getAll(),
  create: (options?: ConfigOptions) => new ConfigManager(options),
};

export default config;
