import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { UsersService, UserRole } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async validateUser(username: string, pass: string): Promise<any> {
    const found = await this.usersService.findByUsername(username);
    if (found && found.user.password && await bcrypt.compare(pass, found.user.password)) {
      const { password, ...result } = found.user;
      return { ...result, role: found.role };
    }
    return null;
  }

  async login(user: any) {
    const userId = user.role === UserRole.ADMIN ? user.admin_id : user.stu_id;
    const payload = { username: user.username, sub: userId, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: userId,
        username: user.username,
        name: user.role === UserRole.ADMIN ? user.name : `${user.first_name} ${user.last_name}`,
        role: user.role,
      }
    };
  }

  async register(userDetails: any) {
    const existingUser = await this.usersService.findByUsername(userDetails.username);
    if (existingUser) {
      throw new BadRequestException('Username already exists');
    }
    
    // Check if email ends with @kmitl.ac.th
    if (!userDetails.email || !userDetails.email.endsWith('@kmitl.ac.th')) {
      throw new BadRequestException('Email must be a @kmitl.ac.th address');
    }

    const newStudent = await this.usersService.createStudent(userDetails);
    return this.login({ ...newStudent, role: UserRole.STUDENT });
  }
}
