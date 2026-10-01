import { Test, TestingModule } from '@nestjs/testing';
import { CronService } from './cron.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';

describe('CronService', () => {
  let service: CronService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(Student), useValue: {} }
      ],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});