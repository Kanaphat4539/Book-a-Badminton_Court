import { Test, TestingModule } from '@nestjs/testing';
import { CourtsService } from './courts.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Court } from './entities/court.entity';

describe('CourtsService', () => {
  let service: CourtsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: getRepositoryToken(Court), useValue: {} }
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});