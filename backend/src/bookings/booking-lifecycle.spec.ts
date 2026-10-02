import { Repository } from 'typeorm';
import { BadRequestException, ParseIntPipe } from '@nestjs/common';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { CronService } from '../cron/cron.service';
import { CourtsService } from '../courts/courts.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Court } from '../courts/entities/court.entity';
import { Admin } from '../users/entities/admin.entity';

describe('booking lifecycle (Bangkok time)', () => {
  let rows: Booking[];
  let students: Student[];
  let repository: Repository<Booking>;
  let bookings: BookingsService;
  let cron: CronService;
  const date = '2026-09-18';
  const at = (time: string) => jest.setSystemTime(new Date(`${date}T${time}+07:00`));

  beforeEach(async () => {
    jest.useFakeTimers({
      now: new Date(`${date}T14:00:00+07:00`),
      doNotFake: ['nextTick', 'setImmediate', 'clearImmediate', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance', 'queueMicrotask', 'hrtime'],
    });
    // Only persistence is replaced; exercise real booking, availability and cron services.
    rows = [];
    students = ['00000001', '00000002'].map(stu_id => Object.assign(new Student(), {
        stu_id, email: `${stu_id}@kmitl.ac.th`, first_name: 'Test', last_name: 'User',
        major: 'Engineering', year: 1, username: stu_id, password: 'test', strikes: 0,
        banned_until: null, quota: 1,
    }));
    const matches = (row: object, where: object) => Object.entries(where).every(([key, value]) => (row as Record<string, unknown>)[key] === value);
    const save = async (...args: unknown[]) => {
      const value = args.at(-1) as Booking | Student;
      if (value instanceof Booking && !value.booking_id) {
        value.booking_id = rows.length + 1;
        value.student = students.find(s => s.stu_id === value.stu_id)!;
        rows.push(value);
      }
      return value;
    };
    const query = { where: jest.fn().mockReturnThis(), andWhere: jest.fn().mockReturnThis(), getOne: jest.fn().mockResolvedValue(null) };
    const manager = {
      transaction: async (...args: unknown[]) => (args.at(-1) as (m: unknown) => unknown)(manager),
      findOne: async (_entity: unknown, options: { where: object | object[] }) => rows.find(row =>
        (Array.isArray(options.where) ? options.where : [options.where]).some(where => matches(row, where))),
      getRepository: (entity: unknown) => entity === Student
        ? { findOneBy: async (where: object) => students.find(row => matches(row, where)), save }
        : repository,
      findOneBy: async (_entity: unknown, where: object) => students.find(row => matches(row, where)),
      find: async (entity: unknown, options: { where: object }) => entity === Booking
        ? rows.filter(row => matches(row, options.where))
        : students.filter(s => s.banned_until && s.banned_until <= new Date()),
      create: (_entity: unknown, values: object) => Object.assign(new Booking(), values),
      createQueryBuilder: () => query,
      save,
      getRepository: (entity: unknown) => entity === Student ? studentRepository : repository,
    };
    repository = {
      manager, save,
      findOne: (options: { where: object }) => manager.findOne(Booking, options),
      find: (options: { where: object }) => manager.find(Booking, options),
    } as unknown as Repository<Booking>;
    const studentRepository = { findOneBy: (where: object) => manager.findOneBy(Student, where), save } as unknown as Repository<Student>;
    const adminRepository = { findOneBy: async () => ({ admin_id: 'A001' }) } as unknown as Repository<Admin>;
    bookings = new BookingsService(repository, studentRepository, adminRepository, { findOneBy: async () => ({ id: 1, is_active: true }) } as any);
    cron = new CronService(repository, studentRepository);
  });

  afterEach(async () => {
    jest.useRealTimers();
  });

  it('rejects a malformed finish ID with a client error instead of an internal error', async () => {
    const service = { finishBooking: jest.fn() };
        const controller = new BookingsController(service as unknown as BookingsService);
        await expect(new ParseIntPipe().transform('not-an-id', { type: 'param', metatype: Number, data: 'id' })).rejects.toThrow(BadRequestException);
            expect(service.finishBooking).not.toHaveBeenCalled();
  });

  it('releases a timely cancellation and lets another user play the remainder without an immediate strike', async () => {
    const first = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('15:12:00');
    await bookings.cancelBooking(first.booking_id, '00000001');
    const courtMock = { find: async () => [{ id: 1, name: 'Court 1', is_active: true }] };
    const courts = new CourtsService(courtMock as unknown as Repository<Court>, repository);
    expect((await courts.getAvailability(date))[0].bookings).toEqual([]);
    expect(students[0].strikes).toBe(0);

    at('15:16:00');
    const second = await bookings.createBooking('00000002', 1, date, '15:00:00');
    expect(second.time_out).toBe('16:00:00');
    at('15:17:00');
    await cron.handleCron();
    expect(rows.find(b => b.booking_id === second.booking_id)!.status).toBe(BookingStatus.PENDING);
    expect(students[1].strikes).toBe(0);
    await bookings.checkIn(second.booking_id, '00000002', 1);
    at('15:59:59');
    await cron.handleCron();
    expect(rows.find(b => b.booking_id === second.booking_id)!.status).toBe(BookingStatus.CHECKED_IN);
    at('16:00:00');
    await cron.handleCron();
    expect(rows.find(b => b.booking_id === second.booking_id)!.status).toBe(BookingStatus.COMPLETED);
  });

  it('does not penalize promptly cancelling a booking made after the original grace period', async () => {
    at('13:22:00');
    const booking = await bookings.createBooking('00000001', 1, date, '13:00:00');
    expect(booking.time_out).toBe('14:00:00');
    expect(students[0].quota).toBe(0);
    at('13:23:00');
    await bookings.cancelBooking(booking.booking_id, '00000001');
    expect(students[0].strikes).toBe(0);
    expect(students[0].quota).toBe(1);
    // Same student can re-book on the same day
    const rebooking = await bookings.createBooking('00000001', 2, date, '13:00:00');
    expect(rebooking.booking_id).toBeDefined();
    expect(students[0].quota).toBe(0);
  });

  it('still penalizes an advance reservation once, at the original 15-minute deadline', async () => {
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('15:14:59');
    await cron.handleCron();
    expect(rows.find(b => b.booking_id === booking.booking_id)!.status).toBe(BookingStatus.PENDING);
    at('15:15:00');
    await cron.handleCron();
    await cron.handleCron();
    expect(rows.find(b => b.booking_id === booking.booking_id)!.status).toBe(BookingStatus.CANCELLED);
    expect(students[0].strikes).toBe(1);
    expect(students[0].quota).toBe(0);
    // Student who missed check-in cannot re-book on that day
    await expect(bookings.createBooking('00000001', 2, date, '16:00:00')).rejects.toThrow();
  });

  it('rejects booking an already ended round', async () => {
    at('16:00:00');
    await expect(bookings.createBooking('00000001', 1, date, '15:00:00')).rejects.toThrow();
    expect(rows.length).toBe(0);
  });

  it('gives a mid-round reservation its own 15 minutes, then penalizes a missed check-in once', async () => {
    at('15:16:00');
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('15:30:59');
    await cron.handleCron();
    expect(booking.status).toBe(BookingStatus.PENDING);
    at('15:31:00');
    await expect(bookings.checkIn(booking.booking_id, '00000001', 1)).rejects.toThrow();
    await cron.handleCron();
    await cron.handleCron();
    expect(booking.status).toBe(BookingStatus.CANCELLED);
    expect(students[0].strikes).toBe(1);
  });

  it('does not extend a nearly finished round or penalize less than 15 minutes of grace', async () => {
    at('15:55:00');
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('15:59:59');
    await cron.handleCron();
    expect(booking.status).toBe(BookingStatus.PENDING);
    at('16:00:00');
    await expect(bookings.checkIn(booking.booking_id, '00000001', 1)).rejects.toThrow();
    await cron.handleCron();
    expect(booking.status).toBe(BookingStatus.CANCELLED);
    expect(students[0].strikes).toBe(0);
  });

  it('adds a strike for manual cancellation after the new grace period', async () => {
    at('15:16:00');
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('15:31:00');
    await bookings.cancelBooking(booking.booking_id, '00000001');
    await cron.handleCron();
    expect(students[0].strikes).toBe(1);
  });

  it('retains the original deadline for bookings created before timestamp tracking', async () => {
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    booking.created_at = null;
    at('15:15:00');
    await cron.handleCron();
    expect(booking.status).toBe(BookingStatus.CANCELLED);
    expect(students[0].strikes).toBe(1);
  });

  it('does not expose a student password in admin booking or notification responses', async () => {
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('14:45:00');
    const all = await bookings.getAllBookings();
    expect(JSON.stringify(all)).not.toContain('password');
    rows[0].status = BookingStatus.CANCELLED;
    const notifications = await bookings.getNotifications();
    expect(JSON.stringify(notifications)).not.toContain('password');
    expect(notifications).toHaveLength(0);
  });

  it('allows only one concurrent finish transition', async () => {
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    at('14:45:00');
    await bookings.checkIn(booking.booking_id, '00000001', 1);
    const outcomes = await Promise.allSettled([
      bookings.finishBooking(booking.booking_id),
      bookings.finishBooking(booking.booking_id),
    ]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect(rows[0].status).toBe(BookingStatus.COMPLETED);
  });

  it('allows only one of concurrent check-in and cancel transitions', async () => {
    const booking = await bookings.createBooking('00000001', 1, date, '15:00:00');
    const outcomes = await Promise.allSettled([
      bookings.checkIn(booking.booking_id, '00000001', 1),
      bookings.cancelBooking(booking.booking_id, '00000001'),
    ]);
    expect(outcomes.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect([BookingStatus.CHECKED_IN, BookingStatus.CANCELLED]).toContain(rows[0].status);
  });
});
