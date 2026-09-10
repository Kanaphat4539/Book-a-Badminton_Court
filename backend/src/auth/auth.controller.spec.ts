import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;
  let authService: jest.Mocked<Pick<AuthService, 'validateUser' | 'login' | 'register'>>;

  beforeEach(async () => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
      register: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authService }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  describe('login', () => {
    it('throws Unauthorized when credentials are invalid', async () => {
      authService.validateUser.mockResolvedValue(null);
      await expect(controller.login({ username: 'x', password: 'y' }))
        .rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('returns a token when credentials are valid', async () => {
      const user = { stu_id: '64010001', role: 'STUDENT' };
      authService.validateUser.mockResolvedValue(user);
      authService.login.mockResolvedValue({ access_token: 't', user: {} as any });

      const res = await controller.login({ username: 'stu', password: 'pw' });

      expect(authService.login).toHaveBeenCalledWith(user);
      expect(res.access_token).toBe('t');
    });
  });

  it('delegates register to the service', async () => {
    const body = { username: 'new', email: 'new@kmitl.ac.th' };
    authService.register.mockResolvedValue({ access_token: 't', user: {} as any });
    await controller.register(body);
    expect(authService.register).toHaveBeenCalledWith(body);
  });
});
