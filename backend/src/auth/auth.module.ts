import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './jwt.strategy';
import { PasswordResetController } from './password-reset.controller';
import { PasswordResetService } from './password-reset.service';
import { ResetMailService } from './reset-mail.service';
import { PasswordResetRateLimiter } from './password-reset-rate-limiter';

export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'DO_NOT_USE_THIS_VALUE_IN_PROD',
};

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController, PasswordResetController],
  providers: [AuthService, JwtStrategy, PasswordResetService, ResetMailService, PasswordResetRateLimiter],
  exports: [AuthService],
})
export class AuthModule {}
