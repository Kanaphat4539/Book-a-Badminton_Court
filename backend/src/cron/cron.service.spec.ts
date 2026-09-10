import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CronService } from './cron.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

describe('CronService (unit)', () => {
  let service: CronService;
  let bookings: { find: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    bookings = { find: jest.fn(), save: jest.fn((x) => Promise.resolve(x)) };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CronService,
        { provide: getRepositoryToken(Booking), useValue: bookings },
      ],
    }).compile();

    service = module.get<CronService>(CronService);
  });

  it('cancels stale PENDING bookings and completes stale CHECKED_IN ones', async () => {
    const pending: any = { booking_id: 1, status: BookingStatus.PENDING };
    const checkedIn: any = { booking_id: 2, status: BookingStatus.CHECKED_IN };

    bookings.find
      .mockResolvedValueOnce([pending])   // stale PENDING query
      .mockResolvedValueOnce([checkedIn]); // stale CHECKED_IN query

    await service.handleCron();

    expect(pending.status).toBe(BookingStatus.CANCELLED);
    expect(checkedIn.status).toBe(BookingStatus.COMPLETED);
    expect(bookings.save).toHaveBeenCalledTimes(2);
  });

  it('does nothing when there are no stale bookings', async () => {
    bookings.find.mockResolvedValue([]);
    await service.handleCron();
    expect(bookings.save).not.toHaveBeenCalled();
  });
});
