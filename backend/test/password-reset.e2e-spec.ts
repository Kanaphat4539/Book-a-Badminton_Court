import { Controller, Get, INestApplication, UseGuards } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import request from 'supertest';
import { AuthModule } from '../src/auth/auth.module';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard';
import { ResetMailService } from '../src/auth/reset-mail.service';
import { Student } from '../src/users/entities/student.entity';
import { Admin } from '../src/users/entities/admin.entity';
import { Booking } from '../src/bookings/entities/booking.entity';
import { Court } from '../src/courts/entities/court.entity';

@Controller('probe')
@UseGuards(JwtAuthGuard)
class ProbeController {
  @Get()
  ok() {
    return { ok: true };
  }
}

describe('password recovery API', () => {
  let app: INestApplication;
  let lastToken: string;

  beforeAll(async () => {
    const mail = {
      assertConfigured: jest.fn(),
      sendResetLink: jest.fn((_to: string, token: string) => {
        lastToken = token;
        return Promise.resolve();
      }),
    };
    const module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqljs',
          entities: [Student, Admin, Booking, Court],
          synchronize: true,
        }),
        AuthModule,
      ],
      controllers: [ProbeController],
    })
      .overrideProvider(ResetMailService)
      .useValue(mail)
      .compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
  });

  it('handles unknown email, one-time reset, and revokes the previous session', async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const oldLogin = await request(server)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password' })
      .expect(201);
    const oldToken = (oldLogin.body as { access_token: string }).access_token;
    await request(server)
      .get('/probe')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(200);

    const unknown = await request(server)
      .post('/auth/forgot-password')
      .send({ email: 'missing@kmitl.ac.th' })
      .expect(202);
    const known = await request(server)
      .post('/auth/forgot-password')
      .send({ email: 'testuser@kmitl.ac.th' })
      .expect(202);
    expect(known.body).toEqual(unknown.body);
    expect(lastToken).toMatch(/^[a-f0-9]{64}$/);

    await request(server)
      .post('/auth/reset-password')
      .send({ token: lastToken, password: 'new-password-123' })
      .expect(200);
    await request(server)
      .post('/auth/reset-password')
      .send({ token: lastToken, password: 'another-password' })
      .expect(400);
    await request(server)
      .get('/probe')
      .set('Authorization', `Bearer ${oldToken}`)
      .expect(401);
    await request(server)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'password' })
      .expect(401);
    const newLogin = await request(server)
      .post('/auth/login')
      .send({ username: 'testuser', password: 'new-password-123' })
      .expect(201);
    await request(server)
      .get('/probe')
      .set(
        'Authorization',
        `Bearer ${(newLogin.body as { access_token: string }).access_token}`,
      )
      .expect(200);
  });
});
