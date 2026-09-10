import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

describe('UsersController (unit)', () => {
  let controller: UsersController;
  let service: jest.Mocked<Pick<UsersService, 'findAllStudents' | 'removeStudent' | 'createAdmin'>>;

  beforeEach(async () => {
    service = {
      findAllStudents: jest.fn().mockResolvedValue([]),
      removeStudent: jest.fn(),
      createAdmin: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: service }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('findAll lists students', async () => {
    await controller.findAll();
    expect(service.findAllStudents).toHaveBeenCalled();
  });

  it('remove deletes a student by id', async () => {
    await controller.remove('64010001');
    expect(service.removeStudent).toHaveBeenCalledWith('64010001');
  });

  it('createAdmin forwards the body', async () => {
    const body = { username: 'admin2', name: 'Admin Two', password: 'pw' };
    await controller.createAdmin(body);
    expect(service.createAdmin).toHaveBeenCalledWith(body);
  });
});
