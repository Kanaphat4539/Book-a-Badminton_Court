import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/entities/user.entity';

describe('AuthService (unit)', () => {
  let service: AuthService;
  let usersService: { findOne: jest.Mock; create: jest.Mock };
  let jwtService: { sign: jest.Mock };

  beforeEach(async () => {
    usersService = { findOne: jest.fn(), create: jest.fn() };
    jwtService = { sign: jest.fn().mockReturnValue('signed.jwt.token') };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('returns the user without the password when credentials are correct', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      usersService.findOne.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: hashed,
        name: 'Alice',
        role: UserRole.USER,
      });

      const result = await service.validateUser('alice', 'secret');

      expect(result).toBeTruthy();
      expect(result.password).toBeUndefined();
      expect(result.username).toBe('alice');
    });

    it('returns null when the password is wrong', async () => {
      const hashed = await bcrypt.hash('secret', 10);
      usersService.findOne.mockResolvedValue({
        id: 1,
        username: 'alice',
        password: hashed,
      });

      const result = await service.validateUser('alice', 'wrong-password');

      expect(result).toBeNull();
    });

    it('returns null when the user does not exist', async () => {
      usersService.findOne.mockResolvedValue(null);

      const result = await service.validateUser('ghost', 'whatever');

      expect(result).toBeNull();
    });
  });

  describe('login', () => {
    it('signs a JWT payload and returns a sanitized user object', async () => {
      const result = await service.login({
        id: 7,
        username: 'bob',
        name: 'Bob',
        role: UserRole.ADMIN,
      });

      expect(jwtService.sign).toHaveBeenCalledWith({
        username: 'bob',
        sub: 7,
        role: UserRole.ADMIN,
      });
      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user).toEqual({
        id: 7,
        username: 'bob',
        name: 'Bob',
        role: UserRole.ADMIN,
      });
      expect((result.user as any).password).toBeUndefined();
    });
  });

  describe('register', () => {
    it('throws BadRequestException when the username already exists', async () => {
      usersService.findOne.mockResolvedValue({ id: 1, username: 'taken' });

      await expect(service.register({ username: 'taken', password: 'x' })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(usersService.create).not.toHaveBeenCalled();
    });

    it('creates the user and logs them in when the username is free', async () => {
      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockResolvedValue({
        id: 2,
        username: 'newbie',
        name: 'New',
        role: UserRole.USER,
      });

      const result = await service.register({ username: 'newbie', password: 'pw', name: 'New' });

      expect(usersService.create).toHaveBeenCalled();
      expect(result.access_token).toBe('signed.jwt.token');
      expect(result.user.username).toBe('newbie');
    });

    // KNOWN BUG (role escalation, see TESTING.md #01): register currently trusts a
    // client-supplied `role`. `it.failing` documents the CORRECT behavior and stays green
    // while the bug exists; once register/create force UserRole.USER this will start
    // failing, prompting removal of `.failing`.
    it.failing('does not let a registrant choose their own role [bug #01]', async () => {
      usersService.findOne.mockResolvedValue(null);
      usersService.create.mockImplementation(async (dto: any) => ({
        id: 3,
        username: dto.username,
        name: dto.name,
        role: dto.role ?? UserRole.USER,
      }));

      await service.register({ username: 'evil', password: 'pw', role: UserRole.ADMIN });

      const createdWith = usersService.create.mock.calls[0][0];
      expect(createdWith.role).not.toBe(UserRole.ADMIN);
    });
  });
});
