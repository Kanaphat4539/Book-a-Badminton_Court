import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Court } from '../courts/entities/court.entity';
import { User } from '../users/entities/user.entity';

function repoMock() {
  return {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve({ id: 1, ...x })),
    createQueryBuilder: jest.fn(),
  };
}

const todayStr = () => new Date().toISOString().split('T')[0];

describe('BookingsService (unit)', () => {
  let service: BookingsService;
  let bookings: ReturnType<typeof repoMock>;
  let courts: ReturnType<typeof repoMock>;
  let users: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    bookings = repoMock();
    courts = repoMock();
    users = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookings },
        { provide: getRepositoryToken(Court), useValue: courts },
        { provide: getRepositoryToken(User), useValue: users },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createBooking', () => {
    it('creates a booking with end time one hour after start', async () => {
      bookings.findOne.mockResolvedValue(null); // no active booking, no overlap
      courts.findOneBy.mockResolvedValue({ id: 2, name: 'Court 2' });
      users.findOneBy.mockResolvedValue({ id: 5, username: 'u' });

      await service.createBooking(5, 2, todayStr(), '10:00');

      const created = bookings.create.mock.calls[0][0];
      expect(created.start_time).toBe('10:00');
      expect(created.end_time).toBe('11:00:00');
      expect(created.status).toBe(BookingStatus.PENDING);
      expect(bookings.save).toHaveBeenCalled();
    });

    it('rejects a booking for a day that is not today', async () => {
      await expect(service.createBooking(5, 2, '2020-01-01', '10:00')).rejects.toBeInstanceOf(
        BadRequestException,
      );
    });

    it('rejects when the user already has an active booking', async () => {
      bookings.findOne.mockResolvedValueOnce({ id: 99, status: BookingStatus.PENDING });

      await expect(service.createBooking(5, 2, todayStr(), '10:00')).rejects.toThrow(
        /already have an active booking/i,
      );
    });

    it('rejects when the court is already booked at that time', async () => {
      bookings.findOne
        .mockResolvedValueOnce(null) // user has no active booking
        .mockResolvedValueOnce({ id: 42, status: BookingStatus.PENDING }); // overlap found

      await expect(service.createBooking(5, 2, todayStr(), '10:00')).rejects.toThrow(
        /already booked/i,
      );
    });

    it('throws NotFoundException when the court does not exist', async () => {
      bookings.findOne.mockResolvedValue(null);
      courts.findOneBy.mockResolvedValue(null);

      await expect(service.createBooking(5, 2, todayStr(), '10:00')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws NotFoundException when the user does not exist', async () => {
      bookings.findOne.mockResolvedValue(null);
      courts.findOneBy.mockResolvedValue({ id: 2 });
      users.findOneBy.mockResolvedValue(null);

      await expect(service.createBooking(5, 2, todayStr(), '10:00')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    // KNOWN BUG (see TESTING.md #06): the 23:00 slot yields "24:00:00", an invalid time.
    // `it.failing` documents the CORRECT behavior and stays green while the bug exists;
    // once the end-time calc is bounded this will start failing, prompting removal of `.failing`.
    it.failing('does not produce an invalid 24:00:00 end time for the 23:00 slot [bug #06]', async () => {
      bookings.findOne.mockResolvedValue(null);
      courts.findOneBy.mockResolvedValue({ id: 2 });
      users.findOneBy.mockResolvedValue({ id: 5 });

      await service.createBooking(5, 2, todayStr(), '23:00');

      const created = bookings.create.mock.calls[0][0];
      expect(created.end_time).not.toBe('24:00:00');
    });
  });

  describe('checkIn', () => {
    it('throws NotFoundException when there is no matching booking', async () => {
      bookings.findOne.mockResolvedValue(null);
      await expect(service.checkIn(1, 5, 2)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects when the booking is not PENDING', async () => {
      bookings.findOne.mockResolvedValue({ id: 1, status: BookingStatus.COMPLETED });
      await expect(service.checkIn(1, 5, 2)).rejects.toThrow(/cannot check in/i);
    });

    it('flips status to CHECKED_IN on the success path', async () => {
      bookings.findOne.mockResolvedValue({
        id: 1,
        status: BookingStatus.PENDING,
        booking_date: '2000-01-01',
        start_time: '00:00:00',
      });
      const saved = await service.checkIn(1, 5, 2);
      expect(saved.status).toBe(BookingStatus.CHECKED_IN);
    });
  });

  describe('cancelBooking', () => {
    it('throws NotFoundException when the booking is missing', async () => {
      bookings.findOne.mockResolvedValue(null);
      await expect(service.cancelBooking(1, 5)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects cancelling a non-PENDING booking', async () => {
      bookings.findOne.mockResolvedValue({ id: 1, status: BookingStatus.CHECKED_IN });
      await expect(service.cancelBooking(1, 5)).rejects.toThrow(/cannot cancel/i);
    });

    it('sets status to CANCELLED on success', async () => {
      bookings.findOne.mockResolvedValue({ id: 1, status: BookingStatus.PENDING });
      const saved = await service.cancelBooking(1, 5);
      expect(saved.status).toBe(BookingStatus.CANCELLED);
    });
  });
});
