import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService, UserRole } from '../users/users.service';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let usersService: jest.Mocked<Pick<UsersService, 'findByUsername' | 'createStudent'>>;
  let jwtService: jest.Mocked<Pick<JwtService, 'sign'>>;

  beforeEach(async () => {
    usersService = {
      findByUsername: jest.fn(),
      createStudent: jest.fn(),
    };
    jwtService = {
      sign: jest.fn().mockReturnValue('signed.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('validateUser', () => {
    it('returns the admin (without password) + role when the password matches', async () => {
      const password = await bcrypt.hash('secret', 10);
      usersService.findByUsername.mockResolvedValue({
        user: { admin_id: 'A001', username: 'admin', name: 'Admin', password },
        role: UserRole.ADMIN,
      });

      const result = await service.validateUser('admin', 'secret');

      expect(result).toMatchObject({ admin_id: 'A001', username: 'admin', role: UserRole.ADMIN });
      expect(result.password).toBeUndefined();
    });

    it('returns null when the password is wrong', async () => {
      const password = await bcrypt.hash('secret', 10);
      usersService.findByUsername.mockResolvedValue({
        user: { stu_id: '64010001', username: 'stu', password },
        role: UserRole.STUDENT,
      });

      expect(await service.validateUser('stu', 'WRONG')).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      expect(await service.validateUser('ghost', 'x')).toBeNull();
    });
  });

  describe('login', () => {
    it('signs an admin token keyed by admin_id', async () => {
      const res = await service.login({ admin_id: 'A001', username: 'admin', name: 'Admin', role: UserRole.ADMIN });
      expect(jwtService.sign).toHaveBeenCalledWith({ username: 'admin', sub: 'A001', role: UserRole.ADMIN });
      expect(res.user).toEqual({ id: 'A001', username: 'admin', name: 'Admin', role: UserRole.ADMIN });
      expect(res.access_token).toBe('signed.jwt.token');
    });

    it('signs a student token keyed by stu_id and joins the full name', async () => {
      const res = await service.login({
        stu_id: '64010001', username: 'stu', first_name: 'Some', last_name: 'One', role: UserRole.STUDENT,
      });
      expect(jwtService.sign).toHaveBeenCalledWith({ username: 'stu', sub: '64010001', role: UserRole.STUDENT });
      expect(res.user).toEqual({ id: '64010001', username: 'stu', name: 'Some One', role: UserRole.STUDENT });
    });
  });

  describe('register', () => {
    it('rejects a duplicate username', async () => {
      usersService.findByUsername.mockResolvedValue({ user: {}, role: UserRole.STUDENT });
      await expect(service.register({ username: 'taken', email: 'a@kmitl.ac.th' }))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an email that is not @kmitl.ac.th', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      await expect(service.register({ username: 'new', email: 'someone@gmail.com' }))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a student and returns a login payload for a valid @kmitl.ac.th email', async () => {
      usersService.findByUsername.mockResolvedValue(null);
      usersService.createStudent.mockResolvedValue({
        stu_id: '64010001', username: 'new', first_name: 'New', last_name: 'Student',
      } as any);

      const res = await service.register({ username: 'new', email: 'new@kmitl.ac.th', name: 'New Student' });

      expect(usersService.createStudent).toHaveBeenCalled();
      expect(res.user).toMatchObject({ id: '64010001', role: UserRole.STUDENT });
    });
  });
});
