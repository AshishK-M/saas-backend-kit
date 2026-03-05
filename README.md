<div align="center">

<!-- ANIMATED PIPELINE BANNER -->
<img src="./saas-banner.svg" width="100%" alt="saas-backend-kit — Production-grade modular backend toolkit for Node.js, Express, Fastify"/>

<br/>

[![npm version](https://img.shields.io/npm/v/saas-backend-kit.svg?style=for-the-badge&logo=npm&logoColor=white&color=cb3837)](https://www.npmjs.com/package/saas-backend-kit)
[![npm downloads](https://img.shields.io/npm/dt/saas-backend-kit.svg?style=for-the-badge&logo=npm&logoColor=white&color=26d97f)](https://www.npmjs.com/package/saas-backend-kit)
[![License: MIT](https://img.shields.io/npm/l/saas-backend-kit.svg?style=for-the-badge&color=3178c6)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-3178c6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)

</div>

---

## ✨ Features

| Module | Description | Powered By |
|--------|-------------|------------|
| 🔐 **Authentication** | JWT auth, RBAC, Google OAuth | jsonwebtoken, Passport |
| ⚡ **Task Queue** | Redis-based background jobs | BullMQ |
| 🔔 **Notifications** | Email, SMS, Webhooks, Slack | Nodemailer, Twilio |
| ☁️ **File Upload** | Images, videos, docs to S3 | AWS SDK v3 |
| 📋 **Logger** | Structured JSON logging | Pino |
| 🛡️ **Rate Limiting** | Configurable API rate limiting | express-rate-limit |
| ⚙️ **Config Manager** | Env variable validation | Zod |
| 📦 **API Responses** | Standardized response format | Built-in |

---

## 📦 Installation

```bash
npm install saas-backend-kit
```

---

## 🚀 Quick Start

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

---

## 🔐 Authentication

```typescript
app.use(auth.initialize({
  jwtSecret: 'your-secret-key',
  jwtExpiresIn: '7d'
}));

await auth().register({ email, password, name });
await auth().login({ email, password });

auth.requireUser();
auth.requireRole('admin');
auth.requirePermission('read');
```

---

## ⚡ Task Queue

```typescript
import { queue } from 'saas-backend-kit';

const emailQueue = queue.create('email');
await emailQueue.add('sendEmail', { to: 'user@example.com' });

queue.process('email', async (job) => {
  await notify.email({ to: job.data.to, subject: 'Hello' });
}, { concurrency: 5 });
```

---

## 🔔 Notifications

```typescript
import { notify } from 'saas-backend-kit';

await notify.email({ to: 'user@example.com', subject: 'Welcome' });
await notify.sms({ to: '+1234567890', message: 'Your code is 123456' });
await notify.slack({ text: 'New user registered!' });
```

---

## ☁️ File Upload (S3)

```typescript
import { upload } from 'saas-backend-kit';

upload.initialize({
  region: 'us-east-1',
  accessKeyId: 'your-access-key',
  secretAccessKey: 'your-secret-key',
  bucket: 'your-bucket-name'
});

const result    = await upload.file(fileBuffer, { key: 'documents/file.pdf' });
const image     = await upload.image(fileBuffer, 'photo.jpg');
const video     = await upload.video(fileBuffer, 'video.mp4');
const signedUrl = await upload.getSignedUrl('path/to/file');

await upload.delete('path/to/file');
```

---

## 📋 Logger

```typescript
import { logger } from 'saas-backend-kit';

logger.info('Server started', { port: 3000 });
logger.error('Failed', { error: err.message });

const child = logger.child({ module: 'auth' });
child.info('User logged in');
```

---

## 🛡️ Rate Limiting

```typescript
app.use(rateLimit({ window: '1m', limit: 100 }));
app.use(rateLimit({ window: '1m', limit: 10, keyGenerator: (req) => req.user?.id }));
```

---

## ⚙️ Config

```typescript
config.load();
const port         = config.int('PORT');
const isProduction = config.isProduction();
```

---

## 📦 API Responses

```typescript
res.success({ user });
res.created(user, 'Created');
res.paginated(users, page, limit, total);
res.error('Error message');
```

---

## 🔧 Environment Variables

```env
NODE_ENV=development
PORT=3000

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production-min-32-chars
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
JWT_REFRESH_EXPIRES_IN=30d

# Redis
REDIS_URL=redis://localhost:6379

# Database (optional)
DATABASE_URL=postgresql://user:password@localhost:5432/mydb

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/auth/google/callback

# Email (SMTP) (optional)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=noreply@yourdomain.com

# Twilio SMS (optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Slack (optional)
SLACK_WEBHOOK_URL=

# Rate Limiting
RATE_LIMIT_WINDOW=1m
RATE_LIMIT_LIMIT=100

# Logger
LOG_LEVEL=info

```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to open a PR or issue.

---

<div align="center">

**Built with ❤️ by [Ashish Kumar Maurya](https://github.com/AshishK-M)**  
Senior Full-Stack Developer · Dubai, UAE  
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=flat-square&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/ashish-kumar-maurya-fullstack/)

<sub>saas-backend-kit · MIT License · Node.js · Express · Fastify · TypeScript · BullMQ · AWS S3 · Pino · Zod</sub>

</div>