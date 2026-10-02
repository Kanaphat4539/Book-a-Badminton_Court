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
      type: (process.env.DB_TYPE as any) || 'mysql',
      ...(process.env.DATABASE_URL || process.env.MYSQL_URL
        ? { url: process.env.DATABASE_URL || process.env.MYSQL_URL }
        : {
            host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
            port: parseInt(process.env.DB_PORT || process.env.MYSQLPORT || '3306', 10),
            username: process.env.DB_USER || process.env.MYSQLUSER || 'badminton_user',
            password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || 'password',
            database: process.env.DB_NAME || process.env.MYSQLDATABASE || 'badminton_db',
          }),
      entities: [Admin, Student, Booking, Court],
      synchronize: process.env.DB_SYNCHRONIZE === 'false' ? false : true,
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
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
