import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class ResetMailService {
  assertConfigured() {
    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASSWORD,
      SMTP_FROM,
      FRONTEND_URL,
    } = process.env;
    if (
      !SMTP_HOST ||
      !SMTP_PORT ||
      !SMTP_USER ||
      !SMTP_PASSWORD ||
      !SMTP_FROM ||
      !FRONTEND_URL
    ) {
      throw new ServiceUnavailableException(
        'Password recovery email is not configured',
      );
    }
    const port = Number(SMTP_PORT);
    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      throw new ServiceUnavailableException(
        'Password recovery email is not configured',
      );
    }
    try {
      const url = new URL(FRONTEND_URL);
      if (
        url.protocol !== 'https:' &&
        !(
          url.protocol === 'http:' &&
          ['localhost', '127.0.0.1'].includes(url.hostname)
        )
      ) {
        throw new Error('Invalid URL');
      }
    } catch {
      throw new ServiceUnavailableException(
        'Password recovery email is not configured',
      );
    }
  }

  async sendResetLink(to: string, token: string): Promise<void> {
    // Return control to the request before preparing the account-specific mail.
    await new Promise<void>((resolve) => setImmediate(resolve));
    this.assertConfigured();
    const port = Number(process.env.SMTP_PORT);
    const link = new URL('/reset-password', process.env.FRONTEND_URL);
    link.searchParams.set('token', token);
    const transport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      requireTLS: port !== 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
    try {
      await transport.sendMail({
        from: process.env.SMTP_FROM,
        to,
        subject: 'Reset your KMITL Badminton password',
        text: `Use this link within 15 minutes to reset your password: ${link.toString()}\n\nIf you did not request this, you can ignore this email.`,
      });
    } finally {
      transport.close();
    }
  }
}
