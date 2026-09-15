import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Student } from '../../users/entities/student.entity';
import { Admin } from '../../users/entities/admin.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CHECKED_IN = 'CHECKED_IN',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
}

@Entity('Booking')
export class Booking {
  @PrimaryGeneratedColumn()
  booking_id: number;

  @Column({ type: 'varchar', length: 8 })
  stu_id: string;

  @Column({ type: 'int' })
  court: number;

  @Column({ type: 'date' })
  booking_date: string;

  @Column({ type: 'time' })
  time_in: string;

  @Column({ type: 'time' })
  time_out: string;

  @Column({ type: 'varchar', length: 50 })
  status: string;

  @Column({ type: 'varchar', length: 20 })
  admin_id: string;

  @ManyToOne(() => Student, (student) => student.bookings, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'stu_id' })
  student: Student;

  @ManyToOne(() => Admin, (admin) => admin.bookings, { onUpdate: 'CASCADE', onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'admin_id' })
  admin: Admin;
}
