import { Entity, Column, PrimaryColumn, OneToMany, Check, Index } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('users_students')
@Check(`"email" LIKE '%@kmitl.ac.th'`)
export class Student {
  @PrimaryColumn({ type: 'varchar', length: 8 })
  stu_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Index('IDX_student_email_normalized')
  @Column({ type: 'varchar', length: 255, nullable: true })
  email_normalized: string | null;

  @Column({ type: 'varchar', length: 100 })
  first_name: string;

  @Column({ type: 'varchar', length: 100 })
  last_name: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  tel: string;

  @Column({ type: 'varchar', length: 150 })
  major: string;

  @Column({ type: 'smallint' })
  year: number;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 64, nullable: true, unique: true })
  reset_token_hash: string | null;

  @Column({ type: 'datetime', nullable: true })
  reset_token_expires_at: Date | null;

  @Column({ type: 'datetime', nullable: true })
  reset_requested_at: Date | null;

  @Column({ type: 'int', default: 0 })
  password_version: number;

  @Column({ type: 'int', default: 0 })
  strikes: number;

  @Column({ type: 'datetime', nullable: true })
  banned_until: Date | null;

  @Column({ type: 'int', default: 1 })
  quota: number;

  @OneToMany(() => Booking, (booking) => booking.student)
  bookings: Booking[];
}
