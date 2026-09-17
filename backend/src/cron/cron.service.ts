import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { dbMutex } from '../utils/mutex';

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
    // We should use Asia/Bangkok time
    const now = new Date();
    // format as YYYY-MM-DD in Asia/Bangkok
    const currentDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
    
    // Convert current time to Asia/Bangkok to find 15 mins ago in local time
    const bangkokTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Bangkok' }));
    
    const fifteenMinsAgo = new Date(bangkokTime.getTime() - 15 * 60000);
    const fifteenMinsAgoStr = fifteenMinsAgo.toTimeString().split(' ')[0];

    const oneHourAgo = new Date(bangkokTime.getTime() - 60 * 60000);
    const oneHourAgoStr = oneHourAgo.toTimeString().split(' ')[0];

    const release = await dbMutex.acquire();
    try {
      await this.bookingsRepository.manager.transaction(async (manager) => {
        // 1. Cancel PENDING bookings where time_in + 15 mins <= now
        const pendingBookings = await manager.find(Booking, {
          where: { status: BookingStatus.PENDING },
          relations: { student: true },
        });

        if (pendingBookings.length > 0) {
          for (const booking of pendingBookings) {
            // Parse booking time as Bangkok time
            const bookingTimeStr = `${booking.booking_date}T${booking.time_in}+07:00`;
            const bookingTime = new Date(bookingTimeStr).getTime();
            const deadline = bookingTime + 15 * 60000;

            if (now.getTime() >= deadline) {
              booking.status = BookingStatus.CANCELLED;
              if (booking.student) {
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

        // 2. Complete CHECKED_IN bookings where time_in + 1 hour <= now
        const checkedInBookings = await manager.find(Booking, {
          where: { status: BookingStatus.CHECKED_IN }
        });

        if (checkedInBookings.length > 0) {
          for (const booking of checkedInBookings) {
            const bookingTimeStr = `${booking.booking_date}T${booking.time_in}+07:00`;
            const bookingTime = new Date(bookingTimeStr).getTime();
            const completeTime = bookingTime + 60 * 60000;

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
