import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PasswordResetRateLimiter {
  private readonly clients = new Map<
    string,
    { count: number; expiresAt: number }
  >();

  take(clientAddress: string): boolean {
    const now = Date.now();
    const key = createHash('sha256').update(clientAddress).digest('hex');
    const previous = this.clients.get(key);
    const count = previous && previous.expiresAt > now ? previous.count : 0;
    if (count >= 30) return false;
    if (!previous && this.clients.size >= 10_000) {
      for (const oldest of this.clients.keys()) {
        this.clients.delete(oldest);
        break;
      }
    }
    this.clients.delete(key);
    this.clients.set(key, {
      count: count + 1,
      expiresAt: count ? previous!.expiresAt : now + 10 * 60_000,
    });
    return true;
  }
}
