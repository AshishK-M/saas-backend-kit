# saas-backend-kit

Production-grade modular backend toolkit for building scalable SaaS applications with Node.js, Express, and Fastify.

[![npm version](https://img.shields.io/npm/v/saas-backend-kit.svg)](https://www.npmjs.com/package/saas-backend-kit)
[![npm downloads](https://img.shields.io/npm/dt/saas-backend-kit.svg)](https://www.npmjs.com/package/saas-backend-kit)
[![License: MIT](https://img.shields.io/npm/l/saas-backend-kit.svg)](https://opensource.org/licenses/MIT)

## Features

- **Authentication** - JWT authentication, RBAC, Google OAuth
- **Task Queue** - Redis-based job queue (BullMQ)
- **Notifications** - Email, SMS (Twilio), Webhooks, Slack
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
import { auth, rateLimit, logger, config } from 'saas-backend-kit';

config.load();

const app = express();
app.use(express.json());

app.use(auth.initialize({ jwtSecret: 'your-secret-key' }));
app.use(rateLimit({ window: '1m', limit: 100 }));

app.get('/dashboard', auth.requireUser(), (req, res) => {
  res.success({ message: 'Welcome!', user: req.user });
});

app.listen(3000, () => logger.info('Server running'));
```

## Authentication

```typescript
app.use(auth.initialize({
  jwtSecret: 'your-secret-key',
  jwtExpiresIn: '7d'
}));

// Register
await auth().register({ email, password, name });

// Login
await auth().login({ email, password });

// Route protection
auth.requireUser();              // Requires authentication
auth.requireRole('admin');       // Requires admin role
auth.requirePermission('read');  // Requires permission
```

## Task Queue

```typescript
import { queue } from 'saas-backend-kit';

const emailQueue = queue.create('email');

await emailQueue.add('sendEmail', { to: 'user@example.com' });

queue.process('email', async (job) => {
  await notify.email({ to: job.data.to, subject: 'Hello' });
}, { concurrency: 5 });
```

## Notifications

```typescript
import { notify } from 'saas-backend-kit';

// Email
await notify.email({ to: 'user@example.com', subject: 'Welcome', template: 'welcome' });

// SMS
await notify.sms({ to: '+1234567890', message: 'Your code is 123456' });

// Webhook
await notify.webhook({ url: 'https://api.example.com/hook', body: { event: 'user.created' } });

// Slack
await notify.slack({ text: 'New user registered!' });
```

## Logger

```typescript
import { logger } from 'saas-backend-kit';

logger.info('Server started', { port: 3000 });
logger.error('Failed', { error: err.message });

const child = logger.child({ module: 'auth' });
child.info('User logged in');
```

## Rate Limiting

```typescript
app.use(rateLimit({ window: '1m', limit: 100 }));

// Custom
app.use(rateLimit({ window: '1m', limit: 10, keyGenerator: (req) => req.user?.id }));
```

## Config

```typescript
config.load();

const port = config.int('PORT');
const isProduction = config.isProduction();
const dbUrl = config.get('DATABASE_URL');
```

## API Responses

```typescript
res.success({ user });
res.created(user, 'Created, 'Updated');
');
res.updated(userres.deleted('Deleted');
res.paginated(users, page, limit, total);
res.error('Error message');
```

## Environment Variables

```env
NODE_ENV=development
PORT=3000
JWT_SECRET=your-secret-key
REDIS_URL=redis://localhost:6379
```

## License

MIT
