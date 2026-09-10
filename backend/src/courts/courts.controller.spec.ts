import { Test, TestingModule } from '@nestjs/testing';
import { CourtsController } from './courts.controller';
import { CourtsService } from './courts.service';

describe('CourtsController (unit)', () => {
  let controller: CourtsController;
  let service: { getAvailability: jest.Mock };

  beforeEach(async () => {
    service = { getAvailability: jest.fn().mockResolvedValue([]) };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CourtsController],
      providers: [{ provide: CourtsService, useValue: service }],
    }).compile();

    controller = module.get<CourtsController>(CourtsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('passes the requested date through to the service', async () => {
    await controller.getAvailability('2026-09-10');
    expect(service.getAvailability).toHaveBeenCalledWith('2026-09-10');
  });

  it('defaults to today when no date is supplied', async () => {
    await controller.getAvailability(undefined as unknown as string);
    const today = new Date().toISOString().split('T')[0];
    expect(service.getAvailability).toHaveBeenCalledWith(today);
  });
});
