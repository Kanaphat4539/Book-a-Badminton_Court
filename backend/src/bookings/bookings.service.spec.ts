import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from './bookings.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ { provide: getRepositoryToken(Admin), useValue: {} }, 
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: {} },
        { provide: getRepositoryToken(Student), useValue: {} }
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
