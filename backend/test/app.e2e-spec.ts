import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

// System-level tests: real HTTP against a fully bootstrapped Nest app
// (controllers -> guards -> services -> in-memory SQLite). AppModule seeds the
// default `admin` / `user` accounts and 4 courts on startup, which these use.
describe('Badminton API (system / e2e)', () => {
  let app: INestApplication;
  const today = new Date().toISOString().split('T')[0];

  let userToken: string;
  let adminToken: string;

  beforeAll(async () => {
    process.env.DB_TYPE = 'better-sqlite3';
    process.env.DB_NAME = ':memory:';

    // Require AFTER env is set so TypeOrmModule.forRoot picks up the in-memory DB.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
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

  it('GET / returns the health string', async () => {
    await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
  });

  it('logs in the seeded user and admin accounts', async () => {
    const userRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'user', password: 'password' })
      .expect(201);
    expect(userRes.body.access_token).toBeTruthy();
    expect(userRes.body.user.role).toBe('USER');
    userToken = userRes.body.access_token;

    const adminRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'admin', password: 'password' })
      .expect(201);
    expect(adminRes.body.user.role).toBe('ADMIN');
    adminToken = adminRes.body.access_token;
  });

  it('rejects login with a wrong password (401)', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ username: 'user', password: 'nope' })
      .expect(401);
  });

  it('blocks unauthenticated access to protected routes (401)', async () => {
    await request(app.getHttpServer()).get('/bookings/me').expect(401);
  });

  it('lists court availability for the authenticated user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/courts/availability?date=${today}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(4); // 4 seeded courts
  });

  let bookingId: number;

  it('lets a user create a booking and see it under /me', async () => {
    const createRes = await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ courtId: 1, date: today, startTime: '08:00' })
      .expect(201);
    expect(createRes.body.status).toBe('PENDING');
    expect(createRes.body.end_time).toBe('09:00:00');
    bookingId = createRes.body.id;

    const meRes = await request(app.getHttpServer())
      .get('/bookings/me')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);
    expect(meRes.body.some((b: any) => b.id === bookingId)).toBe(true);
  });

  it('rejects a second active booking for the same user', async () => {
    await request(app.getHttpServer())
      .post('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ courtId: 2, date: today, startTime: '10:00' })
      .expect(400);
  });

  it('lets the user check in to their booking', async () => {
    const res = await request(app.getHttpServer())
      .post(`/bookings/${bookingId}/check-in`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ courtId: 1 })
      .expect(201);
    expect(res.body.status).toBe('CHECKED_IN');
  });

  it('forbids a normal user from the admin-only booking list (403)', async () => {
    await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });

  it('allows an admin to list all bookings', async () => {
    const res = await request(app.getHttpServer())
      .get('/bookings')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });
});
