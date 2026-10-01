const assert = require('node:assert/strict');
const mysql = require('../backend/node_modules/mysql2/promise');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');

const api = 'http://127.0.0.1:4001';
const volume = 'badminton_qa_20260928_mysql_data';
const started = new Date().toISOString();
const stamp = started.replace(/[:.]/g, '-');
const output = `testing/evidence/qa_pending_api_batch_${stamp}.json`;
const fixtureOutput = `testing/evidence/qa_pending_api_batch_fixtures_${stamp}.json`;
const leakedBookings = new Set();
const prefix = `q${Date.now().toString().slice(-10)}`;
const sourceFingerprint = require('crypto').createHash('sha256').update(require('fs').readFileSync('backend/src/auth/auth.service.ts')).update(require('fs').readFileSync('backend/src/bookings/bookings.service.ts')).update(require('fs').readFileSync('backend/src/users/users.service.ts')).digest('hex');
const students = Array.from({ length: 9 }, (_, i) => ({
  id: `${Date.now().toString().slice(-6)}${String(i).padStart(2, '0')}`,
  username: `${prefix}${i}`,
}));
const results = [];
const observations = [];
let db;

async function sql(query, params = []) { return (await db.query(query, params))[0]; }
async function request(method, path, body, token) {
  const response = await fetch(api + path, {
    method,
    headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...(token ? { authorization: `Bearer ${token}` } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: response.status, body: await response.json().catch(() => null) };
}
async function record(id, operation) {
  try { results.push({ id, status: 'PASS', actual: await operation() }); }
  catch (error) { results.push({ id, status: 'FAIL', actual: String(error.message).slice(0, 500) }); }
  console.log(id, results.at(-1).status, results.at(-1).actual);
}
async function observe(id, operation) {
  try { observations.push({ id, status: 'API_SUBCHECK', actual: await operation() }); }
  catch (error) { observations.push({ id, status: 'API_SUBCHECK_FAILED', actual: String(error.message).slice(0, 500) }); }
  console.log(id, observations.at(-1).status, observations.at(-1).actual);
}
async function main() {
  const mounts = JSON.parse(execFileSync('docker', ['inspect', 'badminton_mysql', '--format', '{{json .Mounts}}'], { encoding: 'utf8' }));
  assert.ok(mounts.some(m => m.Type === 'volume' && m.Name === volume && m.Destination === '/var/lib/mysql'), 'unexpected DB volume');
  const image = execFileSync('docker', ['inspect', 'badminton_qa_backend', '--format', '{{.Image}}'], { encoding: 'utf8' }).trim();
  const sourceFiles = ['auth/auth.service.ts', 'bookings/bookings.service.ts', 'users/users.service.ts', 'bookings/bookings.controller.ts'];
  const sourceHashes = {};
  for (const file of sourceFiles) {
    const local = execFileSync('sha256sum', [`backend/src/${file}`], { encoding: 'utf8' }).split(/\s+/)[0];
    const inImage = execFileSync('docker', ['exec', 'badminton_qa_backend', 'sha256sum', `/app/src/${file}`], { encoding: 'utf8' }).split(/\s+/)[0];
    assert.equal(inImage, local, `image source mismatch ${file}`);
    sourceHashes[file] = local;
  }
  db = await mysql.createConnection({ host: '127.0.0.1', port: 13306, user: 'badminton_user', password: 'password', database: 'badminton_db', dateStrings: true });
  assert.equal(Number((await sql('SELECT COUNT(*) n FROM Booking'))[0].n), 0, 'QA bookings are not empty; abort');
  assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username LIKE ?', [`${prefix}%`]))[0].n),0,'fixture username prefix collision; abort');
  assert.equal(Number((await sql('SELECT COUNT(*) n FROM admin WHERE username LIKE ?', [`${prefix}%`]))[0].n),0,'fixture admin prefix collision; abort');
  for (const student of students) {
    const present = Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=? OR username=?', [student.id, student.username]))[0].n);
    assert.equal(present, 0, 'fixture collision');
  }
  const tokens = []; const createdStudentIds = []; const createdUsernames = [];
  let duplicateBookedStudent = null;
  try {
    const usernames = students.map(s => s.username);
    const rowPresent = async (username, id) => Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=? AND stu_id=?', [username, id]))[0].n) === 1;
    for (let i = 0; i < students.length; i++) {
      const s = students[i]; const username = usernames[i];
      const r = await request('POST', '/auth/register', { studentId: s.id, username, name: `Batch QA ${s.id}`, email: `${username}@kmitl.ac.th`, phone: '0812345678', major: 'IT', year: 3, password: 'QA-only-123!' });
      const exists = await rowPresent(username, s.id);
      if (exists) { createdStudentIds.push(s.id); createdUsernames.push(username); }
      tokens.push(r.body?.access_token ?? null);
      if (i < 8 && (!exists || !tokens[i])) throw new Error(`isolated register fixture ${i} incomplete`);
    }
    fs.writeFileSync(fixtureOutput, JSON.stringify({ started, head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), fixtureStudentIds: students.map(x => x.id), createdStudentIds, createdUsernames, registrations: students.map((x, i) => ({ username: x.username, studentId: x.id, status: tokens[i] ? 201 : 'failed' })) }, null, 2));
    assert.equal(createdStudentIds.length, students.length, 'all base users should exist');
    duplicateBookedStudent = students[7].id;
  } catch (error) {
    const cleanupTargets = new Set(createdStudentIds);
    if (fs.existsSync(fixtureOutput)) {
      const prior = JSON.parse(fs.readFileSync(fixtureOutput, 'utf8'));
      const updatedCreated = [...new Set([...prior.createdStudentIds, ...createdStudentIds])];
      prior.createdStudentIds = updatedCreated;
      const createdNames = prior.createdUsernames ?? [];
      const batchNames = [...new Set([...createdNames, ...createdUsernames])];
      prior.createdUsernames = batchNames;
      fs.writeFileSync(fixtureOutput, JSON.stringify(prior, null, 2));
      for (const id of updatedCreated) cleanupTargets.add(id);
    } else {
      for (const s of students) {
        const exists = Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=? AND username=?', [s.id, s.username]))[0].n);
        if (exists === 1) cleanupTargets.add(s.id);
      }
    }
    if (cleanupTargets.size) {
      const ids = [...cleanupTargets];
      await sql('DELETE FROM Booking WHERE stu_id IN (' + ids.map(() => '?').join(',') + ')', ids);
      const fixtureNames = [...new Set([...createdUsernames,...students.map((_,i)=>`${prefix}fresh${i}`)])];
      if(fixtureNames.length) await sql('DELETE FROM users_students WHERE username IN ('+fixtureNames.map(()=>'?').join(',')+')',fixtureNames);
    }
    throw error;
  }
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date());
  const booking = (student, court, start) => request('POST', '/bookings', { courtId: court, date: day, startTime: start }, tokens[student]);
  const sessions = new Map();
  const freshSession = async (index) => {
    const username = `${prefix}fresh${index}`; const id = `${Date.now().toString().slice(-6)}${String(60+index).padStart(2,'0')}`;
    const exists=Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=? OR username=?',[id,username]))[0].n);assert.equal(exists,0);
    const r = await request('POST','/auth/register',{studentId:id,username,name:'QA Fresh Session',email:`${username}@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
    assert.equal(r.status,201,`fresh session fixture ${index} HTTP ${r.status}`);
    sessions.set(index,{id,username,token:r.body.access_token}); return sessions.get(index);
  };

  await record('TC_AUTH_002', async () => {
    const id=`${Date.now().toString().slice(-8)}`; const username=`${prefix}domain`;
    const r=await request('POST','/auth/register',{studentId:id,username,name:'QA Domain',email:`${username}@example.org`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
    assert.equal(r.status,400,`wrong-domain email expected 400, got ${r.status}`);
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=? OR stu_id=?',[username,id]))[0].n),0);
    return `wrong-domain registration HTTP ${r.status}; account absent`;
  });
  await record('TC_AUTH_003', async () => {
    const id=`${Date.now().toString().slice(-8)}`; const username=`${prefix}suffix`;
    const r=await request('POST','/auth/register',{studentId:id,username,name:'QA Domain Suffix',email:`${username}@kmitl.ac.th.example.org`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
    assert.equal(r.status,400,`domain suffix attack expected 400, got ${r.status}`);
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=? OR stu_id=?',[username,id]))[0].n),0);
    return `email ending in allowed-domain-plus-untrusted-suffix HTTP ${r.status}; account absent`;
  });
  await record('TC_AUTH_004', async () => {
    const candidateId=`${Date.now().toString().slice(-8)}`; const original=(await sql('SELECT stu_id,username,email FROM users_students WHERE stu_id=?',[students[0].id]))[0];
    assert.ok(original);
    const r=await request('POST','/auth/register',{studentId:candidateId,username:original.username,name:'QA Duplicate Username',email:`${prefix}dupeuser@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
    assert.equal(r.status,400,`duplicate username expected 400, got ${r.status}`);
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=?',[candidateId]))[0].n),0);
    const after=(await sql('SELECT stu_id,username,email FROM users_students WHERE stu_id=?',[students[0].id]))[0]; assert.deepEqual(after,original);
    return `duplicate username HTTP ${r.status}; attempted ID absent; original account unchanged`;
  });
  await record('TC_AUTH_005', async () => {
    const username=`${prefix}dupeid`; const original=(await sql('SELECT stu_id,username,email FROM users_students WHERE stu_id=?',[students[0].id]))[0];
    assert.ok(original);
    const r=await request('POST','/auth/register',{studentId:original.stu_id,username,name:'QA Duplicate ID',email:`${username}@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
    assert.equal(r.status,400,`duplicate student ID expected controlled 400, got ${r.status}`);
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=?',[username]))[0].n),0);
    const after=(await sql('SELECT stu_id,username,email FROM users_students WHERE stu_id=?',[original.stu_id]))[0]; assert.deepEqual(after,original);
    return `duplicate student ID HTTP ${r.status}; no partial second account; original unchanged`;
  });
  await record('TC_AUTH_008', async () => {
    const r=await request('POST','/auth/login',{username:students[0].username,password:'QA-wrong-password'});
    assert.equal(r.status,401); assert.equal(r.body.message,'Invalid credentials'); assert.equal(r.body.access_token,undefined);
    return `wrong password login HTTP ${r.status}; generic Invalid credentials; no access token`;
  });
  await record('TC_AUTH_009', async () => {
    const known=await request('POST','/auth/login',{username:students[0].username,password:'QA-wrong-password'});
    const absent=await request('POST','/auth/login',{username:`${prefix}missing`,password:'QA-wrong-password'});
    assert.equal(known.status,401); assert.equal(absent.status,401); assert.equal(absent.body.message,known.body.message);
    return `known-wrong/unknown-user login HTTP ${known.status}/${absent.status}; identical generic error`;
  });
  await record('TC_AUTH_011', async () => {
    const row=(await sql('SELECT password FROM users_students WHERE stu_id=? AND username=?',[students[0].id,students[0].username]))[0];
    assert.ok(row&&/^\$2[ab]\$/.test(row.password),'stored password is not bcrypt');
    return `isolated student password at rest uses bcrypt prefix ${row.password.slice(0,4)}; plaintext absent`;
  });
  await record('TC_AUTH_015', async () => {
    const cases = ['qa space@kmitl.ac.th', 'qa@@kmitl.ac.th', 'qa@outside.edu']; const statuses=[]; const probeIds=[]; const probeUsers=[];
    try {
      for(let i=0;i<cases.length;i++) {
        const id=`${Date.now().toString().slice(-6)}${10+i}`; const username=`${prefix}email${i}`; probeIds.push(id); probeUsers.push(username);
        assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=? OR username=?',[id,username]))[0].n),0);
        const r=await request('POST','/auth/register',{studentId:id,username,name:'QA Invalid Email',email:cases[i],phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
        statuses.push(r.status);
      }
      assert.deepEqual(statuses,[400,400,400],`expected invalid emails all HTTP 400, got ${statuses.join('/')}`);
      for(const username of probeUsers) assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=?',[username]))[0].n),0,'invalid email unexpectedly persisted');
    } finally {
      for(const username of probeUsers) { const rows=await sql('SELECT stu_id FROM users_students WHERE username=?',[username]); for(const row of rows) await sql('DELETE FROM Booking WHERE stu_id=?',[row.stu_id]); await sql('DELETE FROM users_students WHERE username=?',[username]); }
    }
    return `three distinct invalid-email registrations HTTP ${statuses.join('/')}; no accounts persisted`;
  });
  await record('TC_AUTH_016', async () => {
    const malformedIds = ['','123456789','abcdefgh']; const statuses=[];
    try {
      for (let i=0;i<malformedIds.length;i++) {
      const username=`${prefix}badid${i}`;
      const response=await request('POST','/auth/register',{studentId:malformedIds[i],username,name:'QA Boundary',email:`${username}@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'});
      statuses.push(response.status);
    }
    assert.deepEqual(statuses,[400,400,400],`expected malformed student IDs controlled 4xx, got ${statuses.join('/')}`);
    } finally {
      for (let i=0;i<malformedIds.length;i++) {
        const username=`${prefix}badid${i}`;
        const rows=(await sql('SELECT stu_id FROM users_students WHERE username=?',[username]));
        for(const row of rows) await sql('DELETE FROM Booking WHERE stu_id=?',[row.stu_id]);
        await sql('DELETE FROM users_students WHERE username=?',[username]);
      }
    }
    return `raw malformed ID values (empty/9 digits/alphabetic) HTTP ${statuses.join('/')}; none persisted`;
  });
  await record('TC_AUTH_020', async () => {
    const probe = `${prefix}pw`;
    const usernames=[`${probe}missing`,`${probe}empty`];
    try {
      const missing = await request('POST', '/auth/register', { studentId: `${Date.now().toString().slice(-6)}21`, username: usernames[0], name: 'QA No Password', email: `${usernames[0]}@kmitl.ac.th`, phone: '0812345678', major: 'IT', year: 3 });
      const empty = await request('POST', '/auth/register', { studentId: `${Date.now().toString().slice(-6)}22`, username: usernames[1], name: 'QA No Password', email: `${usernames[1]}@kmitl.ac.th`, phone: '0812345678', major: 'IT', year: 3, password: '' });
      assert.ok(missing.status>=400&&missing.status<500&&empty.status>=400&&empty.status<500,`missing/empty password expected 4xx, got ${missing.status}/${empty.status}`);
      for(const username of usernames) assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username=?',[username]))[0].n),0,'passwordless account persisted');
      return `missing/empty password rejected HTTP ${missing.status}/${empty.status}; no rows persisted`;
    } finally {
      for(const username of usernames) { const rows=await sql('SELECT stu_id FROM users_students WHERE username=?',[username]); for(const row of rows) await sql('DELETE FROM Booking WHERE stu_id=?',[row.stu_id]); await sql('DELETE FROM users_students WHERE username=?',[username]); }
    }
  });
  await record('TC_AUTH_025', async () => {
    const userFixtures = [
      { id: students[0].id, username: students[0].username },
      { id: `${Date.now().toString().slice(-6)}41`, username: `${prefix}array` },
      { id: `${Date.now().toString().slice(-6)}42`, username: `${prefix}object` },
      { id: `${Date.now().toString().slice(-6)}43`, username: `${prefix}number` },
    ];
    const payloads = [null, [], {}, 15]; const statuses = [];
    try {
      for (let i = 1; i < userFixtures.length; i++) {
        const f = userFixtures[i]; const existing=Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=? OR username=?',[f.id,f.username]))[0].n);
        assert.equal(existing,0,`login fixture collision ${i}`);
        const seed = await request('POST', '/auth/register', { studentId: f.id, username: f.username, name: 'QA Login Type', email: `${f.username}@kmitl.ac.th`, phone: '0812345678', major: 'IT', year: 3, password: 'QA-only-123!' });
        assert.equal(seed.status, 201, `nonstring username control account ${i} HTTP ${seed.status}`);
      }
      for (let i = 0; i < payloads.length; i++) {
        const r = await request('POST', '/auth/login', { username: payloads[i], password: 'not-a-password' });
        statuses.push(r.status);
      }
    } finally {
      for (const f of userFixtures.slice(1)) {
        const rows=await sql('SELECT stu_id FROM users_students WHERE username=? AND stu_id=?',[f.username,f.id]);
        for(const row of rows) await sql('DELETE FROM Booking WHERE stu_id=?',[row.stu_id]);
        await sql('DELETE FROM users_students WHERE username=? AND stu_id=?',[f.username,f.id]);
      }
    }
    assert.deepEqual(statuses,[401,401,401,401],`non-string username cases should be controlled 401, got ${statuses.join('/')}`);
    const missingPassword = await request('POST', '/auth/login', { username: `${prefix}notfound` });
    assert.equal(missingPassword.status, 401, `missing password should return generic 401; got ${missingPassword.status}`);
    return `non-string username types HTTP ${statuses.join('/')}; absent password HTTP ${missingPassword.status}`;
  });
  await record('TC_BOOK_008', async () => {
    const token = tokens[1];
    assert.ok(token, 'student 1 auth token missing');
    await sql('UPDATE users_students SET quota=1 WHERE stu_id=?', [students[1].id]);
    const first = await request('POST', '/bookings', { courtId: 1, date: day, startTime: '18:00' }, token);
    assert.equal(first.status, 201, JSON.stringify(first.body));
    const second = await request('POST', '/bookings', { courtId: 2, date: day, startTime: '20:00' }, token);
    assert.equal(second.status, 400, JSON.stringify(second.body));
    assert.match(String(second.body.message), /active booking|quota/i);
    return `same isolated student first/second booking HTTP ${first.status}/${second.status}: ${second.body.message}`;
  });
  await record('TC_BOOK_010', async () => {
    const competitor=await freshSession(2); const target=await freshSession(8);
    const first=await request('POST','/bookings',{courtId:1,date:day,startTime:'20:00'},competitor.token);
    const second=await request('POST','/bookings',{courtId:1,date:day,startTime:'20:00'},target.token);
    assert.equal(first.status,201,JSON.stringify(first.body));
    assert.equal(second.status,400,JSON.stringify(second.body));
    assert.equal(second.body.message,'This court is already booked at this time.',JSON.stringify(second.body));
    return `different students same court/time HTTP ${first.status}/${second.status}; exact conflict message verified`;
  });
  await record('TC_BOOK_013', async () => {
    const freshA=await freshSession(3); const freshB=await freshSession(4);
    const a=await request('POST','/bookings',{courtId:1,date:day,startTime:'21:00'},freshA.token);
    const b=await request('POST','/bookings',{courtId:2,date:day,startTime:'21:00'},freshB.token);
    assert.equal(a.status,201,JSON.stringify(a.body)); assert.equal(b.status,201,JSON.stringify(b.body));
    assert.notEqual(a.body.booking_id,b.body.booking_id);
    return `same time separate courts HTTP ${a.status}/${b.status}, IDs ${a.body.booking_id}/${b.body.booking_id}`;
  });
  await record('TC_BOOK_029', async () => {
    const userA = await freshSession(1); const userB = await freshSession(6);
    const badCourt = await request('POST', '/bookings', { courtId: 999, date: day, startTime: '21:00' }, userA.token);
    const stringCourt = await request('POST', '/bookings', { courtId: 'abc', date: day, startTime: '21:00' }, userB.token);
    for(const [response,user] of [[badCourt,userA],[stringCourt,userB]]) if(response.status===201&&response.body?.booking_id){leakedBookings.add(response.body.booking_id);await sql('DELETE FROM Booking WHERE booking_id=?',[response.body.booking_id]);}
    assert.ok([badCourt.status,stringCourt.status].every(s=>s>=400&&s<500),`malformed/nonexistent court must be controlled 4xx, got ${badCourt.status}/${stringCourt.status}`);
    const persisted=Number((await sql('SELECT COUNT(*) n FROM Booking WHERE stu_id IN (?,?)',[userA.id,userB.id]))[0].n);
    assert.equal(persisted,0,'invalid court attempt persisted a booking');
    return `courtId 999/string HTTP ${badCourt.status}/${stringCourt.status}; no booking persisted`;
  });
  await record('TC_BOOK_040', async () => {
    const cases=[{}, {courtId:1,date:day,startTime:2100}, {courtId:1,date:day,startTime:'99:00'}]; const statuses=[]; const fixtures=[];
    for(let i=0;i<cases.length;i++) {
      const user=await freshSession(9+i); fixtures.push(user);
      const response=await request('POST','/bookings',cases[i],user.token); statuses.push(response.status);
      if(response.status===201&&response.body?.booking_id){leakedBookings.add(response.body.booking_id);await sql('DELETE FROM Booking WHERE booking_id=?',[response.body.booking_id]);}
    }
    assert.ok(statuses.every(s=>s>=400&&s<500),`missing/invalid booking payload expected controlled 4xx, got ${statuses.join('/')}`);
    const persisted=Number((await sql('SELECT COUNT(*) n FROM Booking WHERE stu_id IN ('+fixtures.map(()=>'?').join(',')+')',fixtures.map(x=>x.id)))[0].n);
    assert.equal(persisted,0,'invalid booking payload persisted');
    return `missing fields/wrong time type/out-of-range time HTTP ${statuses.join('/')}; no booking persisted`;
  });
  await record('TC_ADM_007', async () => {
    const login=await request('POST','/auth/login',{username:'admin',password:'password'}); assert.equal(login.status,201);
    const response=await request('GET','/users',undefined,login.body.access_token); assert.equal(response.status,200);
    assert.ok(Array.isArray(response.body),'Admin users API did not return a user list');
    const leaked=response.body.filter(user=>Object.hasOwn(user,'password')).length;
    assert.equal(leaked,0,`${leaked} user records exposed password properties`);
    return `Admin users API HTTP 200; users=${response.body.length}; records with password field=${leaked}`;
  });
  await observe('TC_SEC_018 API subcheck', async () => {
    const response=await request('GET','/users',undefined,tokens[8]);
    assert.equal(response.status,403);
    return `student role GET /users HTTP ${response.status}; full browser route redirection not tested`;
  });
  await observe('TC_ADM_008 API subcheck', async () => {
    const login=await request('POST','/auth/login',{username:'admin',password:'password'}); assert.equal(login.status,201);
    const username=`${prefix}admin`; const adminId=`Q${Date.now().toString().slice(-9)}`;
    const create=await request('POST','/users/admin',{admin_id:adminId,username,name:'QA Batch Admin',password:'QA-only-admin-123!'},login.body.access_token);
    assert.equal(create.status,201);
    const row=(await sql('SELECT password FROM admin WHERE username=?',[username]))[0]; assert.ok(row); assert.notEqual(row.password,'QA-only-admin-123!');
    const signIn=await request('POST','/auth/login',{username,password:'QA-only-admin-123!'}); assert.equal(signIn.status,201);
    return `admin create HTTP ${create.status}; bcrypt persisted; created account login HTTP ${signIn.status}; UI toast not checked`;
  });
  await observe('TC_ADM_009 API subcheck', async () => {
    const login=await request('POST','/auth/login',{username:'admin',password:'password'}); assert.equal(login.status,201);
    const targetId=students[7].id;
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM Booking WHERE stu_id=?',[targetId]))[0].n),0);
    const removed=await request('DELETE',`/users/${targetId}`,undefined,login.body.access_token); assert.equal(removed.status,200);
    assert.equal(Number((await sql('SELECT COUNT(*) n FROM users_students WHERE stu_id=?',[targetId]))[0].n),0);
    return `admin DELETE isolated user HTTP ${removed.status}; row absent; response body/UI toast not checked`;
  });
  const cleanup = {};
  try {
    await sql('DELETE FROM Booking WHERE stu_id IN (SELECT stu_id FROM users_students WHERE username LIKE ?)',[`${prefix}%`]);
    await sql('DELETE FROM users_students WHERE username LIKE ?', [`${prefix}%`]);
    await sql('DELETE FROM admin WHERE username LIKE ?', [`${prefix}%`]);
    cleanup.remainingBookings = Number((await sql('SELECT COUNT(*) n FROM Booking'))[0].n);
    cleanup.remainingBatchStudents = Number((await sql('SELECT COUNT(*) n FROM users_students WHERE username LIKE ?', [`${prefix}%`]))[0].n);
    cleanup.remainingBatchAdmins = Number((await sql('SELECT COUNT(*) n FROM admin WHERE username LIKE ?', [`${prefix}%`]))[0].n);
  } catch (error) {
    for (const id of students.map(s=>s.id)) {
      await sql('DELETE FROM Booking WHERE stu_id=?',[id]);
      const row=(await sql('SELECT username FROM users_students WHERE stu_id=?',[id]))[0];
      if(row&&String(row.username).startsWith(prefix)) await sql('DELETE FROM users_students WHERE stu_id=?',[id]);
    }
    for(const s of sessions.values()) {
      await sql('DELETE FROM Booking WHERE stu_id=?',[s.id]);
      await sql('DELETE FROM users_students WHERE stu_id=?',[s.id]);
    }
    await sql('DELETE FROM admin WHERE username LIKE ?', [`${prefix}%`]);
    throw error;
  } finally {
    const passed = results.filter(x => x.status === 'PASS').length;
    const evidence = {
      environment: { started, head: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), backendImage: image, sourceHashes, databaseVolume: volume, api, fixtureStrategy: 'unique per-run student IDs/usernames; exact IDs checked absent before insertion', cleanup },
      summary: { cases: results.length, passed, failed: results.length - passed }, results,
    };
    fs.writeFileSync(output, JSON.stringify(evidence, null, 2));
    console.log('EVIDENCE', output, JSON.stringify(evidence.summary), JSON.stringify(cleanup));
    await db.end();
  }
}
main().catch(error => { console.error('ABORT', error.stack); process.exitCode = 1; });