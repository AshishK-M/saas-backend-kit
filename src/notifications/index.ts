import nodemailer, { Transporter, SendMailOptions } from 'nodemailer';
import { config } from '../config';
import { logger } from '../logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  template?: string;
  templateData?: Record<string, unknown>;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  attachments?: Array<{
    filename: string;
    content?: Buffer | string;
    path?: string;
    contentType?: string;
  }>;
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
  blocks?: Array<{
    type: string;
    text?: { type: string; text: string; emoji?: boolean };
    elements?: Array<{ type: string; text?: { type: string; text: string } }>;
    accessory?: { type: string; image_url?: string; alt_text?: string };
  }>;
  channel?: string;
  username?: string;
  iconEmoji?: string;
}

export interface NotificationTransporter {
  email: Transporter;
  twilio?: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  slack?: {
    webhookUrl: string;
  };
}

class EmailService {
  private transporter: Transporter | null = null;
  private from: string;

  constructor() {
    this.from = config.get('SMTP_FROM') || 'noreply@example.com';
    this.initialize();
  }

  private initialize(): void {
    const host = config.get('SMTP_HOST');
    const port = parseInt(config.get('SMTP_PORT') || '587', 10);
    const user = config.get('SMTP_USER');
    const pass = config.get('SMTP_PASS');

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
          user,
          pass,
        },
      });
      logger.info('Email service initialized');
    }
  }

  setTransporter(transporter: Transporter): void {
    this.transporter = transporter;
  }

  async send(options: EmailOptions): Promise<{ messageId: string }> {
    if (!this.transporter) {
      logger.warn('Email transporter not configured, skipping email');
      return { messageId: 'mock-message-id' };
    }

    const mailOptions: SendMailOptions = {
      from: options.from || this.from,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: options.subject,
      text: options.text,
      html: options.html || this.renderTemplate(options.template, options.templateData),
      cc: options.cc,
      bcc: options.bcc,
      attachments: options.attachments,
    };

    const result = await this.transporter.sendMail(mailOptions);
    logger.info(`Email sent to ${options.to}`, { messageId: result.messageId });
    return { messageId: result.messageId };
  }

  private renderTemplate(templateName?: string, data?: Record<string, unknown>): string | undefined {
    if (!templateName || !data) return undefined;

    const templates: Record<string, (data: Record<string, unknown>) => string> = {
      welcome: (data) => `
        <h1>Welcome, ${data.name || 'User'}!</h1>
        <p>Thank you for joining ${data.appName || 'our platform'}.</p>
        <p>Get started by verifying your email.</p>
      `,
      passwordReset: (data) => `
        <h1>Password Reset</h1>
        <p>Click <a href="${data.resetUrl}">here</a> to reset your password.</p>
        <p>This link expires in ${data.expiry || '1 hour'}.</p>
      `,
      verification: (data) => `
        <h1>Verify Your Email</h1>
        <p>Click <a href="${data.verifyUrl}">here</a> to verify your email.</p>
      `,
    };

    const template = templates[templateName];
    return template ? template(data) : undefined;
  }
}

class SMSService {
  private accountSid: string;
  private authToken: string;
  private phoneNumber: string;
  private initialized: boolean = false;

  constructor() {
    this.accountSid = config.get('TWILIO_ACCOUNT_SID') || '';
    this.authToken = config.get('TWILIO_AUTH_TOKEN') || '';
    this.phoneNumber = config.get('TWILIO_PHONE_NUMBER') || '';
    this.initialized = !!(this.accountSid && this.authToken && this.phoneNumber);
  }

  async send(options: SMSOptions): Promise<{ sid: string }> {
    if (!this.initialized) {
      logger.warn('Twilio not configured, skipping SMS');
      return { sid: 'mock-sid' };
    }

    try {
      const twilio = await import('twilio');
      const client = twilio.default(this.accountSid, this.authToken);

      const result = await client.messages.create({
        body: options.message,
        from: options.from || this.phoneNumber,
        to: options.to,
      });

      logger.info(`SMS sent to ${options.to}`, { sid: result.sid });
      return { sid: result.sid };
    } catch (error) {
      logger.error('Failed to send SMS', { error });
      throw error;
    }
  }
}

class WebhookService {
  async send(options: WebhookOptions): Promise<{ status: number; body: unknown }> {
    const response = await fetch(options.url, {
      method: options.method || 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: options.timeout ? AbortSignal.timeout(options.timeout) : undefined,
    });

    const body = await response.json().catch(() => null);
    logger.info(`Webhook sent to ${options.url}`, { status: response.status });
    return { status: response.status, body };
  }
}

class SlackService {
  private webhookUrl: string;

  constructor() {
    this.webhookUrl = config.get('SLACK_WEBHOOK_URL') || '';
  }

  setWebhookUrl(url: string): void {
    this.webhookUrl = url;
  }

  async send(options: SlackOptions): Promise<{ ok: boolean }> {
    if (!this.webhookUrl) {
      logger.warn('Slack webhook not configured, skipping message');
      return { ok: false };
    }

    const payload = {
      text: options.text,
      blocks: options.blocks,
      channel: options.channel,
      username: options.username,
      icon_emoji: options.iconEmoji,
    };

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const ok = response.ok;
    if (ok) {
      logger.info('Slack message sent');
    } else {
      logger.error('Failed to send Slack message');
    }
    return { ok };
  }
}

class NotificationService {
  email: EmailService;
  sms: SMSService;
  webhook: WebhookService;
  slack: SlackService;

  constructor() {
    this.email = new EmailService();
    this.sms = new SMSService();
    this.webhook = new WebhookService();
    this.slack = new SlackService();
  }
}

export const notify = new NotificationService();

export const notification = {
  email: (options: EmailOptions) => notify.email.send(options),
  sms: (options: SMSOptions) => notify.sms.send(options),
  webhook: (options: WebhookOptions) => notify.webhook.send(options),
  slack: (options: SlackOptions) => notify.slack.send(options),
};

export default notification;
