// Isolated UI audit fixture. Never connects to the runtime database.
process.env.DB_TYPE = 'better-sqlite3';
process.env.DB_NAME = ':memory:';
process.env.TZ = 'Asia/Bangkok';
const NativeDate = Date;
global.Date = class extends NativeDate {
  constructor(...args) { super(...(args.length ? args : ['2026-09-17T18:00:00+07:00'])); }
  static now() { return new NativeDate('2026-09-17T18:00:00+07:00').getTime(); }
};
require('reflect-metadata');
const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app.module');
(async () => {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.listen(4107, '127.0.0.1');
  console.log('Isolated UI backend ready on 4107');
})();
