import { PasswordResetRateLimiter } from './password-reset-rate-limiter';

describe('PasswordResetRateLimiter', () => {
  it('bounds requests from one client even when addresses vary', () => {
    const limiter = new PasswordResetRateLimiter();
    for (let i = 0; i < 30; i++) expect(limiter.take('192.0.2.1')).toBe(true);
    expect(limiter.take('192.0.2.1')).toBe(false);
    expect(limiter.take('192.0.2.2')).toBe(true);
  });
});
