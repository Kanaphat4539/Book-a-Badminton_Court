import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Student } from '../users/entities/student.entity';
import { Admin } from '../users/entities/admin.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Admin)
    private adminRepository: Repository<Admin>,
  ) {}

  async createBooking(stu_id: string, courtId: number, date: string, startTime: string) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endHours = (hours + 1).toString().padStart(2, '0');
    const endTime = `${endHours}:${minutes.toString().padStart(2, '0')}:00`;

    const today = new Date().toISOString().split('T')[0];
    if (date !== today) {
      throw new BadRequestException('Day-by-day policy: You can only book courts for today.');
    }

    const existingUserBooking = await this.bookingsRepository.findOne({
      where: [
        { stu_id, status: BookingStatus.PENDING },
        { stu_id, status: BookingStatus.CHECKED_IN }
      ]
    });

    if (existingUserBooking) {
      throw new BadRequestException('You already have an active booking. Please complete or cancel it first.');
    }

    const overlappingBooking = await this.bookingsRepository.findOne({
      where: [
        { court: courtId, booking_date: date, time_in: startTime, status: BookingStatus.PENDING },
        { court: courtId, booking_date: date, time_in: startTime, status: BookingStatus.CHECKED_IN }
      ]
    });

    if (overlappingBooking) {
      throw new BadRequestException('This court is already booked at this time.');
    }

    const student = await this.studentRepository.findOneBy({ stu_id });
    if (!student) throw new NotFoundException('Student not found');
    
    // Fallback admin logic if admin_id is required
    let admin_id = 'A001';
    const defaultAdmin = await this.adminRepository.findOneBy({ admin_id });
    if (defaultAdmin) admin_id = defaultAdmin.admin_id;

    const newBooking = this.bookingsRepository.create({
      stu_id,
      court: courtId,
      booking_date: date,
      time_in: startTime,
      time_out: endTime,
      status: BookingStatus.PENDING,
      admin_id,
    });

    return this.bookingsRepository.save(newBooking);
  }

  async getMyBookings(stu_id: string) {
    return this.bookingsRepository.find({
      where: { stu_id },
      order: { booking_date: 'DESC', time_in: 'DESC' },
    });
  }

  async getAllBookings(date?: string) {
    const whereCondition = date ? { booking_date: date } : {};
    return this.bookingsRepository.find({
      where: whereCondition,
      relations: { student: true, admin: true },
      order: { booking_date: 'DESC', time_in: 'DESC' },
    });
  }

  async checkIn(bookingId: number, stu_id: string, courtId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { booking_id: bookingId, stu_id, court: courtId }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or mismatch with this court.');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot check in. Status is currently ${booking.status}`);
    }

    const now = new Date();
    const bookingDateTime = new Date(`${booking.booking_date}T${booking.time_in}`);
    if (now < bookingDateTime) {
      throw new BadRequestException('You cannot check in before the booking time starts.');
    }

    booking.status = BookingStatus.CHECKED_IN;
    return this.bookingsRepository.save(booking);
  }

  async cancelBooking(bookingId: number, stu_id: string) {
    const booking = await this.bookingsRepository.findOne({
      where: { booking_id: bookingId, stu_id }
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException(`Cannot cancel. Status is currently ${booking.status}`);
    }

    booking.status = BookingStatus.CANCELLED;
    Logger.log(`[Booking Cancelled] Booking ID: ${bookingId}, Student ID: ${stu_id}`, 'BookingsService');
    return this.bookingsRepository.save(booking);
  }

  async finishBooking(bookingId: number) {
    const booking = await this.bookingsRepository.findOne({
      where: { booking_id: bookingId }
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
    await this.bookingsRepository.createQueryBuilder().delete().execute();
    return { message: 'Database reset successfully. All bookings have been cleared.' };
  }
}
