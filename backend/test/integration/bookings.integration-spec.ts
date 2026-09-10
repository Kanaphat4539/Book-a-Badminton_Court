import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException } from '@nestjs/common';
import { BookingsService } from '../../src/bookings/bookings.service';
import { CourtsService } from '../../src/courts/courts.service';
import { Booking, BookingStatus } from '../../src/bookings/entities/booking.entity';
import { Court } from '../../src/courts/entities/court.entity';
import { User } from '../../src/users/entities/user.entity';

// Integration: real TypeORM + in-memory SQLite, real service <-> repository <-> entity
// wiring. No HTTP layer, no mocks.
describe('Bookings integration (sqlite :memory:)', () => {
  let moduleRef: TestingModule;
  let bookingsService: BookingsService;
  let courtsService: CourtsService;
  let bookingRepo: Repository<Booking>;
  let courtRepo: Repository<Court>;
  let userRepo: Repository<User>;

  let user: User;
  const today = new Date().toISOString().split('T')[0];

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'better-sqlite3',
          database: ':memory:',
          entities: [User, Court, Booking],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Booking, Court, User]),
      ],
      providers: [BookingsService, CourtsService],
    }).compile();

    bookingsService = moduleRef.get(BookingsService);
    courtsService = moduleRef.get(CourtsService);
    bookingRepo = moduleRef.get(getRepositoryToken(Booking));
    courtRepo = moduleRef.get(getRepositoryToken(Court));
    userRepo = moduleRef.get(getRepositoryToken(User));
  });

  afterAll(async () => {
    await moduleRef.close();
  });

  beforeEach(async () => {
    // Clean slate per test.
    await bookingRepo.createQueryBuilder().delete().execute();
    await courtRepo.createQueryBuilder().delete().execute();
    await userRepo.createQueryBuilder().delete().execute();

    user = await userRepo.save(userRepo.create({ username: 'stud', name: 'Student', password: 'x' }));
    await courtRepo.save([
      courtRepo.create({ id: 1, name: 'Court 1' }),
      courtRepo.create({ id: 2, name: 'Court 2' }),
    ]);
  });

  it('persists a booking row that can be read back', async () => {
    const created = await bookingsService.createBooking(user.id, 1, today, '10:00');

    const found = await bookingRepo.findOne({ where: { id: created.id }, relations: { court: true, user: true } });
    expect(found).toBeTruthy();
    expect(found!.status).toBe(BookingStatus.PENDING);
    expect(found!.court.id).toBe(1);
    expect(found!.user.id).toBe(user.id);
    expect(found!.end_time).toBe('11:00:00');
  });

  it('rejects a second active booking for the same user', async () => {
    await bookingsService.createBooking(user.id, 1, today, '10:00');
    await expect(bookingsService.createBooking(user.id, 2, today, '12:00')).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(await bookingRepo.count()).toBe(1);
  });

  it('rejects double-booking the same court/time for different users', async () => {
    const other = await userRepo.save(userRepo.create({ username: 'other', name: 'Other', password: 'x' }));
    await bookingsService.createBooking(user.id, 1, today, '10:00');
    await expect(bookingsService.createBooking(other.id, 1, today, '10:00')).rejects.toThrow(
      /already booked/i,
    );
  });

  it('reflects a new booking in court availability and hides it after cancel', async () => {
    const created = await bookingsService.createBooking(user.id, 1, today, '10:00');

    let avail = await courtsService.getAvailability(today);
    let court1 = avail.find((c: any) => c.id === 1);
    expect(court1.bookings).toHaveLength(1);

    await bookingsService.cancelBooking(created.id, user.id);

    avail = await courtsService.getAvailability(today);
    court1 = avail.find((c: any) => c.id === 1);
    expect(court1.bookings).toHaveLength(0); // CANCELLED is excluded
  });

  it('runs the full lifecycle create -> check-in and persists each transition', async () => {
    const created = await bookingsService.createBooking(user.id, 1, today, '10:00');
    expect((await bookingRepo.findOneBy({ id: created.id }))!.status).toBe(BookingStatus.PENDING);

    await bookingsService.checkIn(created.id, user.id, 1);
    expect((await bookingRepo.findOneBy({ id: created.id }))!.status).toBe(BookingStatus.CHECKED_IN);
  });
});
