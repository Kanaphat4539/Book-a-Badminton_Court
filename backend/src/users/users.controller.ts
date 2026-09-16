import { Controller, Get, Post, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { UsersService, UserRole } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN)
  async findAll() {
    return this.usersService.findAllStudents();
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  async remove(@Param('id') id: string) {
    return this.usersService.removeStudent(id);
  }

  @Post('admin')
  @Roles(UserRole.ADMIN)
  async createAdmin(@Body() adminData: any) {
    return this.usersService.createAdmin(adminData);
  }

  @Get('me/ban-status')
  async getBanStatus(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) {
      return { isBanned: false, bannedUntil: null, strikes: 0 };
    }

    const student = await this.usersService.findStudentById(req.user.userId);
    if (!student) {
      return { isBanned: false, bannedUntil: null, strikes: 0 };
    }

    let isBanned = false;
    let bannedUntil: Date | null = student.banned_until;
    let strikes = student.strikes;

    if (bannedUntil) {
      const now = new Date();
      if (now < new Date(bannedUntil)) {
        isBanned = true;
      } else {
        // Auto-unban
        student.banned_until = null;
        student.strikes = 0;
        await this.usersService.saveStudent(student);
        bannedUntil = null;
        strikes = 0;
      }
    }

    return {
      isBanned,
      bannedUntil,
      strikes
    };
  }
}
