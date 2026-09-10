import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController (unit)', () => {
  let controller: AuthController;
  let service: { validateUser: jest.Mock; login: jest.Mock; register: jest.Mock };

  beforeEach(async () => {
    service = { validateUser: jest.fn(), login: jest.fn(), register: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: service }],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('logs in a valid user', async () => {
    service.validateUser.mockResolvedValue({ id: 1, username: 'alice' });
    service.login.mockResolvedValue({ access_token: 'tok' });

    const result = await controller.login({ username: 'alice', password: 'pw' });

    expect(service.validateUser).toHaveBeenCalledWith('alice', 'pw');
    expect(result.access_token).toBe('tok');
  });

  it('throws UnauthorizedException on invalid credentials', async () => {
    service.validateUser.mockResolvedValue(null);
    await expect(controller.login({ username: 'x', password: 'y' })).rejects.toBeInstanceOf(
      UnauthorizedException,
    );
  });

  it('delegates registration to the service', async () => {
    service.register.mockResolvedValue({ access_token: 'tok' });
    await controller.register({ username: 'newbie', password: 'pw' });
    expect(service.register).toHaveBeenCalledWith({ username: 'newbie', password: 'pw' });
  });
});
