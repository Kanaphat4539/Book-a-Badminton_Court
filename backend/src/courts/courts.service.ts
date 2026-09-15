import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';

@Injectable()
export class CourtsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async findAll(): Promise<any[]> {
    return [
      { id: 1, name: 'Court 1' },
      { id: 2, name: 'Court 2' },
      { id: 3, name: 'Court 3' },
      { id: 4, name: 'Court 4' },
    ];
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
