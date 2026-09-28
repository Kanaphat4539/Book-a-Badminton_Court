import { Body, Controller, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PasswordResetService } from './password-reset.service';

@Controller('auth')
export class PasswordResetController {
  constructor(private readonly resets: PasswordResetService) {}

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
}
