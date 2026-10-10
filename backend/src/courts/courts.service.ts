import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../bookings/entities/booking.entity';
import { Court } from './entities/court.entity';

export const DEFAULT_COURT_IMAGES = [
  "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLmI6WJ6HB7dipoImcI-yYTXW-pTMMJPHjtXgcmMe9wvsgU2-xjBg_wPPPeZCcalvIExmqUwlv6AWtgDrqlkpGH8DPejWjmANIiQmtwaymgJpRVaO3ot2_qJogEGlATnn98Hmv03bhA6vOw7yrteDkYf34SM9vknS5WbX2CJ8r_2JoMn0JhvvopneUB7bM-_929oCXGhLhTjC-dgIou98mcCQpG4ZlivUgLhAJIUP09EpoLEd3LcO",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuCBYUbU_WdVKEifnxDG32AtMOD8jd6gHx6Mr9D2k1QDOnaH_dogMdf14FnilKm5690ke0x2zx1RkDRo_4Z4WjXFAsDVTSE7DjEcsIFAld9-ztK5qN3kwQBKdRcJLeJ4BPcJDqPMOS8fEkA7zGhqvGT4uqM5UoBQY4hNXgkXBU6sC8quyjAgOf0h203Z2imr-oKgKWSdTX8xzmHo7Cm4O77i_KyiwBtSDzwaFKXwIjpKA_2fQCwIkYmk",
  "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q"
];

export const DEFAULT_COURT_LOCATIONS = [
  "KMITL Sports Hall • Main",
  "KMITL Sports Hall • West",
  "อาคารยิมเนเซียม 1 • East",
  "อาคารยิมเนเซียม 1 • North"
];

@Injectable()
export class CourtsService implements OnModuleInit {
  constructor(
    @InjectRepository(Court)
    private courtsRepository: Repository<Court>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async onModuleInit() {
    if (this.courtsRepository && typeof this.courtsRepository.count === 'function') {
      const count = await this.courtsRepository.count();
      if (count === 0) {
        const initialCourts = [
          { name: 'Court 1', is_active: true, image: DEFAULT_COURT_IMAGES[0], location: DEFAULT_COURT_LOCATIONS[0] },
          { name: 'Court 2', is_active: true, image: DEFAULT_COURT_IMAGES[1], location: DEFAULT_COURT_LOCATIONS[1] },
          { name: 'Court 3', is_active: true, image: DEFAULT_COURT_IMAGES[2], location: DEFAULT_COURT_LOCATIONS[2] },
          { name: 'Court 4', is_active: true, image: DEFAULT_COURT_IMAGES[3], location: DEFAULT_COURT_LOCATIONS[3] },
        ];
        await this.courtsRepository.save(initialCourts);
      } else {
        const courts = await this.courtsRepository.find({ order: { id: 'ASC' } });
        for (let i = 0; i < courts.length; i++) {
          let updated = false;
          if (!courts[i].image) {
            courts[i].image = DEFAULT_COURT_IMAGES[i % DEFAULT_COURT_IMAGES.length];
            updated = true;
          }
          if (!courts[i].location) {
            courts[i].location = DEFAULT_COURT_LOCATIONS[i % DEFAULT_COURT_LOCATIONS.length];
            updated = true;
          }
          if (updated) {
            await this.courtsRepository.save(courts[i]);
          }
        }
      }
    }
  }

  async findAll(): Promise<any[]> {
    const courts = await this.courtsRepository.find({
      order: { id: 'ASC' },
    });
    return courts.map((court, index) => ({
      id: court.id,
      name: court.name,
      status: court.is_active ? 'ACTIVE' : 'MAINTENANCE',
      is_active: court.is_active,
      image: court.image || DEFAULT_COURT_IMAGES[index % DEFAULT_COURT_IMAGES.length],
      location: court.location || DEFAULT_COURT_LOCATIONS[index % DEFAULT_COURT_LOCATIONS.length],
    }));
  }

  async updateCourt(id: number, data: { name?: string; image?: string; location?: string; is_active?: boolean }): Promise<Court> {
    const court = await this.courtsRepository.findOneBy({ id });
    if (!court) {
      throw new NotFoundException(`Court ID ${id} not found`);
    }
    if (data.name !== undefined) court.name = data.name;
    if (data.image !== undefined) court.image = data.image;
    if (data.location !== undefined) court.location = data.location;
    if (data.is_active !== undefined) court.is_active = data.is_active;

    return this.courtsRepository.save(court);
  }

  async getAvailability(date: string) {
    const courts = await this.findAll();
    const bookings = await this.bookingsRepository.find({
      where: { booking_date: date },
    });

    return courts.map((court) => {
      const courtBookings = bookings.filter(b => b.court === court.id && b.status !== BookingStatus.CANCELLED);
      return {
        ...court,
        bookings: courtBookings.map(b => ({
          id: b.booking_id,
          start_time: b.time_in,
          end_time: b.time_out,
          status: b.status,
        })),
      };
    });
  }
}
