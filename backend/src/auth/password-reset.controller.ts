import { BadRequestException, Body, Controller, HttpCode, NotFoundException, Post, Req } from '@nestjs/common';
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
      throw new BadRequestException('Invalid email or password (min 8 chars)');
    }
    const updated = await this.users.updatePasswordByEmail(email.trim().toLowerCase(), password);
    if (!updated) {
      throw new NotFoundException('Email not found in system');
    }
    return { message: 'Password updated. You can now sign in.' };
  }

  @Post('reset-password-direct')
  @HttpCode(200)
  async resetDirect(
    @Body('email') email: unknown,
    @Body('password') password: unknown,
    @Body('confirmPassword') confirmPassword: unknown,
  ) {
    if (typeof email !== 'string' || typeof password !== 'string' || typeof confirmPassword !== 'string') {
      throw new BadRequestException('Invalid input');
    }
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters');
    }
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const updated = await this.users.updatePasswordByEmail(email.trim().toLowerCase(), password);
    if (!updated) {
      throw new NotFoundException('Email not found in system');
    }
    return { message: 'Password updated. You can now sign in.' };
  }
}
