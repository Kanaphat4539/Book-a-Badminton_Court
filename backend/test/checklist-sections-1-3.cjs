// Isolated executable QA evidence: never connects to the application database.
process.env.DB_TYPE = 'sqlite';
process.env.DB_NAME = ':memory:';
process.env.TZ = 'Asia/Bangkok';
require('reflect-metadata');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { Test } = require('@nestjs/testing');
const { DataSource } = require('typeorm');
const { SchedulerRegistry } = require('@nestjs/schedule');
const request = require('supertest');
const { AppModule } = require('../dist/app.module');
const { Student } = require('../dist/users/entities/student.entity');
const { Admin } = require('../dist/users/entities/admin.entity');
const { Booking } = require('../dist/bookings/entities/booking.entity');
const { Court } = require('../dist/courts/entities/court.entity');
const { UsersService } = require('../dist/users/users.service');
const { CronService } = require('../dist/cron/cron.service');
const RealDate = Date;
let instant = new RealDate('2026-09-19T10:00:00+07:00').getTime();
global.Date = class extends RealDate {
  constructor(...args) { super(...(args.length ? args : [instant])); }
  static now() { return instant; }
};
const results = [];
let sequence = 0;
function payload(overrides = {}) {
  const n = ++sequence;
  return { studentId: String(71000000+n), email: `qa${n}@kmitl.ac.th`, name: 'ทดสอบ QA Student', phone: '0812345678', major: 'Computer Engineering', year: '3', username: `qa${n}`, password: 'QA-only-123!', ...overrides };
}
async function check(id, label, run) {
  try { const details = await run(); results.push({ id, label, status: details?.policy === 'NOT CONFIRMED' ? 'OBSERVED' : 'PASS', details }); }
  catch (e) { results.push({ id, label, status: 'FAIL', details: e.message }); }
  console.log(JSON.stringify(results.at(-1)));
}
(async () => {
  const isolatedDb = await new DataSource({type:'sqljs',driver:require('../../.qa-deps/node_modules/sql.js'),entities:[Student,Admin,Booking,Court],synchronize:true}).initialize();
  const module = await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue(isolatedDb).compile();
  const app = module.createNestApplication();
  app.useLogger(false);
  await app.init();
  for (const job of app.get(SchedulerRegistry).getCronJobs().values()) job.stop();
  const db = app.get(DataSource), students = db.getRepository(Student), bookings = db.getRepository(Booking);
  const http = request(app.getHttpServer());
  const reg = p => http.post('/auth/register').send(p);
  const login = (username, password = 'QA-only-123!') => http.post('/auth/login').send({username, password});
  const authPost = (token, url, body={}) => http.post(url).auth(token, {type:'bearer'}).send(body);
  const authGet = (token, url) => http.get(url).auth(token, {type:'bearer'});
  const create = token => authPost(token, '/bookings', {courtId:1,date:'2026-09-19',startTime:'10:00:00'});
  const studentA = payload(), studentB = payload();
  const a = await reg(studentA), b = await reg(studentB);
  const tokenA = a.body.access_token, tokenB = b.body.access_token;
  async function reset() {
    await bookings.clear();
    await students.update(studentA.studentId,{strikes:0,banned_until:null});
    instant = new RealDate('2026-09-19T10:00:00+07:00').getTime();
  }
  await check('SET-02','Database/seed idempotence',async()=>{
    const before = [await students.count(),await db.getRepository(Admin).count()];
    await app.get(UsersService).onModuleInit();
    assert.deepEqual([await students.count(),await db.getRepository(Admin).count()],before);
    return {database:'SQL.js in-memory',counts:before,seedReinitialized:true};
  });
  await check('SET-03','Separate users/admin/guest',async()=>{
    assert.equal(a.status,201); assert.equal(b.status,201);
    assert.notEqual(a.body.user.id,b.body.user.id);
    assert.equal((await login('admin','password')).body.user.role,'ADMIN');
    assert.equal((await http.get('/bookings/me')).status,401);
    return {studentIds:[a.body.user.id,b.body.user.id],guestStatus:401};
  });
  await check('SET-04','Strike/ban fixtures',async()=>{
    for (const [strikes,delta] of [[0,null],[1,null],[2,3600000],[2,-3600000]]) {
      const p=payload(); await reg(p);
      await students.update(p.studentId,{strikes,banned_until:delta===null?null:new Date(instant+delta)});
      const s=await students.findOneByOrFail({stu_id:p.studentId}); assert.equal(s.strikes,strikes);
      assert.equal(s.banned_until?.getTime()??null,delta===null?null:instant+delta);
    }
    return 'Prepared 0/1/2 strikes, active and expired bans';
  });
  await check('SET-05','All booking status/date/legacy fixtures',async()=>{
    await reset();
    for(const status of ['PENDING','CHECKED_IN','COMPLETED','CANCELLED']) for(const date of ['2026-09-18','2026-09-19'])
      await bookings.save(bookings.create({stu_id:studentA.studentId,admin_id:'A001',court:1,booking_date:date,time_in:'08:00:00',time_out:'09:00:00',status,created_at:null}));
    assert.equal(await bookings.count(),8);
    assert.equal((await bookings.find()).every(x=>x.created_at===null),true);
    return '8 isolated rows; four statuses × two dates; legacy created_at null';
  });
  await check('SET-06','Empty/partial/full availability fixtures',async()=>{
    await reset();
    const count=async()=> (await http.get('/courts/availability?date=2026-09-19')).body.reduce((n,c)=>n+c.bookings.length,0);
    assert.equal(await count(),0);
    for(let h=8;h<23;h++) for(let court=1;court<=4;court++){
      await bookings.save(bookings.create({stu_id:studentA.studentId,admin_id:'A001',court,booking_date:'2026-09-19',time_in:`${String(h).padStart(2,'0')}:00:00`,time_out:`${String(h+1).padStart(2,'0')}:00:00`,status:'PENDING',created_at:new Date()}));
      if(h===8 && [1,4].includes(court)) assert.equal(await count(),court);
    }
    assert.equal(await count(),60); return 'Verified totals 0, 1, 4, 60; synthetic capacity fixtures bypass daily quota';
  });
  await check('SET-07','Controlled deadline clock',async()=>{
    await reset(); const r=await create(tokenA); assert.equal(r.status,201);
    instant+=15*60000;
    assert.equal((await authPost(tokenA,`/bookings/${r.body.booking_id}/check-in`,{courtId:1})).status,400);
    instant-=1000;
    assert.equal((await authPost(tokenA,`/bookings/${r.body.booking_id}/check-in`,{courtId:1})).status,201);
    return '10:15:00 rejected; 10:14:59 accepted; server Asia/Bangkok';
  });
  await check('SET-08','Fixture backup/restore',async()=>{
    const backup=db.driver.export();const before=await bookings.find();const userCount=await students.count();
    await bookings.clear(); assert.equal(await bookings.count(),0);
    await db.driver.load(backup);assert.deepEqual(await bookings.find(),before);assert.equal(await students.count(),userCount);
    return 'Full SQLite database export/restore in memory verified bookings and users; not production disaster recovery';
  });
  await check('SMK-01','Register API identity',async()=>{assert.equal(a.status,201);assert.equal(a.body.user.id,studentA.studentId);return 'API only; Dashboard requires browser';});
  await check('SMK-02','Login and create one booking API',async()=>{
    await reset(); assert.equal((await login(studentA.username)).status,201);
    assert.equal((await create(tokenA)).status,201); assert.equal(await bookings.count(),1);
    assert.equal((await bookings.find())[0].status,'PENDING'); return 'API only; selection UI not exercised';
  });
  await check('SMK-03','Admin reads booking / owner checks in via API',async()=>{
    const admin=(await login('admin','password')).body.access_token;
    const list=await authGet(admin,'/bookings'); assert.equal(list.status,200); assert.equal(list.body.length,1);
    assert.equal((await authPost(tokenA,`/bookings/${list.body[0].booking_id}/check-in`,{courtId:1})).status,201);
    assert.equal((await authGet(tokenA,'/bookings/me')).body[0].status,'CHECKED_IN'); return 'API only; no physical QR scan or UI assertion';
  });
  await check('SMK-04','Round completion',async()=>{
    instant=new RealDate('2026-09-19T11:00:00+07:00').getTime(); await app.get(CronService).handleCron();
    assert.equal((await authGet(tokenA,'/bookings/me')).body[0].status,'COMPLETED');assert.equal(await bookings.count(),1);
    return 'Real Cron handler invoked at controlled end; history retained';
  });
  await check('SMK-05','Cancel and another user rebooks',async()=>{
    await reset();const r=await create(tokenA);
    assert.equal((await authPost(tokenA,`/bookings/${r.body.booking_id}/cancel`)).status,201);
    assert.equal((await students.findOneByOrFail({stu_id:studentA.studentId})).strikes,0);
    assert.equal((await create(tokenB)).status,201);return 'API cancel/rebook passed; confirmation UI not exercised';
  });
  await check('SMK-06','No show once',async()=>{
    await reset();await create(tokenA);instant+=16*60000;
    await app.get(CronService).handleCron();await app.get(CronService).handleCron();
    assert.equal((await bookings.find())[0].status,'CANCELLED');
    assert.equal((await students.findOneByOrFail({stu_id:studentA.studentId})).strikes,1);return 'Repeated Cron did not double strike';
  });
  await check('SMK-07','Second strike and 24h unban',async()=>{
    await create(tokenA);instant+=16*60000;await app.get(CronService).handleCron();
    const s=await students.findOneByOrFail({stu_id:studentA.studentId});assert.equal(s.strikes,2);assert.equal(s.banned_until.getTime(),instant+86400000);
    assert.equal((await create(tokenA)).status,400);
    instant+=86400000;await app.get(CronService).handleCron();
    const fresh=(await login(studentA.username)).body.access_token;
    assert.equal((await students.findOneByOrFail({stu_id:studentA.studentId})).strikes,0);
    assert.equal((await authPost(fresh,'/bookings',{courtId:1,date:'2026-09-20',startTime:'11:00:00'})).status,201);
    return '2 strikes, 24h ban, rejection while banned, new booking after unban';
  });
  await reset();
  await check('REG-01','Valid registration fields',async()=>{
    const p=payload();const r=await reg(p);assert.equal(r.status,201);const s=await students.findOneByOrFail({stu_id:p.studentId});
    assert.equal(s.email,p.email);assert.equal(`${s.first_name} ${s.last_name}`,p.name);assert.equal(s.tel,p.phone);assert.equal(s.major,p.major);assert.equal(s.year,3);
    return 'All submitted fields matched DB; UI pending';
  });
  for(const field of ['studentId','email','name','phone','major','year','username','password']) await check('REG-02',`Empty required ${field}`,async()=>{
    const p=payload({[field]:''});const r=await reg(p);assert.ok(r.status>=400&&r.status<500,`HTTP ${r.status}; ${field} empty; accountCreated=${!!await students.findOneBy({username:p.username})}`);return `HTTP ${r.status}`;
  });
  for(const email of ['qa@gmail.com','qa@kmitl.ac.th.evil.test']) await check('REG-03',`Reject domain ${email}`,async()=>{const r=await reg(payload({email}));assert.equal(r.status,400);return 'HTTP 400';});
  for(const email of ['@kmitl.ac.th','qa space@kmitl.ac.th','qa@@kmitl.ac.th']) await check('REG-04',`Malformed email ${email}`,async()=>{const r=await reg(payload({email}));assert.equal(r.status,400,`Malformed email accepted: HTTP ${r.status}`);});
  for(const username of [studentA.username,'admin']) await check('REG-05',`Duplicate username ${username}`,async()=>{const r=await reg(payload({username}));assert.equal(r.status,400);return r.body.message;});
  for(const field of ['studentId','email']) await check('REG-06',`Duplicate ${field}`,async()=>{
    const original=payload();await reg(original);
    const before=await students.findOneByOrFail({stu_id:original.studentId});const r=await reg(payload({[field]:original[field]}));
    const after=await students.findOneByOrFail({stu_id:original.studentId});
    assert.equal(after.username,before.username,`Existing account overwritten; HTTP ${r.status}; username ${before.username} -> ${after.username}`);
    assert.ok(r.status>=400&&r.status<500,`HTTP ${r.status}: ${r.body.message}`);return r.body.message;
  });
  for(const studentId of ['','123456789','abcdefgh']) await check('REG-07',`Invalid student ID ${studentId}`,async()=>{const r=await reg(payload({studentId}));assert.ok(r.status>=400&&r.status<500,`HTTP ${r.status}; persisted=${!!await students.findOneBy({stu_id:studentId})}`);});
  for(const name of ['สมชาย ใจดี','Jane Mary Doe','  Jane Mary Doe  ']) await check('REG-08',`Name ${name}`,async()=>{const p=payload({name});const r=await reg(p);assert.equal(r.status,201);assert.equal(r.body.user.name,name.trim());return r.body.user.name;});
  for(const override of [{phone:'1234567890123456'},{year:'abc'}]) await check('REG-09',`Invalid ${JSON.stringify(override)}`,async()=>{const p=payload(override);const r=await reg(p);assert.ok(r.status>=400&&r.status<500,`HTTP ${r.status}; stored year=${(await students.findOneBy({stu_id:p.studentId}))?.year}`);});
  for(const year of ['0','-1','1.5','99']) await check('REG-10',`Probe year ${year}`,async()=>{const p=payload({year});const r=await reg(p);return {http:r.status,storedYear:(await students.findOneBy({stu_id:p.studentId}))?.year,policy:'NOT CONFIRMED'};});
  for(const missing of [false,true]) await check('REG-11',missing?'Missing password':'Empty password',async()=>{const p=payload({password:''});if(missing)delete p.password;const r=await reg(p);const l=await login(p.username,'password');assert.ok(r.status>=400&&r.status<500,`Registration HTTP ${r.status}; default-password login HTTP ${l.status}`);});
  await check('REG-12','Password length probe',async()=>{const observations=[];for(const password of ['a','x'.repeat(100)]){const p=payload({password});const r=await reg(p);observations.push({length:password.length,http:r.status});}return {observations,policy:'NOT CONFIRMED'};});
  await check('REG-13','Case/whitespace probe',async()=>{const p=payload({username:'QaCaseTest'});await reg(p);const out=[];for(const username of ['QaCaseTest','qacasetest',' QaCaseTest '])out.push({username,http:(await login(username)).status});return {observations:out,policy:'NOT CONFIRMED'};});
  await check('REG-14','Concurrent identical registrations',async()=>{const p=payload();const rs=await Promise.all([reg(p),reg(p)]);const count=await students.countBy({username:p.username});assert.equal(count,1);assert.equal(rs.some(r=>r.status===500),false,`Statuses ${rs.map(r=>r.status)}; DB count ${count}`);return {statuses:rs.map(r=>r.status),count,note:'API produces one account; both requests can return success; UI rapid submit not tested'};});
  await check('REG-16','Register/login excludes password hash',async()=>{const p=payload();const r=await reg(p),l=await login(p.username);assert.equal(l.status,201);for(const res of [r,l]){assert.equal(JSON.stringify(res.body).includes('password'),false);assert.equal(JSON.stringify(res.body).includes('$2b$'),false);}return 'Login succeeded; auth responses contain no password/hash';});
  // Restart last: Passport registers strategies globally in this process.
  await check('SET-02','Application restart with exported database',async()=>{
    const before=[await students.count(),await db.getRepository(Admin).count()];
    const snapshot=db.driver.export();
    const restartedDb=await new DataSource({type:'sqljs',driver:require('../../.qa-deps/node_modules/sql.js'),database:snapshot,entities:[Student,Admin,Booking,Court],synchronize:true}).initialize();
    const restartedModule=await Test.createTestingModule({imports:[AppModule]}).overrideProvider(DataSource).useValue(restartedDb).compile();
    const restartedApp=restartedModule.createNestApplication();restartedApp.useLogger(false);await restartedApp.init();
    assert.deepEqual([await restartedDb.getRepository(Student).count(),await restartedDb.getRepository(Admin).count()],before);
    await restartedApp.close();return {appRestartVerified:true,counts:before};
  });
  const report={executedAt:new RealDate().toISOString(),database:':memory:',driver:'sqljs (SQLite)',runtime:process.version,results};
  fs.writeFileSync(path.join(__dirname,'checklist-sections-1-3-results.json'),JSON.stringify(report,null,2));
  await app.close();global.Date=RealDate;
})().catch(e=>{console.error(e);process.exitCode=1;});
