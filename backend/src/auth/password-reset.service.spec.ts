import { BadRequestException, Logger } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PasswordResetService } from './password-reset.service';
import { UsersService } from '../users/users.service';
import { ResetMailService } from './reset-mail.service';
import { Student } from '../users/entities/student.entity';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter';

describe('PasswordResetService', () => {
  const student = { stu_id: '65010001', email: 'student@kmitl.ac.th' };
  let storedHash: string | null;
  let expiresAt: Date | null;
  let passwordHash: string | null;
  let passwordVersion: number;
  let sentLink: string | null;
  let users: Pick<
    UsersService,
    | 'findStudentByEmail'
    | 'setPasswordResetToken'
    | 'consumePasswordResetToken'
    | 'clearPasswordResetToken'
    | 'hasValidPasswordResetToken'
  >;
  let mail: Pick<ResetMailService, 'assertConfigured' | 'sendResetLink'>;
  let service: PasswordResetService;

  beforeEach(() => {
    storedHash = null;
    expiresAt = null;
    passwordHash = null;
    passwordVersion = 0;
    sentLink = null;
    users = {
      findStudentByEmail: jest.fn((email) =>
        Promise.resolve(email === student.email ? (student as Student) : null),
      ),
      setPasswordResetToken: jest.fn((_id, hash, expiry) => {
        storedHash = hash;
        expiresAt = expiry;
        return Promise.resolve(true);
      }),
      consumePasswordResetToken: jest.fn((hash, nextPasswordHash, now) => {
        if (
          !storedHash ||
          storedHash !== hash ||
          !expiresAt ||
          expiresAt <= now
        )
          return Promise.resolve(false);
        storedHash = null;
        expiresAt = null;
        passwordHash = nextPasswordHash;
        passwordVersion++;
        return Promise.resolve(true);
      }),
      clearPasswordResetToken: jest.fn((hash) => {
        if (storedHash === hash) storedHash = null;
        return Promise.resolve();
      }),
      hasValidPasswordResetToken: jest.fn((hash, now) =>
        Promise.resolve(
          Boolean(storedHash === hash && expiresAt && expiresAt > now),
        ),
      ),
    };
    mail = {
      assertConfigured: jest.fn(),
      sendResetLink: jest.fn((_email, token) => {
        sentLink = `http://localhost/reset-password?token=${token}`;
        return Promise.resolve();
      }),
    };
    service = new PasswordResetService(
      users as UsersService,
      mail,
      new PasswordResetRateLimiter(),
    );
  });

  afterEach(() => jest.restoreAllMocks());

  it('returns the same public result for unknown and known student emails', async () => {
    expect(await service.request('missing@kmitl.ac.th', '192.0.2.1')).toEqual({
      message: PasswordResetService.REQUEST_MESSAGE,
    });
    expect(mail.sendResetLink).not.toHaveBeenCalled();
    expect(users.setPasswordResetToken).toHaveBeenCalledTimes(1);
    expect(await service.request(' STUDENT@KMITL.AC.TH ', '192.0.2.1')).toEqual(
      {
        message: PasswordResetService.REQUEST_MESSAGE,
      },
    );
    expect(mail.sendResetLink).toHaveBeenCalledTimes(1);
  });

  it('stores only a token hash and expires the link in fifteen minutes', async () => {
    await service.request(student.email, '192.0.2.1');
    const token = new URL(sentLink!).searchParams.get('token')!;
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    expect(storedHash).not.toBe(token);
    expect(storedHash).toMatch(/^[a-f0-9]{64}$/);
    expect(expiresAt!.getTime() - Date.now()).toBeGreaterThan(14 * 60 * 1000);
    expect(expiresAt!.getTime() - Date.now()).toBeLessThanOrEqual(
      15 * 60 * 1000,
    );
  });

  it('consumes the link once, hashes the new password, and advances the session version', async () => {
    await service.request(student.email, '192.0.2.1');
    const token = new URL(sentLink!).searchParams.get('token')!;
    await service.reset(token, 'new-secure-password');
    expect(await bcrypt.compare('new-secure-password', passwordHash!)).toBe(
      true,
    );
    expect(passwordVersion).toBe(1);
    await expect(
      service.reset(token, 'another-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects expired links and weak passwords', async () => {
    await service.request(student.email, '192.0.2.1');
    const token = new URL(sentLink!).searchParams.get('token')!;
    await expect(service.reset(token, 'short')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expiresAt = new Date(Date.now() - 1);
    await expect(
      service.reset(token, 'new-secure-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unknown tokens before attempting to update a password', async () => {
    await expect(
      service.reset('f'.repeat(64), 'new-secure-password'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(users.consumePasswordResetToken).not.toHaveBeenCalled();
  });

  it('clears an undelivered token without revealing the account in the response', async () => {
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    mail.sendResetLink = jest.fn(() =>
      Promise.reject(new Error('SMTP unavailable')),
    );
    expect(await service.request(student.email, '192.0.2.1')).toEqual({
      message: PasswordResetService.REQUEST_MESSAGE,
    });
    await new Promise((resolve) => setImmediate(resolve));
    expect(storedHash).toBeNull();
  });
});
