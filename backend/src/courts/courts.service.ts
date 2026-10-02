import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Court } from './entities/court.entity';

@Injectable()
export class CourtsService implements OnModuleInit {
  constructor(
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async onModuleInit() {
    if (this.courtsRepository && typeof this.courtsRepository.count === 'function') {
      const count = await this.courtsRepository.count();
      if (count === 0) {
        const initialCourts = [
          { name: 'Court 1', is_active: true },
          { name: 'Court 2', is_active: true },
          { name: 'Court 3', is_active: true },
          { name: 'Court 4', is_active: true },
        ];
        await this.courtsRepository.save(initialCourts);
      }
    }
  }

  async findAll(): Promise<any[]> {
    const courts = await this.courtsRepository.find({
      order: { id: 'ASC' },
    });
    return courts.map(court => ({
      id: court.id,
      name: court.name,
      status: court.is_active ? 'ACTIVE' : 'MAINTENANCE',
    }));
  }

  async getAvailability(date: string) {
    const courts = await this.findAll();
    const bookings = await this.bookingsRepository.find({
      where: { booking_date: date },
    });

    return courts.map((court) => {
      const courtBookings = bookings.filter(b => b.court === court.id && b.status !== BookingStatus.CANCELLED);
      return {
        ...court,
        bookings: courtBookings.map(b => ({
          id: b.booking_id,
          start_time: b.time_in,
          end_time: b.time_out,
          status: b.status,
        })),
      };
    });
  }
}
