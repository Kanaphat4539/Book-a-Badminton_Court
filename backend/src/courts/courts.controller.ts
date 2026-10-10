import { Controller, Get, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { CourtsService } from './courts.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/users.service';

@Controller('courts')
export class CourtsController {
  constructor(private readonly courtsService: CourtsService) {}

  @Get()
  async getCourts() {
    return this.courtsService.findAll();
  }

  @Get('availability')
  async getAvailability(@Query('date') date: string) {
    if (!date) {
      date = new Date().toISOString().split('T')[0];
    }
    return this.courtsService.getAvailability(date);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async updateCourt(
    @Param('id') id: string,
    @Body() body: { name?: string; image?: string; location?: string; is_active?: boolean },
  ) {
    return this.courtsService.updateCourt(+id, body);
  }
}
