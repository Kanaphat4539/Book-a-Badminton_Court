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
    if (typeof username !== 'string' || typeof pass !== 'string' || !username || !pass) return null;
    const found = await this.usersService.findByUsername(username);
    if (found && found.user.password && (found.user.password.startsWith('$2')
      ? await bcrypt.compare(pass, found.user.password)
      : pass === found.user.password)) {
      const { password, ...result } = found.user;
      return { ...result, role: found.role };
    }
    return null;
  }

  async login(user: any) {
    const userId = user.role === UserRole.ADMIN ? user.admin_id : user.stu_id;
    const payload = { username: user.username, sub: userId, role: user.role, sessionVersion: user.password_version ?? 0 };
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
    if (!userDetails || typeof userDetails !== 'object' || Array.isArray(userDetails)) {
      throw new BadRequestException('Invalid registration data');
    }
    if (typeof userDetails.username !== 'string' || userDetails.username.trim() === '') {
      throw new BadRequestException('Username is required');
    }
    if (typeof userDetails.password !== 'string' || userDetails.password.trim() === '') {
      throw new BadRequestException('Password is required');
    }
    if (typeof userDetails.studentId !== 'string' && typeof userDetails.stu_id !== 'string') {
      throw new BadRequestException('Student ID must be 8 digits');
    }
    const studentId = userDetails.studentId ?? userDetails.stu_id;
    if (!/^\d{8}$/.test(studentId)) throw new BadRequestException('Student ID must be 8 digits');
    const email = userDetails.email;
    if (typeof email !== 'string' || !/^[^\s@]+@kmitl\.ac\.th$/i.test(email)) {
      throw new BadRequestException('Email must be a valid @kmitl.ac.th address');
    }
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
