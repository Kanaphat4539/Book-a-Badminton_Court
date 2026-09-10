import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { Booking } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Student, Admin])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
