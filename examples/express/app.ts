import express from 'express';
import { 
  auth, 
  rateLimit, 
  logger, 
  config, 
  queue, 
  notify, 
  response,
  createApp 
} from '../src';

config.load();

const app = express();

app.use(express.json());

const authMiddleware = auth.initialize({
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: '7d',
  refreshExpiresIn: '30d',
  googleClientId: process.env.GOOGLE_CLIENT_ID,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET,
  googleRedirectUri: process.env.GOOGLE_REDIRECT_URI,
});

app.use(authMiddleware);

app.use(rateLimit({
  window: '1m',
  limit: 100,
}));

app.post('/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const result = await auth().register({ email, password, name });
    res.success(result.tokens, 'Registration successful');
  } catch (error: any) {
    res.badRequest(error.message);
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await auth().login({ email, password });
    res.success(result.tokens, 'Login successful');
  } catch (error: any) {
    res.unauthorized('Invalid credentials');
  }
});

app.post('/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await auth().refresh(refreshToken);
    res.success(tokens);
  } catch (error: any) {
    res.unauthorized('Invalid refresh token');
  }
});

app.get('/auth/google', async (req, res) => {
  const url = await auth().getGoogleAuthUrl();
  res.redirect(url);
});

app.get('/auth/google/callback', async (req, res) => {
  try {
    const { code } = req.query;
    const result = await auth().handleGoogleCallback(code as string);
    res.success(result.tokens, 'Google login successful');
  } catch (error: any) {
    res.badRequest('Google authentication failed');
  }
});

app.get('/dashboard', auth.requireUser(), (req, res) => {
  res.success({ message: 'Welcome to your dashboard', user: req.user });
});

app.get('/admin', auth.requireRole('admin'), (req, res) => {
  res.success({ message: 'Admin area' });
});

app.get('/protected', auth.requirePermission('read'), (req, res) => {
  res.success({ message: 'You have read permission' });
});

const emailQueue = queue.create('email', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  },
});

emailQueue.add('sendWelcomeEmail', { userId: '123', email: 'user@example.com' }, {
  delay: 5000,
});

queue.process('email', async (job) => {
  logger.info(`Processing email job`, { jobId: job.id, type: job.name });
  
  await notify.email({
    to: job.data.email,
    subject: 'Welcome!',
    template: 'welcome',
    templateData: { name: 'User', appName: 'My SaaS App' },
  });
  
  return { sent: true };
});

app.post('/notify/email', async (req, res) => {
  try {
    const { to, subject, template, data } = req.body;
    await notify.email({ to, subject, template, templateData: data });
    res.success({ message: 'Email sent' });
  } catch (error: any) {
    res.internalError(error.message);
  }
});

app.post('/notify/sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    await notify.sms({ to, message });
    res.success({ message: 'SMS sent' });
  } catch (error: any) {
    res.internalError(error.message);
  }
});

app.post('/notify/webhook', async (req, res) => {
  try {
    const { url, method, body, headers } = req.body;
    const result = await notify.webhook({ url, method, body, headers });
    res.success(result);
  } catch (error: any) {
    res.internalError(error.message);
  }
});

app.post('/notify/slack', async (req, res) => {
  try {
    const { text, blocks } = req.body;
    await notify.slack({ text, blocks });
    res.success({ message: 'Slack notification sent' });
  } catch (error: any) {
    res.internalError(error.message);
  }
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: '1', name: 'John Doe', email: 'john@example.com' },
    { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
  ];
  
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const total = users.length;
  
  res.paginated(users, page, limit, total);
});

app.get('/api/users/:id', (req, res) => {
  const user = { id: req.params.id, name: 'John Doe', email: 'john@example.com' };
  res.success(user);
});

app.post('/api/users', (req, res) => {
  const user = { id: '3', ...req.body };
  res.created(user, 'User created');
});

app.put('/api/users/:id', (req, res) => {
  const user = { id: req.params.id, ...req.body };
  res.updated(user, 'User updated');
});

app.delete('/api/users/:id', (req, res) => {
  res.deleted('User deleted');
});

const PORT = config.int('PORT') || 3000;

app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
});

process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing server');
  await queue.closeAll();
  process.exit(0);
});

export default app;
