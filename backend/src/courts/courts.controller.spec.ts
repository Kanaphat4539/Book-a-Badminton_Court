import { Test, TestingModule } from '@nestjs/testing';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';

describe('CourtsController (unit)', () => {
  let controller: CourtsController;
  let service: jest.Mocked<Pick<CourtsService, 'getAvailability'>>;

  beforeEach(async () => {
    service = { getAvailability: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [{ provide: CourtsService, useValue: service }],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it('forwards the provided date', async () => {
    await controller.getAvailability('2026-09-10');
    expect(service.getAvailability).toHaveBeenCalledWith('2026-09-10');
  });

  it("defaults to today's date when none is provided", async () => {
    const today = new Date().toISOString().split('T')[0];
    await controller.getAvailability(undefined as unknown as string);
    expect(service.getAvailability).toHaveBeenCalledWith(today);
  });
});
