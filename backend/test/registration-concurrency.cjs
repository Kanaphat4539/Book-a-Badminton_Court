// Isolated registration race regression test; no application database.
process.env.DB_TYPE = 'sqlite';
process.env.DB_NAME = ':memory:';
require('reflect-metadata');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const request = require('supertest');
const { AppModule } = require('../dist/app.module');
const { Student } = require('../dist/users/entities/student.entity');
const { Admin } = require('../dist/users/entities/admin.entity');
const { Booking } = require('../dist/bookings/entities/booking.entity');
const { Court } = require('../dist/courts/entities/court.entity');

(async () => {
  const isolatedDb = await new DataSource({
    type: 'sqljs', driver: require('../../.qa-deps/node_modules/sql.js'),
    entities: [Student, Admin, Booking, Court], synchronize: true,
  }).initialize();
  const module = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(DataSource).useValue(isolatedDb).compile();
  const app = module.createNestApplication();
  app.useLogger(false);
  await app.init();
  try {
    const payload = {
      studentId: '72990001', email: 'race@kmitl.ac.th', name: 'Race Student',
      phone: '0812345678', major: 'Computer Engineering', year: '3',
      username: 'race_student', password: 'QA-only-123!',
    };
    const responses = await Promise.all([
      request(app.getHttpServer()).post('/auth/register').send(payload),
      request(app.getHttpServer()).post('/auth/register').send(payload),
    ]);
    assert.deepEqual(responses.map(r => r.status).sort(), [201, 400]);
    const saved = await isolatedDb.getRepository(Student).findBy({ stu_id: payload.studentId });
    assert.equal(saved.length, 1);
    assert.equal(saved[0].username, payload.username);
    const conflictingId = await request(app.getHttpServer()).post('/auth/register').send({
      ...payload, username: 'another_username', email: 'another@kmitl.ac.th',
    });
    assert.equal(conflictingId.status, 400);
    const conflictingEmail = await request(app.getHttpServer()).post('/auth/register').send({
      ...payload, studentId: '72990002', username: 'another_username',
    });
    assert.equal(conflictingEmail.status, 400);
    const after = await isolatedDb.getRepository(Student).findOneByOrFail({ stu_id: payload.studentId });
    assert.equal(after.username, payload.username);
    assert.equal(after.email, payload.email);
    console.log('PASS: simultaneous identical registrations produce one account and one 400');
  } finally {
    await app.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
