import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CronService } from './cron.service';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

describe('CronService (unit)', () => {
  let service: CronService;
  let repo: { find: jest.Mock; save: jest.Mock };

  beforeEach(async () => {
    repo = { find: jest.fn().mockResolvedValue([]), save: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [CronService, { provide: getRepositoryToken(Booking), useValue: repo }],
    }).compile();

    service = module.get<CronService>(CronService);

    // Fix "now" at a safe mid-day time to keep the assertions deterministic.
    jest.useFakeTimers().setSystemTime(new Date('2026-09-10T13:00:00'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('cancels stale PENDING bookings and completes stale CHECKED_IN bookings', async () => {
    const stalePending = { id: 1, status: BookingStatus.PENDING };
    const staleCheckedIn = { id: 2, status: BookingStatus.CHECKED_IN };

    // First find() call → stale PENDING list, second → stale CHECKED_IN list.
    repo.find.mockResolvedValueOnce([stalePending]).mockResolvedValueOnce([staleCheckedIn]);

    await service.handleCron();

    expect(stalePending.status).toBe(BookingStatus.CANCELLED);
    expect(staleCheckedIn.status).toBe(BookingStatus.COMPLETED);
    expect(repo.save).toHaveBeenCalledTimes(2);
  });

  it('does not save anything when there is nothing stale', async () => {
    repo.find.mockResolvedValue([]);
    await service.handleCron();
    expect(repo.save).not.toHaveBeenCalled();
  });
});
