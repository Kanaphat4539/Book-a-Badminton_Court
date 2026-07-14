import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Court, CourtStatus } from './entities/court.entity';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class CourtsService implements OnModuleInit {
  constructor(
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async onModuleInit() {
    // Seed courts if empty
    const count = await this.courtsRepository.count();
    if (count === 0) {
      const courts = [
        { id: 1, name: 'Court 1' },
        { id: 2, name: 'Court 2' },
        { id: 3, name: 'Court 3' },
        { id: 4, name: 'Court 4' },
      ];
      await this.courtsRepository.save(courts);
      console.log('Seeded 4 courts.');
    }
  }

  async findAll(): Promise<Court[]> {
    return this.courtsRepository.find();
  }

  async getAvailability(date: string) {
    const courts = await this.findAll();
    const bookings = await this.bookingsRepository.find({
      where: { booking_date: date },
      relations: { court: true },
    });

    // Group bookings by court id
    return courts.map((court) => {
      const courtBookings = bookings.filter(b => b.court?.id === court.id && b.status !== BookingStatus.CANCELLED);
      return {
        ...court,
        bookings: courtBookings.map(b => ({
          id: b.id,
          start_time: b.start_time,
          end_time: b.end_time,
          status: b.status,
        })),
      };
    });
  }
}
