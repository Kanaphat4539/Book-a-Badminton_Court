import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    const now = new Date();
    // Current date string in YYYY-MM-DD
    const currentDate = now.toISOString().split('T')[0];
    
    // Time 15 minutes ago
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
    const fifteenMinsAgoStr = fifteenMinsAgo.toTimeString().split(' ')[0];

    // Time 1 hour ago (for completing)
    const oneHourAgo = new Date(now.getTime() - 60 * 60000);
    const oneHourAgoStr = oneHourAgo.toTimeString().split(' ')[0];

    // 1. Cancel PENDING bookings where time_in was more than 15 mins ago
    const pendingBookings = await this.bookingsRepository.find({
      where: {
        status: BookingStatus.PENDING,
        booking_date: currentDate,
        time_in: LessThan(fifteenMinsAgoStr),
      },
      relations: { student: true },
    });

    if (pendingBookings.length > 0) {
      for (const booking of pendingBookings) {
        booking.status = BookingStatus.CANCELLED;
        if (booking.student) {
          booking.student.strikes += 1;
          if (booking.student.strikes >= 2) {
             booking.student.banned_until = new Date(now.getTime() + 24 * 60 * 60 * 1000); // Ban for 24 hours
          }
          await this.studentRepository.save(booking.student);
          this.logger.debug(`[Strike Added] Auto-cancel for Booking ID: ${booking.booking_id}. Strikes: ${booking.student.strikes}`);
        }
      }
      await this.bookingsRepository.save(pendingBookings);
      this.logger.debug(`Cancelled ${pendingBookings.length} bookings.`);
    }

    // 2. Complete CHECKED_IN bookings where time_in was more than 1 hour ago
    const checkedInBookings = await this.bookingsRepository.find({
      where: {
        status: BookingStatus.CHECKED_IN,
        booking_date: currentDate,
        time_in: LessThan(oneHourAgoStr),
      }
    });

    if (checkedInBookings.length > 0) {
      for (const booking of checkedInBookings) {
        booking.status = BookingStatus.COMPLETED;
      }
      await this.bookingsRepository.save(checkedInBookings);
      this.logger.debug(`Completed ${checkedInBookings.length} bookings.`);
    }
  }
}
