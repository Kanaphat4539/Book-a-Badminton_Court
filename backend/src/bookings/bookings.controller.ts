import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('bookings')
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  async createBooking(@Request() req: any, @Body() body: { courtId: number; date: string; startTime: string }) {
    return this.bookingsService.createBooking(req.user.userId, body.courtId, body.date, body.startTime);
  }

  @Get()
  @Roles(UserRole.ADMIN)
  async getAllBookings(@Query('date') date?: string) {
    return this.bookingsService.getAllBookings(date);
  }

  @Get('me')
  async getMyBookings(@Request() req: any) {
    return this.bookingsService.getMyBookings(req.user.userId);
  }

  @Post(':id/check-in')
  async checkIn(@Request() req: any, @Param('id') id: string, @Body() body: { courtId: number }) {
    return this.bookingsService.checkIn(+id, req.user.userId, body.courtId);
  }

  @Post(':id/cancel')
  async cancelBooking(@Request() req: any, @Param('id') id: string) {
    return this.bookingsService.cancelBooking(+id, req.user.userId);
  }
}
