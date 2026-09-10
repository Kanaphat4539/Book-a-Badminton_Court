import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { CourtsModule } from './courts/courts.module';
import { BookingsModule } from './bookings/bookings.module';
import { CronModule } from './cron/cron.module';
import { Admin } from './users/entities/admin.entity';
import { Student } from './users/entities/student.entity';
import { Booking } from './bookings/entities/booking.entity';
import { Court } from './courts/entities/court.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: (process.env.DB_TYPE as any) || 'better-sqlite3',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306'),
      username: process.env.DB_USER || 'badminton_user',
      password: process.env.DB_PASSWORD || 'password',
      database: process.env.DB_NAME || 'database.sqlite',
      entities: [Admin, Student, Booking, Court],
      synchronize: true, // Use only in dev, not in production
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: true } : false,
    }),
    ScheduleModule.forRoot(),
    DatabaseModule,
    AuthModule,
    UsersModule,
    CourtsModule,
    BookingsModule,
    CronModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
