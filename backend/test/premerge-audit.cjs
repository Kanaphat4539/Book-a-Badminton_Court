// Diagnostic audit: npm run build && node test/premerge-audit.cjs
// Uses only an isolated in-memory database; does not alter application code.
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_NAME = ':memory:';
require('reflect-metadata');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const { SchedulerRegistry } = require('@nestjs/schedule');
const request = require('supertest');
const { AppModule } = require('../dist/app.module');
const { Booking } = require('../dist/bookings/entities/booking.entity');
const { Student } = require('../dist/users/entities/student.entity');
const { BookingsService } = require('../dist/bookings/bookings.service');
const { CronService } = require('../dist/cron/cron.service');
const RealDate = Date;
let failures = 0;
let instant = new RealDate('2026-09-17T18:14:59+07:00').getTime();
function clock(value) {
  instant = new RealDate(value).getTime();
  global.Date = class extends RealDate {
    constructor(...args) { super(...(args.length ? args : [instant])); }
    static now() { return instant; }
  };
}
(async () => {
  const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = module.createNestApplication();
  app.useLogger(false);
  await app.init();
  const jobs = app.get(SchedulerRegistry).getCronJobs();
  console.log('Registered cron jobs:', jobs.size);
  for (const job of jobs.values()) job.stop();
  const db = app.get(DataSource);
  const bookings = db.getRepository(Booking);
  const students = db.getRepository(Student);
  const service = app.get(BookingsService);
  const cron = app.get(CronService);
  const userId = '65010000';
  const originalStudent = await students.findOneBy({ stu_id: userId });
  await students.save(students.create({ ...originalStudent, stu_id: '65010001', username: 'audit_second', email: 'audit_second@kmitl.ac.th' }));
  const login = await request(app.getHttpServer()).post('/auth/login').send({ username: 'testuser', password: 'password' });
  assert.equal(login.status, 201);
  const token = login.body.access_token;
  const post = (path, body) => request(app.getHttpServer()).post(path).auth(token, { type: 'bearer' }).send(body);
  async function reset() {
    await bookings.clear();
    await students.update(userId, { strikes: 0, banned_until: null });
    clock('2026-09-17T18:14:59+07:00');
  }
  async function seed(status = 'PENDING', date = '2026-09-17') {
    return bookings.save(bookings.create({ stu_id: userId, court: 1, booking_date: date, time_in: '18:00:00', time_out: '19:00:00', admin_id: 'A001', status }));
  }
  async function check(label, fn) {
    try { await reset(); await fn(); console.log('PASS:', label); }
    catch (error) { failures++; console.log('FAIL:', label, error.message); }
  }
  try {
    await check('R3 8 cron catches two missed bookings across days and bans', async () => {
      await seed('PENDING', '2026-09-15');
      await seed('PENDING', '2026-09-16');
      clock('2026-09-17T18:16:00+07:00');
      await cron.handleCron();
      const student = await students.findOneBy({ stu_id: userId });
      assert.equal(await bookings.countBy({ status: 'CANCELLED' }), 2);
      assert.equal(student.strikes, 2);
      assert.equal(new RealDate(student.banned_until).getTime() - instant, 86400000);
    });
    await check('R2 1 Bangkok midnight accepts today and rejects yesterday', async () => {
      clock('2026-09-17T00:30:00+07:00');
      assert.equal((await post('/bookings', { courtId: 1, date: '2026-09-16', startTime: '18:00:00' })).status, 400);
      assert.equal((await post('/bookings', { courtId: 1, date: '2026-09-17', startTime: '18:00:00' })).status, 201);
    });
    await check('R2 4 different users concurrent overlapping bookings', async () => {
      const results = await Promise.allSettled([
        service.createBooking(userId, 1, '2026-09-17', '19:00:00'),
        service.createBooking('65010001', 1, '2026-09-17', '19:30:00'),
      ]);
      console.log('Concurrent results:', results.map(r => r.status === 'fulfilled' ? 'saved' : r.reason.message));
      assert.equal(await bookings.count(), 1);
      assert.equal(results.filter(r => r.status === 'fulfilled').length, 1);
      assert.equal(results.find(r => r.status === 'rejected')?.reason.getStatus?.(), 400);
    });
    await check('R2 4 sequential partial overlap rejected', async () => {
      await seed();
      await assert.rejects(service.createBooking('65010001', 1, '2026-09-17', '18:30:00'), e => e.getStatus?.() === 400);
    });
    await check('R2 6 overdue previous-day booking is cancelled', async () => {
      const b = await seed('PENDING', '2026-09-16');
      clock('2026-09-17T00:30:00+07:00');
      await cron.handleCron();
      assert.equal((await bookings.findOneBy({ booking_id: b.booking_id })).status, 'CANCELLED');
    });
    await check('R2 6 midnight cron must not cancel future evening booking', async () => {
      const b = await seed();
      clock('2026-09-17T00:05:00+07:00');
      await cron.handleCron();
      assert.equal((await bookings.findOneBy({ booking_id: b.booking_id })).status, 'PENDING');
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 0);
    });
    await check('R2 7 concurrent cron and cancellation count once', async () => {
      const b = await seed();
      clock('2026-09-17T18:16:00+07:00');
      const outcomes = await Promise.allSettled([cron.handleCron(), service.cancelBooking(b.booking_id, userId)]);
      console.log('Cron/cancel results:', outcomes.map(r => r.status === 'fulfilled' ? 'ok' : r.reason.message));
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 1);
      assert.equal((await bookings.findOneBy({ booking_id: b.booking_id })).status, 'CANCELLED');
      assert.ok(outcomes.some(r => r.status === 'fulfilled'), 'Both operations rejected despite changing stored state');
    });
    await check('1 API rejects yesterday and tomorrow (UTC/local agree at 18:14)', async () => {
      for (const date of ['2026-09-16', '2026-09-18']) {
        const r = await post('/bookings', { courtId: 1, date, startTime: '19:00:00' });
        assert.equal(r.status, 400);
        assert.match(r.body.message, /today/);
      }
    });
    await check('3 cancel before deadline then rebook through API', async () => {
      const b = await seed();
      assert.equal((await post(`/bookings/${b.booking_id}/cancel`, {})).status, 201);
      const r = await post('/bookings', { courtId: 2, date: '2026-09-17', startTime: '19:00:00' });
      assert.equal(r.status, 201, JSON.stringify(r.body));
    });
    await check('2 completed booking still consumes daily quota', async () => {
      await seed('COMPLETED');
      await assert.rejects(service.createBooking(userId, 2, '2026-09-17', '19:00:00'), e => e.getStatus?.() === 400);
    });
    await check('4 concurrent same-slot requests yield one success and one conflict', async () => {
      const r = await Promise.all([1, 2].map(() => post('/bookings', { courtId: 1, date: '2026-09-17', startTime: '19:00:00' })));
      assert.deepEqual(r.map(x => x.status).sort(), [201, 400]);
    });
    await check('5 18:14:59 no strike; 18:15:00 adds strike', async () => {
      const early = await seed();
      assert.equal((await post(`/bookings/${early.booking_id}/cancel`, {})).status, 201);
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 0);
      const late = await seed();
      clock('2026-09-17T18:15:00+07:00');
      assert.equal((await post(`/bookings/${late.booking_id}/cancel`, {})).status, 201);
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 1);
    });
    await check('6 cron cancels at exact deadline without browser', async () => {
      const b = await seed();
      clock('2026-09-17T18:15:00+07:00');
      await cron.handleCron();
      assert.equal((await bookings.findOneBy({ booking_id: b.booking_id })).status, 'CANCELLED');
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 1);
    });
    await check('7 repeated sequential cron/cancel does not double count', async () => {
      const b = await seed();
      clock('2026-09-17T18:16:00+07:00');
      await cron.handleCron(); await cron.handleCron();
      await assert.rejects(service.cancelBooking(b.booking_id, userId));
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 1);
    });
    await check('8 strikes across days; second gives exactly 24h ban', async () => {
      const first = await seed();
      clock('2026-09-17T18:15:00+07:00');
      await service.cancelBooking(first.booking_id, userId);
      let s = await students.findOneBy({ stu_id: userId });
      assert.equal(s.strikes, 1); assert.equal(s.banned_until, null);
      const second = await seed('PENDING', '2026-09-18');
      clock('2026-09-18T18:15:00+07:00');
      await service.cancelBooking(second.booking_id, userId);
      s = await students.findOneBy({ stu_id: userId });
      assert.equal(s.strikes, 2);
      assert.equal(new RealDate(s.banned_until).getTime() - instant, 86400000);
    });
    await check('7 retry after booking write failure must not double-count', async () => {
      const b = await seed();
      clock('2026-09-17T18:16:00+07:00');
      await db.query("CREATE TEMP TRIGGER audit_fail_booking BEFORE UPDATE ON Booking BEGIN SELECT RAISE(ABORT, 'audit injected booking write failure'); END");
      try { await assert.rejects(service.cancelBooking(b.booking_id, userId)); }
      finally { await db.query('DROP TRIGGER audit_fail_booking'); }
      await service.cancelBooking(b.booking_id, userId);
      assert.equal((await students.findOneBy({ stu_id: userId })).strikes, 1);
    });
    await check('10/11 scan uses id returned by /bookings/me', async () => {
      await seed();
      const r = await request(app.getHttpServer()).get('/bookings/me').auth(token, { type: 'bearer' });
      assert.equal(r.status, 200);
      const pendingBooking = r.body[0];
      console.log('Booking identifier fields:', Object.keys(pendingBooking).filter(k => /id/.test(k)));
      const checked = await post(`/bookings/${pendingBooking.id}/check-in`, { courtId: 1 });
      assert.equal(checked.status, 201, JSON.stringify(checked.body));
    });
    await check('9 cron automatically clears expired ban and strikes', async () => {
      await db.query('UPDATE users_students SET strikes = 2, banned_until = ? WHERE stu_id = ?', [new RealDate(instant - 1).toISOString().replace('T', ' ').replace('Z', ''), userId]);
      await cron.handleCron();
      const s = await students.findOneBy({ stu_id: userId });
      assert.equal(s.banned_until, null); assert.equal(s.strikes, 0);
    });
  } finally { global.Date = RealDate; await app.close(); }
  if (failures) process.exitCode = 1;
})().catch(error => { console.error(error); process.exitCode = 1; });
