import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';

// System / e2e: real HTTP against a fully bootstrapped Nest app backed by an
// isolated in-memory SQLite database (never touches the real database.sqlite).
describe('System flow (e2e)', () => {
  let app: INestApplication;
  let studentToken: string;
  let adminToken: string;
  let bookingId: number;

  const today = new Date().toISOString().split('T')[0];
  const registration = {
    studentId: '64010001',
    email: 'e2e@kmitl.ac.th',
    name: 'E2E Student',
    phone: '0800000000',
    major: 'CS',
    year: '2',
    username: 'e2estudent',
    password: 'e2e-password',
  };

  beforeAll(async () => {
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_NAME = ':memory:';
    // Require AFTER env is set so TypeOrmModule.forRoot picks up the in-memory DB.
    // (ts-jest runs CommonJS, so a lazy require — not dynamic import() — is what works here.)
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { AppModule } = require('./../src/app.module');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET / returns the health string', () => {
    return request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('registers a new student and returns a token', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send(registration)
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
    expect(res.body.user.role).toBe('STUDENT');
    studentToken = res.body.access_token;
  });

  it('logs the student back in', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: registration.username, password: registration.password })
      .expect(201);

    expect(res.body.access_token).toBeTruthy();
    studentToken = res.body.access_token;
  });

  it('returns court availability for an authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/courts/availability?date=${today}`)
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toHaveLength(4);
  });

  it('creates a booking for today', async () => {
    const res = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ courtId: 1, date: today, startTime: '10:00' })
      .expect(201);

    expect(res.body.booking_id).toBeDefined();
    expect(res.body.status).toBe('PENDING');
    bookingId = res.body.booking_id;
  });

  it('lists the booking under /bookings/me', async () => {
    const res = await request(app.getHttpServer())
      .get('/bookings/me')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(200);

    expect(res.body.some((b: any) => b.booking_id === bookingId)).toBe(true);
  });

  it('rejects an unauthenticated request with 401', () => {
    return request(app.getHttpServer()).get('/bookings/me').expect(401);
  });

  it('forbids a student from the admin-only booking list with 403', () => {
    return request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${studentToken}`)
      .expect(403);
  });

  it('allows the seeded admin to view all bookings', async () => {
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' })
      .expect(201);
    adminToken = login.body.access_token;
    expect(login.body.user.role).toBe('ADMIN');

    const res = await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
