import { Entity, Column, PrimaryColumn, OneToMany, Check } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('users_students')
@Check(`"email" LIKE '%@kmitl.ac.th'`)
export class Student {
  @PrimaryColumn({ type: 'varchar', length: 8 })
  stu_id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

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

  @OneToMany(() => Booking, (booking) => booking.student)
  bookings: Booking[];
}
