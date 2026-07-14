import { Entity, PrimaryColumn, Column, OneToMany } from 'typeorm';
import { Booking } from '../../bookings/entities/booking.entity';

export enum CourtStatus {
  AVAILABLE = 'AVAILABLE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('courts')
export class Court {
  @PrimaryColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'simple-enum', enum: CourtStatus, default: CourtStatus.AVAILABLE })
  status: CourtStatus;

  @OneToMany(() => Booking, (booking) => booking.court)
  bookings: Booking[];
}
