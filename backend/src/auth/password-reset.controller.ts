import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PasswordResetService } from './password-reset.service';
import { UsersService } from '../users/users.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly resets: PasswordResetService, private readonly users: UsersService) {}

  @Post('forgot-password')
  @HttpCode(202)
  request(@Body('email') email: unknown, @Req() request: Request) {
    return this.resets.request(
      email,
      request.ip || request.socket.remoteAddress || 'unknown',
    );
  }

  @Post('reset-password')
  @HttpCode(200)
  reset(@Body('token') token: unknown, @Body('password') password: unknown) {
    return this.resets.reset(token, password);
  }

  @Post('reset-password-demo')
  @HttpCode(200)
  async resetDemo(@Body('email') email: unknown, @Body('password') password: unknown) {
    if (typeof email !== 'string' || typeof password !== 'string' || password.length < 8) {
      return { message: 'Invalid email or password (min 8 chars)' };
    }
    const updated = await this.users.updatePasswordByEmail(email.trim().toLowerCase(), password);
    return updated ? { message: 'Password updated. You can now sign in.' } : { message: 'Email not found' };
  }

  @Post('reset-password-direct')
  @HttpCode(200)
  async resetDirect(
    @Body('email') email: unknown,
    @Body('password') password: unknown,
    @Body('confirmPassword') confirmPassword: unknown,
  ) {
    if (typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
      return { message: 'Invalid input' };
    }
    if (password.length < 8) {
      return { message: 'Password must be at least 8 characters' };
    }
    if (password !== confirmPassword) {
      return { message: 'Passwords do not match' };
    }
    const updated = await this.users.updatePasswordByEmail(email.trim().toLowerCase(), password);
    return updated ? { message: 'Password updated. You can now sign in.' } : { message: 'Email not found' };
  }
}
