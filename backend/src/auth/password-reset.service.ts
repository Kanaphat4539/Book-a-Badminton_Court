import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { ResetMailService } from './reset-mail.service';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter';

@Injectable()
export class PasswordResetService {
  static readonly REQUEST_MESSAGE =
    'If this email belongs to an account, a reset link will be sent.';
  private readonly logger = new Logger(PasswordResetService.name);

  constructor(
    private readonly users: UsersService,
    private readonly mail: ResetMailService,
    private readonly limiter: PasswordResetRateLimiter,
  ) {}

  async request(input: unknown, clientAddress: string) {
    if (
      typeof input !== 'string' ||
      input.length > 255 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.trim())
    ) {
      throw new BadRequestException('Enter a valid email address');
    }
    this.mail.assertConfigured();
    const startedAt = Date.now();
    const email = input.trim().toLowerCase();
    if (!this.limiter.take(clientAddress)) {
      await new Promise<void>((resolve) =>
        setTimeout(resolve, Math.max(0, 250 - (Date.now() - startedAt))),
      );
      return { message: PasswordResetService.REQUEST_MESSAGE };
    }
    const student = await this.users.findStudentByEmail(email);
    const token = randomBytes(32).toString('hex');
    const hash = createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60_000);
    // An unknown address goes through the same indexed lookup and update path.
    const reserved = await this.users.setPasswordResetToken(
      student?.stu_id ?? '__invalid_student_id__',
      hash,
      expiresAt,
    );
    if (student && reserved) {
      // Keep the public response independent of SMTP latency and account existence.
      void this.mail
        .sendResetLink(student.email, token)
        .catch(async (error) => {
          try {
            await this.users.clearPasswordResetToken(hash);
          } catch (clearError) {
            this.logger.error(
              'Failed to clear an undelivered reset token',
              clearError instanceof Error ? clearError.stack : undefined,
            );
          }
          this.logger.error(
            'Failed to send password reset email',
            error instanceof Error ? error.stack : undefined,
          );
        });
    }
    await new Promise<void>((resolve) =>
      setTimeout(resolve, Math.max(0, 250 - (Date.now() - startedAt))),
    );
    return { message: PasswordResetService.REQUEST_MESSAGE };
  }

  async reset(token: unknown, password: unknown) {
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) {
      throw new BadRequestException('Invalid or expired reset link');
    }
    if (
      typeof password !== 'string' ||
      password.length < 8 ||
      Buffer.byteLength(password, 'utf8') > 72
    ) {
      throw new BadRequestException('Password must be 8 to 72 bytes long');
    }
    const hash = createHash('sha256').update(token).digest('hex');
    if (!(await this.users.hasValidPasswordResetToken(hash, new Date()))) {
      throw new BadRequestException('Invalid or expired reset link');
    }
    const nextPasswordHash = await bcrypt.hash(password, 12);
    if (
      !(await this.users.consumePasswordResetToken(
        hash,
        nextPasswordHash,
        new Date(),
      ))
    ) {
      throw new BadRequestException('Invalid or expired reset link');
    }
    return { message: 'Password updated. You can now sign in.' };
  }
}
