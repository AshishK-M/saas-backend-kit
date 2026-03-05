# SaaS Backend Kit

<p align="center">
  <a href="https://www.npmjs.com/package/saas-backend-kit">
    <img src="https://img.shields.io/npm/v/saas-backend-kit.svg" alt="npm version">
  </a>
  <a href="https://www.npmjs.com/package/saas-backend-kit">
    <img src="https://img.shields.io/npm/dt/saas-backend-kit.svg" alt="npm downloads">
  </a>
  <a href="https://opensource.org/licenses/MIT">
    <img src="https://img.shields.io/npm/l/saas-backend-kit.svg" alt="MIT License">
  </a>
  <a href="https://github.com/yourusername/saas-backend-kit/actions">
    <img src="https://github.com/yourusername/saas-backend-kit/workflows/CI/badge.svg" alt="CI">
  </a>
</p>

> Production-grade modular backend toolkit for building scalable SaaS applications with Node.js

## Features

- **Authentication Module** - JWT authentication, RBAC, Google OAuth
- **Task Queue System** - Redis-based job queue (BullMQ)
- **Notification Service** - Email, SMS (Twilio), Webhooks, Slack
- **Logger** - Structured JSON logging with Pino
- **Rate Limiting** - Configurable API rate limiting
- **Config Manager** - Environment variable validation with Zod
- **API Response Helpers** - Standardized response format
- **Plugin Architecture** - Modular enable/disable features

## Installation

```bash
npm install saas-backend-kit
```

## Quick Start

```typescript
import express from 'express';
import { auth, rateLimit, logger, config, queue, notify, response, createApp } from 'saas-backend-kit';

config.load();

const app = express();
app.use(express.json());

// Initialize auth
const authMiddleware = auth.initialize({
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: '7d',
});
app.use(authMiddleware);

// Apply rate limiting
app.use(rateLimit({ window: '1m', limit: 100 }));

// Protected route
app.get('/dashboard', auth.requireUser(), (req, res) => {
  res.success({ message: 'Welcome to your dashboard', user: req.user });
});

app.listen(3000, () => logger.info('Server running'));
```

## Modules

### Authentication

```typescript
import { auth } from 'saas-backend-kit';

const authMiddleware = auth.initialize({
  jwtSecret: 'your-secret-key',
  jwtExpiresIn: '7d',
  refreshExpiresIn: '30d',
});

app.use(authMiddleware);

// Registration
app.post('/auth/register', async (req, res) => {
  const { email, password, name } = req.body;
  const result = await auth().register({ email, password, name });
  res.success(result.tokens, 'Registration successful');
});

// Login
app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const result = await auth().login({ email, password });
  res.success(result.tokens, 'Login successful');
});

// Route protection
app.get('/dashboard', auth.requireUser(), (req, res) => {
  res.success({ user: req.user });
});

app.get('/admin', auth.requireRole('admin'), (req, res) => {
  res.success({ message: 'Admin area' });
});

app.get('/protected', auth.requirePermission('read'), (req, res) => {
  res.success({ message: 'Access granted' });
});
```

### Role-Based Access Control (RBAC)

```typescript
import { rbacService } from 'saas-backend-kit/auth';

rbacService.setPermissions({
  admin: ['*'],
  manager: ['read', 'write', 'delete:own'],
  user: ['read', 'write:own'],
  guest: ['read:public'],
});

// Check permissions
if (rbacService.hasPermission(user.role, 'write:own')) {
  // Allow action
}
```

### Google OAuth

```typescript
// Get Google auth URL
app.get('/auth/google', async (req, res) => {
  const url = await auth().getGoogleAuthUrl();
  res.redirect(url);
});

// Handle callback
app.get('/auth/google/callback', async (req, res) => {
  const { code } = req.query;
  const result = await auth().handleGoogleCallback(code as string);
  res.success(result.tokens);
});
```

### Task Queue

```typescript
import { queue } from 'saas-backend-kit';

// Create a queue
const emailQueue = queue.create('email', {
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
  },
});

// Add jobs
await emailQueue.add('sendWelcomeEmail', { userId: '123', email: 'user@example.com' });

// Delayed job
await emailQueue.add('sendReminder', { userId: '123' }, { delay: 3600000 });

// Process jobs
queue.process('email', async (job) => {
  logger.info(`Processing ${job.name}`, { jobId: job.id });
  await notify.email({
    to: job.data.email,
    subject: 'Welcome!',
    template: 'welcome',
    templateData: { name: 'User' },
  });
  return { sent: true };
}, { concurrency: 5 });
```

### Notifications

```typescript
import { notify } from 'saas-backend-kit';

// Email
await notify.email({
  to: 'user@example.com',
  subject: 'Welcome',
  template: 'welcome',
  templateData: { name: 'John', appName: 'MyApp' },
});

// SMS
await notify.sms({
  to: '+1234567890',
  message: 'Your verification code is 123456',
});

// Webhook
await notify.webhook({
  url: 'https://api.example.com/webhook',
  method: 'POST',
  body: { event: 'user.created', data: { id: '123' } },
});

// Slack
await notify.slack({
  text: 'New user registered!',
  blocks: [
    {
      type: 'section',
      text: { type: 'mrkdwn', text: 'New user registered: *john@example.com*' }
    }
  ]
});
```

