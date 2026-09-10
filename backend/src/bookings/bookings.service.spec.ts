import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';

const today = () => new Date().toISOString().split('T')[0];

function repoMock() {
  return {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    find: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn((x) => Promise.resolve(x)),
  };
}

describe('BookingsService (unit)', () => {
  let service: BookingsService;
  let bookings: ReturnType<typeof repoMock>;
  let students: ReturnType<typeof repoMock>;
  let admins: ReturnType<typeof repoMock>;

  beforeEach(async () => {
    bookings = repoMock();
    students = repoMock();
    admins = repoMock();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: getRepositoryToken(Booking), useValue: bookings },
        { provide: getRepositoryToken(Student), useValue: students },
        { provide: getRepositoryToken(Admin), useValue: admins },
      ],
    }).compile();

    service = module.get<BookingsService>(BookingsService);
  });

  describe('createBooking', () => {
    it('saves a PENDING booking with an end time one hour after the start', async () => {
      bookings.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      students.findOneBy.mockResolvedValue({ stu_id: '64010001' });
      admins.findOneBy.mockResolvedValue({ admin_id: 'A001' });

      await service.createBooking('64010001', 2, today(), '10:00');

      expect(bookings.create).toHaveBeenCalledWith(expect.objectContaining({
        stu_id: '64010001',
        court: 2,
        time_in: '10:00',
        time_out: '11:00:00',
        status: BookingStatus.PENDING,
        admin_id: 'A001',
      }));
      expect(bookings.save).toHaveBeenCalled();
    });

    it('rejects a booking for a day other than today', async () => {
      await expect(service.createBooking('64010001', 1, '2000-01-01', '10:00'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects a second active booking for the same student', async () => {
      bookings.findOne.mockResolvedValueOnce({ booking_id: 1, status: BookingStatus.PENDING });
      await expect(service.createBooking('64010001', 1, today(), '10:00'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects an overlapping booking on the same court/time', async () => {
      bookings.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ booking_id: 9, status: BookingStatus.PENDING });
      await expect(service.createBooking('64010001', 1, today(), '10:00'))
        .rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws NotFound when the student does not exist', async () => {
      bookings.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);
      students.findOneBy.mockResolvedValue(null);
      await expect(service.createBooking('nope', 1, today(), '10:00'))
        .rejects.toBeInstanceOf(NotFoundException);
    });

    // BUG #06 (fixed): the 23:00 start used to overflow to an invalid 24:00:00 end
    // time. The service now rejects any start hour >= 23 before creating the booking.
    it('rejects a 23:00 start instead of producing an invalid 24:00:00 end time', async () => {
      await expect(service.createBooking('64010001', 1, today(), '23:00'))
        .rejects.toBeInstanceOf(BadRequestException);
      expect(bookings.create).not.toHaveBeenCalled();
    });

    it('rejects a malformed start time', async () => {
      await expect(service.createBooking('64010001', 1, today(), 'not-a-time'))
        .rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('checkIn', () => {
    it('throws NotFound when the booking is missing', async () => {
      bookings.findOne.mockResolvedValue(null);
      await expect(service.checkIn(1, '64010001', 1)).rejects.toBeInstanceOf(NotFoundException);
    });

    it('rejects check-in when the status is not PENDING', async () => {
      bookings.findOne.mockResolvedValue({ status: BookingStatus.CHECKED_IN });
      await expect(service.checkIn(1, '64010001', 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('rejects check-in before the booking start time', async () => {
      bookings.findOne.mockResolvedValue({
        status: BookingStatus.PENDING, booking_date: today(), time_in: '23:59:00',
      });
      await expect(service.checkIn(1, '64010001', 1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('flips the status to CHECKED_IN on success', async () => {
      const booking: any = { status: BookingStatus.PENDING, booking_date: '2000-01-01', time_in: '10:00:00' };
      bookings.findOne.mockResolvedValue(booking);
      await service.checkIn(1, '64010001', 1);
      expect(booking.status).toBe(BookingStatus.CHECKED_IN);
      expect(bookings.save).toHaveBeenCalledWith(booking);
    });
  });

  describe('cancelBooking', () => {
    it('rejects cancelling a non-PENDING booking', async () => {
      bookings.findOne.mockResolvedValue({ status: BookingStatus.COMPLETED });
      await expect(service.cancelBooking(1, '64010001')).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the status to CANCELLED on success', async () => {
      const booking: any = { status: BookingStatus.PENDING };
      bookings.findOne.mockResolvedValue(booking);
      await service.cancelBooking(1, '64010001');
      expect(booking.status).toBe(BookingStatus.CANCELLED);
    });
  });

  describe('finishBooking', () => {
    it('rejects finishing a booking that is not CHECKED_IN', async () => {
      bookings.findOne.mockResolvedValue({ status: BookingStatus.PENDING });
      await expect(service.finishBooking(1)).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sets the status to COMPLETED on success', async () => {
      const booking: any = { status: BookingStatus.CHECKED_IN };
      bookings.findOne.mockResolvedValue(booking);
      await service.finishBooking(1);
      expect(booking.status).toBe(BookingStatus.COMPLETED);
    });
  });
});
