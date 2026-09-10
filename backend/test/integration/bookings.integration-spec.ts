import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BadRequestException } from '@nestjs/common';
import { BookingsService } from '../../src/bookings/bookings.service';
import { CourtsService } from '../../src/courts/courts.service';
import { Booking, BookingStatus } from '../../src/bookings/entities/booking.entity';
import { Student } from '../../src/users/entities/student.entity';
import { Admin } from '../../src/users/entities/admin.entity';

// Integration: real TypeORM + in-memory SQLite, real service <-> repository <-> entity
// wiring. No HTTP layer, no mocks.
describe('Bookings integration (sqlite :memory:)', () => {
  let moduleRef: TestingModule;
  let bookingsService: BookingsService;
  let courtsService: CourtsService;
  let bookingRepo: Repository<Booking>;
  let studentRepo: Repository<Student>;
  let adminRepo: Repository<Admin>;

  const today = new Date().toISOString().split('T')[0];
  const STU = '64010001';

  const makeStudent = (over: Partial<Student> = {}): Partial<Student> => ({
    stu_id: STU,
    email: 'stud@kmitl.ac.th',
    first_name: 'Stud',
    last_name: 'Ent',
    tel: '0800000000',
    major: 'CS',
    year: 1,
    username: 'stud',
    password: 'x',
    ...over,
  });

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [Admin, Student, Booking],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Booking, Student, Admin]),
      ],
      providers: [BookingsService, CourtsService],
    }).compile();

    bookingsService = moduleRef.get(BookingsService);
    courtsService = moduleRef.get(CourtsService);
    bookingRepo = moduleRef.get(getRepositoryToken(Booking));
    studentRepo = moduleRef.get(getRepositoryToken(Student));
    adminRepo = moduleRef.get(getRepositoryToken(Admin));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    // Clean slate per test (bookings first — they reference student/admin).
    await bookingRepo.createQueryBuilder().delete().execute();
    await studentRepo.createQueryBuilder().delete().execute();
    await adminRepo.createQueryBuilder().delete().execute();

    await adminRepo.save(adminRepo.create({ admin_id: 'A001', username: 'admin', name: 'Admin', password: 'x' }));
    await studentRepo.save(studentRepo.create(makeStudent()));
  });

  it('persists a booking row that can be read back', async () => {
    const created = await bookingsService.createBooking(STU, 1, today, '10:00');

    const found = await bookingRepo.findOneBy({ booking_id: created.booking_id });
    expect(found).toBeTruthy();
    expect(found!.status).toBe(BookingStatus.PENDING);
    expect(found!.court).toBe(1);
    expect(found!.stu_id).toBe(STU);
    expect(found!.time_out).toBe('11:00:00');
  });

  it('rejects a second active booking for the same student', async () => {
    await bookingsService.createBooking(STU, 1, today, '10:00');
    await expect(bookingsService.createBooking(STU, 2, today, '12:00')).rejects.toBeInstanceOf(BadRequestException);
    expect(await bookingRepo.count()).toBe(1);
  });

  it('rejects double-booking the same court/time for different students', async () => {
    await studentRepo.save(studentRepo.create(makeStudent({
      stu_id: '64010002', username: 'other', email: 'other@kmitl.ac.th',
    })));
    await bookingsService.createBooking(STU, 1, today, '10:00');
    await expect(bookingsService.createBooking('64010002', 1, today, '10:00')).rejects.toThrow(/already booked/i);
  });

  it('reflects a new booking in court availability and hides it after cancel', async () => {
    const created = await bookingsService.createBooking(STU, 1, today, '10:00');

    let court1 = (await courtsService.getAvailability(today)).find((c: any) => c.id === 1);
    expect(court1.bookings).toHaveLength(1);

    await bookingsService.cancelBooking(created.booking_id, STU);

    court1 = (await courtsService.getAvailability(today)).find((c: any) => c.id === 1);
    expect(court1.bookings).toHaveLength(0); // CANCELLED is excluded
  });

  it('runs the lifecycle create -> check-in and persists each transition', async () => {
    const created = await bookingsService.createBooking(STU, 1, today, '10:00');
    expect((await bookingRepo.findOneBy({ booking_id: created.booking_id }))!.status).toBe(BookingStatus.PENDING);

    // Force the start time into the past so check-in is allowed regardless of wall clock.
    await bookingRepo.update({ booking_id: created.booking_id }, { time_in: '00:00:00' });
    await bookingsService.checkIn(created.booking_id, STU, 1);

    expect((await bookingRepo.findOneBy({ booking_id: created.booking_id }))!.status).toBe(BookingStatus.CHECKED_IN);
  });
});