### Logger

```typescript
import { logger } from 'saas-backend-kit';

logger.info('Server started', { port: 3000 });
logger.error('Connection failed', { error: err.message });
logger.warn('Rate limit approaching', { ip: req.ip });

// Child logger
const childLogger = logger.child({ module: 'auth' });
childLogger.info('User logged in', { userId: '123' });
```

### Rate Limiting

```typescript
import { rateLimit } from 'saas-backend-kit';

// Global rate limit
app.use(rateLimit({
  window: '1m',
  limit: 100,
}));

// Per-route rate limit
app.get('/api/expensive', rateLimit({ window: '1m', limit: 10 }), (req, res) => {
  res.success({ data: 'expensive operation' });
});

// Custom key generator
app.use(rateLimit({
  window: '1m',
  limit: 100,
  keyGenerator: (req) => req.user?.id || req.ip,
}));
```

### Config Manager

```typescript
import { config } from 'saas-backend-kit';

// Load and validate env vars
config.load();

// Get values
const port = config.int('PORT');
const isProduction = config.isProduction();
const dbUrl = config.get('DATABASE_URL');

// Custom schema
const customConfig = config.create({
  schema: z.object({
    API_KEY: z.string(),
    MAX_CONNECTIONS: z.number().default(100),
  }),
  validate: true,
});
```

### API Response Helpers

```typescript
// Success responses
res.success({ user }, 'User found');
res.created({ id: '123' }, 'User created');
res.updated(user, 'User updated');
res.deleted Paginated response('User deleted');

//
res.pag, limit, total);

// Error responses
inated(users, pageres.badInvalid inputauthorized('Please');
res.unRequest(' login');
res.forbidden('Access denied');
res.notFound('User not found');
res failed', { fields.validationError('Validation: errors('Something });
res.internalError went wrong');
```

### Plugin Architecture

```typescript
import { createApp, Plugin } from 'saas-backend-kit';

const myPlugin: Plugin = {
  name: 'my-plugin',
  initialize: (app) => {
    console.log('Plugin initialized');
  },
};

const app = createApp({
  auth: true,
  queue: { redisUrl: 'redis://localhost:6379' },
  notifications: true,
  rateLimit: { window: '1m', limit: 100 },
})
.use(myPlugin);

await app.initialize(expressApp);
```

## Framework Support

### Express

All examples above use Express. The library automatically extends the Response object with helper methods.

### Fastify

```typescript
import Fastify from 'fastify';
import { registerAuthPlugin, registerRateLimitPlugin, auth } from 'saas-backend-kit';

const fastify = Fastify();

fastify.register(registerAuthPlugin, { authService: auth() });
fastify.register(registerRateLimitPlugin, { window: '1m', limit: 100 });

fastify.get('/dashboard', { preHandler: [fastify.authenticate] }, async (request, reply) => {
  return { user: request.user };
});
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-refresh-secret
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# Google OAuth
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# SMTP
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@domain.com

# Twilio
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Slack
SLACK_WEBHOOK_URL=

# Rate Limiting
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_LIMIT=100

# Logger
LOG_LEVEL=info
```

## Project Structure

```
saas-backend-kit/
├── src/
│   ├── auth/           # Authentication module
│   │   ├── types.ts
│   │   ├── jwt.ts
│   │   ├── rbac.ts
│   │   ├── oauth.ts
│   │   ├── express.ts
│   │   ├── fastify.ts
│   │   └── index.ts
│   ├── queue/         # Task queue (BullMQ)
│   ├── notifications/ # Email, SMS, Webhooks, Slack
│   ├── logger/        # Pino logger
│   ├── rate-limit/    # Rate limiting
│   ├── config/        # Config manager
│   ├── response/      # Response helpers
│   ├── utils/         # Utilities
│   ├── plugin.ts      # Plugin architecture
│   └── index.ts       # Main exports
├── examples/
│   └── express/
├── package.json
├── tsconfig.json
└── tsup.config.ts
```

## TypeScript

This library is written in TypeScript and provides full type definitions out of the box.

## Tree Shaking

All modules are exported separately for optimal tree shaking:

```typescript
import { auth } from 'saas-backend-kit/auth';
import { queue } from 'saas-backend-kit/queue';
import { logger } from 'saas-backend-kit/logger';
```

## Testing

```bash
npm test
npm run test:watch
```

## Linting

```bash
npm run lint
npm run typecheck
```

## Building

```bash
npm run build
```

## License

MIT License - see [LICENSE](LICENSE) for details.

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

---

Built with ❤️ for the SaaS community
#   s a a s - b a c k e n d - k i t  
 