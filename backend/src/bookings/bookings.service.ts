import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';
import { dbMutex } from '../utils/mutex';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createBooking(stu_id: string, courtId: number, date: string, startTime: string) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1).toString().padStart(2, '0');
    const endTime = `${endHours}:${minutes.toString().padStart(2, '0')}:00`;

    // Use Asia/Bangkok for today's date
    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
    if (date !== today) {
      throw new BadRequestException('Day-by-day policy: You can only book courts for today.');
    }

    const student = await this.studentRepository.findOneBy({ stu_id });
    if (!student) throw new NotFoundException('Student not found');
    
    // Auto-unban and check ban status
    const now = new Date();
    if (student.banned_until) {
      if (now < new Date(student.banned_until)) {
        throw new BadRequestException('Your account is currently banned from booking courts.');
      } else {
        // Reset ban
        student.banned_until = null;
        student.strikes = 0;
        await this.studentRepository.save(student);
      }
    }
    
    // Fallback admin logic if admin_id is required
    let admin_id = 'A001';
    const defaultAdmin = await this.adminRepository.findOneBy({ admin_id });
    if (defaultAdmin) admin_id = defaultAdmin.admin_id;

    const release = await dbMutex.acquire();
    try {
      // Use SERIALIZABLE transaction instead of pessimistic_write for SQLite compatibility
      return await this.bookingsRepository.manager.transaction('SERIALIZABLE', async (transactionalEntityManager) => {
        const existingUserBooking = await transactionalEntityManager.findOne(Booking, {
          where: [
            { stu_id, booking_date: date, status: BookingStatus.PENDING },
            { stu_id, booking_date: date, status: BookingStatus.CHECKED_IN },
            { stu_id, booking_date: date, status: BookingStatus.COMPLETED }
          ]
        });

        if (existingUserBooking) {
          throw new BadRequestException('You already have an active booking. Please complete or cancel it first.');
        }

        // Check overlapping time intervals (time_in < endTime AND time_out > startTime)
        const overlappingBooking = await transactionalEntityManager.createQueryBuilder(Booking, 'booking')
          .where('booking.court = :courtId', { courtId })
          .andWhere('booking.booking_date = :date', { date })
          .andWhere('booking.status IN (:...statuses)', { 
            statuses: [BookingStatus.PENDING, BookingStatus.CHECKED_IN, BookingStatus.COMPLETED] 
          })
          .andWhere('booking.time_in < :endTime AND booking.time_out > :startTime', { endTime, startTime })
          .getOne();

        if (overlappingBooking) {
          throw new BadRequestException('This court is already booked at this time.');
        }

        const newBooking = transactionalEntityManager.create(Booking, {
          stu_id,
          court: courtId,
          booking_date: date,
          time_in: startTime,
          time_out: endTime,
          status: BookingStatus.PENDING,
          admin_id,
        });

        return await transactionalEntityManager.save(newBooking);
      });
    } finally {
      release();
    }
  }

  async getMyBookings(stu_id: string) {
    const bookings = await this.bookingsRepository.find({
      where: { stu_id },
      order: { booking_date: 'DESC', time_in: 'DESC' },
    });
    return bookings.map(b => ({ ...b, id: b.booking_id }));
  }

  async getAllBookings(date?: string) {
    const whereCondition = date ? { booking_date: date } : {};
    const bookings = await this.bookingsRepository.find({
      where: whereCondition,
      relations: { student: true, admin: true },
      order: { booking_date: 'DESC', time_in: 'DESC' },
    });
    return bookings.map(b => ({ ...b, id: b.booking_id }));
  }

  async getNotifications() {
    const notifications = await this.bookingsRepository.find({
      where: [
        { status: BookingStatus.PENDING },
        { status: BookingStatus.CANCELLED }
      ],
      relations: { student: true },
      order: { booking_id: 'DESC' },
      take: 20,
    });
    return notifications.map(b => ({ ...b, id: b.booking_id }));
  }

  async checkIn(bookingId: number, stu_id: string, courtId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { booking_id: bookingId, stu_id, court: courtId }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or mismatch with this court.');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot check in. Status is currently ${booking.status}`);
    }

    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.time_in}`);
    const allowedCheckInTime = new Date(bookingDateTime.getTime() - 15 * 60 * 1000); // 15 mins before

    if (now < allowedCheckInTime) {
      throw new BadRequestException('You cannot check in more than 15 minutes before the booking time starts.');
    }

    booking.status = BookingStatus.CHECKED_IN;
    return this.bookingsRepository.save(booking);
  }

  async cancelBooking(bookingId: number, stu_id: string) {
    const release = await dbMutex.acquire();
    try {
      return await this.bookingsRepository.manager.transaction(async (manager) => {
        const booking = await manager.findOne(Booking, {
          where: { booking_id: bookingId, stu_id }
        });

        if (!booking) {
          throw new NotFoundException('Booking not found');
        }

        if (booking.status !== BookingStatus.PENDING) {
          throw new BadRequestException(`Cannot cancel. Status is currently ${booking.status}`);
        }

        // Timezone issue in check: need to parse using local time if booking_date/time_in are local, 
        // but let's keep it simple and just use the same logic, or fix it to Asia/Bangkok
        const now = new Date();
        // Date in DB is YYYY-MM-DD and time is HH:MM:00. We can construct a Date in local timezone or use string comparison.
        const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
        const bookingDateTime = new Date(`${booking.booking_date}T${booking.time_in}`); // this is parsed as local time by Date constructor
        // Actually we should compare properly:
        
        const deadline = new Date(bookingDateTime.getTime() + 15 * 60 * 1000); // 15 mins after start

        // Compare bangkok time vs booking time (assuming booking is in Bangkok time)
        if (bangkokTime >= deadline) {
          // Late cancellation - add a strike
          const student = await manager.findOneBy(Student, { stu_id });
          if (student) {
            student.strikes += 1;
            if (student.strikes >= 2) {
              student.banned_until = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ban for 24 hours
            }
            await manager.save(Student, student);
            Logger.log(`[Strike Added] Late cancel for Booking ID: ${bookingId}. Strikes: ${student.strikes}`, 'BookingsService');
          }
        }

        booking.status = BookingStatus.CANCELLED;
        Logger.log(`[Booking Cancelled] Booking ID: ${bookingId}, Student ID: ${stu_id}`, 'BookingsService');
        return await manager.save(Booking, booking);
      });
    } finally {
      release();
    }
  }

  async finishBooking(bookingId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { booking_id: bookingId }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(`Cannot finish. Status is currently ${booking.status}`);
    }

    booking.status = BookingStatus.COMPLETED;
    Logger.log(`[Booking Finished Early] Booking ID: ${bookingId}`, 'BookingsService');
    return this.bookingsRepository.save(booking);
  }

  async resetBookings() {
    await this.bookingsRepository.createQueryBuilder().delete().execute();
    return { message: 'Database reset successfully. All bookings have been cleared.' };
  }
}
