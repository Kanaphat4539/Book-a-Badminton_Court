import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CourtsService } from './courts.service';
import { CourtsController } from './courts.controller';
import { Booking } from '../bookings/entities/booking.entity';
import { Court } from './entities/court.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Court])],
  controllers: [CourtsController],
  providers: [CourtsService],
  exports: [CourtsService],
})
export class CourtsModule {}
