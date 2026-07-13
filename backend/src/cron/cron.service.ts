import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleCron() {
    this.logger.debug('Running booking cancellation check...');

    const now = new Date();
    // Current date string in YYYY-MM-DD
    const currentDate = now.toISOString().split('T')[0];
    
    // Time 15 minutes ago
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60000);
    const fifteenMinsAgoStr = fifteenMinsAgo.toTimeString().split(' ')[0];

    // Time 1 hour ago (for completing)
    const oneHourAgo = new Date(now.getTime() - 60 * 60000);
    const oneHourAgoStr = oneHourAgo.toTimeString().split(' ')[0];

    // 1. Cancel PENDING bookings where start_time was more than 15 mins ago
    const pendingBookings = await this.bookingsRepository.find({
      where: {
        status: BookingStatus.PENDING,
        booking_date: currentDate,
        start_time: LessThan(fifteenMinsAgoStr),
      }
    });

    if (pendingBookings.length > 0) {
      for (const booking of pendingBookings) {
        booking.status = BookingStatus.CANCELLED;
      }
      await this.bookingsRepository.save(pendingBookings);
      this.logger.debug(`Cancelled ${pendingBookings.length} bookings.`);
    }

    // 2. Complete CHECKED_IN bookings where start_time was more than 1 hour ago
    const checkedInBookings = await this.bookingsRepository.find({
      where: {
        status: BookingStatus.CHECKED_IN,
        booking_date: currentDate,
        start_time: LessThan(oneHourAgoStr),
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
