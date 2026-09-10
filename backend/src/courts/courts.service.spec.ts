import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CourtsService } from './courts.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

describe('CourtsService (unit)', () => {
  let service: CourtsService;
  let bookings: { find: jest.Mock };

  beforeEach(async () => {
    bookings = { find: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourtsService,
        { provide: getRepositoryToken(Booking), useValue: bookings },
      ],
    }).compile();

    service = module.get<CourtsService>(CourtsService);
  });

  it('findAll returns the four seeded courts', async () => {
    const courts = await service.findAll();
    expect(courts).toHaveLength(4);
    expect(courts.map((c) => c.id)).toEqual([1, 2, 3, 4]);
  });

  describe('getAvailability', () => {
    it('groups bookings under their court and maps time_in to start_time', async () => {
      bookings.find.mockResolvedValue([
        { booking_id: 1, court: 1, time_in: '10:00', time_out: '11:00', status: BookingStatus.PENDING },
      ]);

      const result = await service.getAvailability('2026-09-10');

      const court1 = result.find((c) => c.id === 1);
      expect(court1.bookings).toEqual([
        { id: 1, start_time: '10:00', end_time: '11:00', status: BookingStatus.PENDING },
      ]);
      expect(result.find((c) => c.id === 2).bookings).toEqual([]);
    });

    it('excludes CANCELLED bookings from availability', async () => {
      bookings.find.mockResolvedValue([
        { booking_id: 2, court: 3, time_in: '09:00', time_out: '10:00', status: BookingStatus.CANCELLED },
      ]);

      const result = await service.getAvailability('2026-09-10');
      expect(result.find((c) => c.id === 3).bookings).toEqual([]);
    });
  });
});
