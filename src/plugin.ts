import { Application, Request, Response, NextFunction, RequestHandler } from 'express';
import { FastifyInstance } from 'fastify';
import { createAuth, AuthService } from './auth';
import { createQueue, QueueManager } from './queue';
import { notify, notification } from './notifications';
import { logger } from './logger';
import { rateLimit } from './rate-limit';
import { config } from './config';
import { ResponseHelper } from './response';

export interface AppOptions {
  framework?: 'express' | 'fastify';
  auth?: boolean | {
    jwtSecret?: string;
    jwtExpiresIn?: string;
    refreshSecret?: string;
    refreshExpiresIn?: string;
    googleClientId?: string;
    googleClientSecret?: string;
    googleRedirectUri?: string;
  };
  queue?: boolean | {
    redisUrl?: string;
  };
  notifications?: boolean;
  rateLimit?: boolean | {
    window?: string;
    limit?: number;
  };
  logger?: boolean | {
    level?: string;
    prettyPrint?: boolean;
  };
  config?: boolean;
}

export interface Plugin {
  name: string;
  initialize: (app: Application | FastifyInstance) => Promise<void> | void;
  middleware?: RequestHandler[];
}

class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private app: Application | FastifyInstance | null = null;
  private authService: AuthService | null = null;
  private queueManager: QueueManager | null = null;

  register(plugin: Plugin): void {
    this.plugins.set(plugin.name, plugin);
    logger.info(`Plugin "${plugin.name}" registered`);
  }

  unregister(name: string): void {
    this.plugins.delete(name);
    logger.info(`Plugin "${name}" unregistered`);
  }

  get(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  getAll(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  has(name: string): boolean {
    return this.plugins.has(name);
  }

  async initializeAll(app: Application | FastifyInstance): Promise<void> {
    this.app = app;
    
    for (const plugin of this.plugins.values()) {
      logger.info(`Initializing plugin "${plugin.name}"`);
      await plugin.initialize(app);
      
      if (plugin.middleware && 'use' in app) {
        for (const mw of plugin.middleware) {
          (app as Application).use(mw);
        }
      }
    }
  }
}

export class SaaSAppBuilder {
  private options: AppOptions;
  private pluginManager: PluginManager;
  private initialized: boolean = false;

  constructor(options: AppOptions = {}) {
    this.options = options;
    this.pluginManager = new PluginManager();
  }

  use(plugin: Plugin): this {
    this.pluginManager.register(plugin);
    return this;
  }

  async initialize(app: Application | FastifyInstance): Promise<void> {
    if (this.initialized) {
      throw new Error('App already initialized');
    }

    config.load();

    if (this.options.logger !== false) {
      const loggerOptions = typeof this.options.logger === 'object' ? this.options.logger : {};
      logger.create(loggerOptions);
    }

    if (this.options.auth !== false) {
      const authOptions = typeof this.options.auth === 'object' ? this.options.auth : {};
      this.authService = createAuth(authOptions);
      await this.authService.initialize();
      
      this.pluginManager.register({
        name: 'auth',
        initialize: (app) => {
          if ('use' in app) {
            (app as Application).use(this.authService!.getMiddleware());
          }
        },
        middleware: [this.authService!.getMiddleware()],
      });
    }

    if (this.options.queue !== false) {
      const queueOptions = typeof this.options.queue === 'object' ? this.options.queue : {};
      if (queueOptions.redisUrl) {
        (await import('./queue')).queue.setRedisOptions({ url: queueOptions.redisUrl });
      }
      
      this.pluginManager.register({
        name: 'queue',
        initialize: () => {},
      });
    }

    if (this.options.rateLimit !== false) {
      const rateLimitOptions = typeof this.options.rateLimit === 'object' ? this.options.rateLimit : {};
      
      this.pluginManager.register({
        name: 'rate-limit',
        initialize: (app) => {
          if ('use' in app) {
            (app as Application).use(rateLimit(rateLimitOptions));
          }
        },
        middleware: [rateLimit(rateLimitOptions)],
      });
    }

    if (this.options.notifications !== false) {
      this.pluginManager.register({
        name: 'notifications',
        initialize: () => {},
      });
    }

    await this.pluginManager.initializeAll(app);
    this.initialized = true;
    logger.info('SaaS App initialized');
  }

  getAuth(): AuthService | null {
    return this.authService;
  }

  getPluginManager(): PluginManager {
    return this.pluginManager;
  }
}

export function createApp(options: AppOptions = {}): SaaSAppBuilder {
  return new SaaSAppBuilder(options);
}

export function createExpressApp(options: AppOptions = {}): Application {
  const express = require('express');
  const app = express();
  
  const builder = createApp({ ...options, framework: 'express' });
  builder.initialize(app);
  
  return app;
}

export { PluginManager, Plugin };
export default createApp;
