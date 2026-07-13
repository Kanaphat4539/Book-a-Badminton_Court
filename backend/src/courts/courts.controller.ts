import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get('availability')
  async getAvailability(@Query('date') date: string) {
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    return this.courtsService.getAvailability(date);
  }
}
