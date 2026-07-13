import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Court } from '../../courts/entities/court.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('bookings')
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (user) => user.bookings)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Court, (court) => court.bookings)
  @JoinColumn({ name: 'court_id' })
  court: Court;

  @Column({ type: 'date' })
  booking_date: string;

  @Column({ type: 'time' })
  start_time: string;

  @Column({ type: 'time' })
  end_time: string;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @CreateDateColumn()
  created_at: Date;
}
