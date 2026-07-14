import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Court } from '../courts/entities/court.entity';
import { User } from '../users/entities/user.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async createBooking(userId: number, courtId: number, date: string, startTime: string) {
    // End time is exactly 1 hour after start time
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1).toString().padStart(2, '0');
    const endTime = `${endHours}:${minutes.toString().padStart(2, '0')}:00`;

    // 1. Check if user already has a booking today (limit 1 hr/day)
    const existingUserBooking = await this.bookingsRepository.findOne({
      where: {
        user: { id: userId },
        booking_date: date,
        status: BookingStatus.PENDING, // Or CHECKED_IN
      }
    });

    if (existingUserBooking) {
      throw new BadRequestException('You already have a booking for this date.');
    }

    // 2. Check if the court is available at this time
    const overlappingBooking = await this.bookingsRepository.findOne({
      where: {
        court: { id: courtId },
        booking_date: date,
        start_time: startTime,
        status: BookingStatus.PENDING,
      }
    });

    if (overlappingBooking) {
      throw new BadRequestException('This court is already booked at this time.');
    }

    const court = await this.courtsRepository.findOneBy({ id: courtId });
    if (!court) throw new NotFoundException('Court not found');

    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');

    const newBooking = this.bookingsRepository.create({
      user,
      court,
      booking_date: date,
      start_time: startTime,
      end_time: endTime,
      status: BookingStatus.PENDING,
    });

    return this.bookingsRepository.save(newBooking);
  }

  async getMyBookings(userId: number) {
    return this.bookingsRepository.find({
      where: { user: { id: userId } },
      relations: { court: true },
      order: { booking_date: 'DESC', start_time: 'DESC' },
    });
  }

  async getAllBookings(date?: string) {
    const whereCondition = date ? { booking_date: date } : {};
    return this.bookingsRepository.find({
      where: whereCondition,
      relations: { court: true, user: true },
      order: { booking_date: 'DESC', start_time: 'DESC' },
    });
  }

  async checkIn(bookingId: number, userId: number, courtId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, user: { id: userId }, court: { id: courtId } }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or mismatch with this court.');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot check in. Status is currently ${booking.status}`);
    }

    booking.status = BookingStatus.CHECKED_IN;
    return this.bookingsRepository.save(booking);
  }

  async cancelBooking(bookingId: number, userId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId, user: { id: userId } }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel. Status is currently ${booking.status}`);
    }

    booking.status = BookingStatus.CANCELLED;
    return this.bookingsRepository.save(booking);
  }

  async resetBookings() {
    // Delete all bookings using query builder to bypass empty criteria safeguard
    await this.bookingsRepository.createQueryBuilder().delete().execute();
    return { message: 'Database reset successfully. All bookings have been cleared.' };
  }
}
