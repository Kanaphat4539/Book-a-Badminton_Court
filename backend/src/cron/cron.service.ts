import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { dbMutex } from '../utils/mutex';
import { getBookingTimes } from '../bookings/booking-time';

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

    const release = await dbMutex.acquire();
    try {
      await this.bookingsRepository.manager.transaction(async (manager) => {
        // 1. Expire pending reservations using their own grace period and round end.
        const pendingBookings = await manager.find(Booking, {
          where: { status: BookingStatus.PENDING },
          relations: { student: true },
        });

        if (pendingBookings.length > 0) {
          for (const booking of pendingBookings) {
            const { deadline, end } = getBookingTimes(booking);

            if (now.getTime() >= Math.min(deadline, end)) {
              booking.status = BookingStatus.CANCELLED;
              if (booking.student && deadline <= end) {
                // Refetch student to get the latest strikes count in case of multiple missed bookings for same user
                const student = await manager.findOneBy(Student, { stu_id: booking.student.stu_id });
                if (student) {
                  student.strikes += 1;
                  if (student.strikes >= 2) {
                     student.banned_until = new Date(now.getTime() + 24 * 60 * 60 * 1000);
                  }
                  await manager.save(Student, student);
                  this.logger.debug(`[Strike Added] Auto-cancel for Booking ID: ${booking.booking_id}. Strikes: ${student.strikes}`);
                }
              }
              await manager.save(Booking, booking);
            }
          }
        }

        // 2. Complete at the original round end, even for bookings made mid-round.
        const checkedInBookings = await manager.find(Booking, {
          where: { status: BookingStatus.CHECKED_IN }
        });

        if (checkedInBookings.length > 0) {
          for (const booking of checkedInBookings) {
            const { end: completeTime } = getBookingTimes(booking);

            if (now.getTime() >= completeTime) {
              booking.status = BookingStatus.COMPLETED;
              await manager.save(Booking, booking);
            }
          }
        }
        
        // 3. Auto-unban students whose ban expired
        const expiredBans = await manager.find(Student, {
          where: {
            banned_until: LessThanOrEqual(now)
          }
        });
        if (expiredBans.length > 0) {
          for (const student of expiredBans) {
            student.banned_until = null;
            student.strikes = 0;
            await manager.save(Student, student);
            this.logger.debug(`[Unbanned] Student ID: ${student.stu_id}`);
          }
        }
      });
    } finally {
      release();
    }
  }
}
