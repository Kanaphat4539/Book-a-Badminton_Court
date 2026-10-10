import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common';
import { WelcomeService } from './welcome.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/users.service';

@Controller('welcome')
export class WelcomeController {
  constructor(private readonly welcomeService: WelcomeService) {}

  @Get()
  async getWelcome() {
    return this.welcomeService.getContent();
  }

  @Put()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateWelcome(@Body() body: any) {
    return this.welcomeService.saveContent(body);
  }

  @Post('reset')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async resetWelcome() {
    return this.welcomeService.resetContent();
  }
}
