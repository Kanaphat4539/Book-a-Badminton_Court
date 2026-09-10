import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourtsService } from './courts.service';
import { Court } from './entities/court.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

describe('CourtsService (unit)', () => {
  let service: CourtsService;
  let courts: { find: jest.Mock; count: jest.Mock; save: jest.Mock };
  let bookings: { find: jest.Mock };

  beforeEach(async () => {
    courts = { find: jest.fn(), count: jest.fn(), save: jest.fn() };
    bookings = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: getRepositoryToken(Court), useValue: courts },
        { provide: getRepositoryToken(Booking), useValue: bookings },
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAvailability', () => {
    it('groups bookings under their court and excludes CANCELLED ones', async () => {
      courts.find.mockResolvedValue([
        { id: 1, name: 'Court 1' },
        { id: 2, name: 'Court 2' },
      ]);
      bookings.find.mockResolvedValue([
        { id: 10, start_time: '10:00:00', end_time: '11:00:00', status: BookingStatus.PENDING, court: { id: 1 } },
        { id: 11, start_time: '12:00:00', end_time: '13:00:00', status: BookingStatus.CANCELLED, court: { id: 1 } },
        { id: 12, start_time: '09:00:00', end_time: '10:00:00', status: BookingStatus.CHECKED_IN, court: { id: 2 } },
      ]);

      const result = await service.getAvailability('2026-09-10');

      const court1 = result.find((c: any) => c.id === 1);
      const court2 = result.find((c: any) => c.id === 2);

      expect(court1.bookings).toHaveLength(1); // CANCELLED excluded
      expect(court1.bookings[0].id).toBe(10);
      expect(court2.bookings).toHaveLength(1);
      expect(court2.bookings[0].status).toBe(BookingStatus.CHECKED_IN);
    });

    it('returns every court even when it has no bookings', async () => {
      courts.find.mockResolvedValue([{ id: 1, name: 'Court 1' }]);
      bookings.find.mockResolvedValue([]);

      const result = await service.getAvailability('2026-09-10');

      expect(result).toHaveLength(1);
      expect(result[0].bookings).toEqual([]);
    });
  });
});
