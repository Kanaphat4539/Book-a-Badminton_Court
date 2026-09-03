import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../../users/entities/student.entity';
import { Admin } from '../../users/entities/admin.entity';

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

  @Column({ type: 'simple-enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: BookingStatus;

  @CreateDateColumn()
  created_at: Date;
}
