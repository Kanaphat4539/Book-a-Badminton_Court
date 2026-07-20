import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
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

    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      throw new BadRequestException('Day-by-day policy: You can only book courts for today.');
    }

    // 1. Check if user already has an active booking (limit 1 active booking at a time)
    const existingUserBooking = await this.bookingsRepository.findOne({
      where: [
        { user: { id: userId }, status: BookingStatus.PENDING },
        { user: { id: userId }, status: BookingStatus.CHECKED_IN }
      ]
    });

    if (existingUserBooking) {
      throw new BadRequestException('You already have an active booking. Please complete or cancel it first.');
    }

    // 2. Check if the court is available at this time
    const overlappingBooking = await this.bookingsRepository.findOne({
      where: [
        { court: { id: courtId }, booking_date: date, start_time: startTime, status: BookingStatus.PENDING },
        { court: { id: courtId }, booking_date: date, start_time: startTime, status: BookingStatus.CHECKED_IN }
      ]
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

    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.start_time}`);
    if (now < bookingDateTime) {
      throw new BadRequestException('You cannot check in before the booking time starts.');
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
    Logger.log(`[Booking Cancelled] Booking ID: ${bookingId}, User ID: ${userId}`, 'BookingsService');
    return this.bookingsRepository.save(booking);
  }

  async finishBooking(bookingId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { id: bookingId }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.CHECKED_IN) {
      throw new BadRequestException(`Cannot finish. Status is currently ${booking.status}`);
    }

    booking.status = BookingStatus.COMPLETED;
    Logger.log(`[Booking Finished Early] Booking ID: ${bookingId}`, 'BookingsService');
    return this.bookingsRepository.save(booking);
  }

  async resetBookings() {
    // Delete all bookings using query builder to bypass empty criteria safeguard
    await this.bookingsRepository.createQueryBuilder().delete().execute();
    return { message: 'Database reset successfully. All bookings have been cleared.' };
  }
}
