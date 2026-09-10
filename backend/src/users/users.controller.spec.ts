import { Test, TestingModule } from '@nestjs/testing';
import { UsersController } from './users.controller';

// On the Guistee branch UsersController exposes no endpoints yet — this only
// guards against the controller failing to instantiate.
describe('UsersController (unit)', () => {
  let controller: UsersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
    }).compile();

    controller = module.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
