import { Entity, Column, PrimaryColumn, OneToMany } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

@Entity('admin')
export class Admin {
  @PrimaryColumn({ type: 'varchar', length: 20 })
  admin_id: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @OneToMany(() => Booking, (booking) => booking.admin)
  bookings: Booking[];
}
