import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CronService } from './cron.service';
import { Booking } from '../bookings/entities/booking.entity';
import { Student } from '../users/entities/student.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Student])],
  providers: [CronService]
})
export class CronModule {}
