// Isolated UI audit fixture. Never connects to the runtime database.
process.env.DB_TYPE = 'sqlite';
process.env.DB_NAME = ':memory:';
process.env.TZ = 'Asia/Bangkok';
const NativeDate = Date;
global.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : ['2026-09-17T18:00:00+07:00'])); }
  static now() { return new NativeDate('2026-09-17T18:00:00+07:00').getTime(); }
};
require('reflect-metadata');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const { SchedulerRegistry } = require('@nestjs/schedule');
const { AppModule } = require('../dist/app.module');
const { Student } = require('../dist/users/entities/student.entity');
const { Admin } = require('../dist/users/entities/admin.entity');
const { Booking } = require('../dist/bookings/entities/booking.entity');
const { Court } = require('../dist/courts/entities/court.entity');
(async () => {
  const isolatedDb = await new DataSource({ type: 'sqljs', driver: require('../../.qa-deps/node_modules/sql.js'), entities: [Student, Admin, Booking, Court], synchronize: true }).initialize();
  const module = await Test.createTestingModule({ imports: [AppModule] }).overrideProvider(DataSource).useValue(isolatedDb).compile();
  const app = module.createNestApplication({ logger: false });
  await app.init();
  await isolatedDb.getRepository(Court).save(
    Array.from({ length: 4 }, (_, index) => ({ id: index + 1, name: `Court ${index + 1}`, is_active: true })),
  );
  for (const job of app.get(SchedulerRegistry).getCronJobs().values()) job.stop();
  await app.listen(4107, '127.0.0.1');
  console.log('Isolated UI backend ready on 4107');
})();
