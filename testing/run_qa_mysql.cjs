// Runs selected workbook cases against an isolated MySQL QA volume only.
// Required: QA_ISOLATED_DB=badminton_qa_20260928_mysql_data and DB_* from the QA compose service.
// Never use this runner on production/shared databases.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const mysql = require('../backend/node_modules/mysql2/promise');
const {execFileSync} = require('node:child_process');

const root = 'http://127.0.0.1:4001';
const expectedVolume = 'badminton_qa_20260928_mysql_data';
const resultPath = 'C:/Users/TEE/AppData/Local/hermes/cache/scratch/qa_mysql_results.json';
const results = [];
let db, studentToken, adminToken;
let counter = 70000000;
const id = () => String(++counter);
const thaiDate = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Bangkok', year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const date = thaiDate();
const tomorrow = new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(Date.now()+86400000));
const nextSlot = Math.max(8, Math.min(22, Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date()))+2));
const slot = `${String(nextSlot).padStart(2,'0')}:00`;
const slot2 = `${String(Math.min(22,nextSlot+1)).padStart(2,'0')}:00`;
const payload = (n,more={}) => ({studentId:n,username:`qa_${n}`,name:'Test Student',email:`qa${n}@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!',...more});
const safe = x => String(x ?? '').replace(/Bearer\s+\S+/g,'Bearer [redacted]').slice(0,350);
async function http(method,path,body,token) {
 const res=await fetch(root+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{'Authorization':`Bearer ${token}`}:{})},body:body===undefined?undefined:JSON.stringify(body)});
 const raw=await res.text(); let json; try{json=JSON.parse(raw)}catch{json={message:raw.slice(0,100)}}
 return {status:res.status,json};
}
async function sql(q,params=[]) {const [rows]=await db.query(q,params);return rows;}
async function register(n,more={}){return http('POST','/auth/register',payload(n,more));}
async function login(username,password){return http('POST','/auth/login',{username,password});}
async function clearFixtures(){await sql('DELETE FROM Booking');await sql("DELETE FROM users_students WHERE stu_id <> '65010000'");await sql("DELETE FROM admin WHERE admin_id <> 'A001'");await sql('UPDATE users_students SET strikes=0, banned_until=NULL WHERE stu_id=?',['65010000']);}
function expectStatus(r,status){assert.equal(r.status,status,`HTTP ${r.status}: ${safe(r.json?.message)}`)}
async function check(caseId,fn){
 try {const observation=await fn();results.push({id:caseId,status:'ผ่าน',actual:safe(observation)});}
 catch(e){results.push({id:caseId,status:'ไม่ผ่าน',actual:safe(e.message)});}
 console.log(`${caseId} ${results.at(-1).status}: ${results.at(-1).actual}`);
}
async function run(){
 if(process.env.QA_ISOLATED_DB!==expectedVolume)throw Error('Missing exact QA volume guard');
 const mounts=JSON.parse(execFileSync('docker',['inspect','badminton_mysql','--format','{{json .Mounts}}'],{encoding:'utf8'}));
 if(!mounts.some(m=>m.Type==='volume'&&m.Name===expectedVolume&&m.Destination==='/var/lib/mysql'))throw Error('Docker MySQL volume mismatch: refusing SQL writes');
 if(process.env.DB_NAME!=='badminton_db' || process.env.DB_HOST!=='127.0.0.1')throw Error('QA DB target mismatch');
 db=await mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||13306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,waitForConnections:true,connectionLimit:4,dateStrings:true});
 const [v]=await sql('SELECT DATABASE() AS db'); assert.equal(v.db,'badminton_db');
 await clearFixtures();
 await sql('DELETE FROM Court');
 await sql("INSERT INTO Court(id,name,is_active) VALUES (1,'Court 1',1),(2,'Court 2',1),(3,'Court 3',1),(4,'Court 4',1)");
 let guest=await http('GET','/courts/availability?date='+date);assert.equal(guest.json.length,4);
 const seed=await login('testuser','password'),adm=await login('admin','password');
 expectStatus(seed,201);expectStatus(adm,201);studentToken=seed.json.access_token;adminToken=adm.json.access_token;
 assert.equal(seed.json.user.role,'STUDENT');assert.equal(adm.json.user.role,'ADMIN');

 await check('TC_AUTH_002',async()=>{let r=await register(id(),{email:'outside@gmail.com'});expectStatus(r,400);assert.match(safe(r.json.message),/@kmitl.ac.th/);return '400 domain validation';});
 await check('TC_AUTH_003',async()=>{let r=await register(id(),{email:'x@kmitl.ac.th.co'});expectStatus(r,400);return '400 suffix validation';});
 await check('TC_AUTH_004',async()=>{let r=await register(id(),{username:'testuser'});expectStatus(r,400);assert.equal(r.json.message,'Username already exists');return '400 duplicate username';});
 await check('TC_AUTH_005',async()=>{let a=id(),x=await register(a);expectStatus(x,201);let b=await register(id(),{studentId:a,email:`other${a}@kmitl.ac.th`,username:`other${a}`});let rows=await sql('SELECT username FROM users_students WHERE stu_id=?',[a]);assert.equal(b.status,400,`duplicate HTTP ${b.status}; original username is ${rows[0]?.username===`qa_${a}`?'unchanged':'OVERWRITTEN'}`);assert.equal(rows[0]?.username,`qa_${a}`,'original account overwritten');return '400, original account retained';});
 await check('TC_AUTH_007',async()=>{let r=await login('testuser','password');expectStatus(r,200);assert.equal(r.json.user.role,'STUDENT');return '200 login';});
 await check('TC_AUTH_008',async()=>{let r=await login('testuser','WrongPass123');expectStatus(r,401);assert.ok(!r.json.access_token);return '401, no token';});
 await check('TC_AUTH_009',async()=>{let r=await login('no_such_user','WrongPass123');expectStatus(r,401);assert.equal(r.json.message,'Invalid credentials');return '401 generic message';});
 await check('TC_AUTH_010',async()=>{let r=await login('admin','password');expectStatus(r,201);assert.equal(r.json.user.role,'ADMIN');return '201 ADMIN login (API portion; dashboard UI not covered)';});
 await check('TC_AUTH_011',async()=>{let n=id();expectStatus(await register(n),201);let r=await sql('SELECT password FROM users_students WHERE stu_id=?',[n]);assert.match(r[0].password,/^\$2[aby]\$/);return 'bcrypt hash in isolated DB, never raw password';});
 await check('TC_AUTH_015',async()=>{let statuses=[];for(const email of ['@kmitl.ac.th','qa space@kmitl.ac.th','qa@@kmitl.ac.th']){let r=await register(id(),{email});statuses.push(r.status);}assert.deepEqual(statuses,[400,400,400]);return `statuses ${statuses}`;});
 await check('TC_AUTH_016',async()=>{let out=[];for(const v of ['', '123456789','abcdefgh']){let n=id();let r=await register(n,{studentId:v});out.push(r.status);}assert.ok(out.every(s=>s>=400&&s<500),`statuses ${out}`);return `all controlled 4xx: ${out}`;});
 await check('TC_AUTH_018',async()=>{let a=await register(id(),{phone:'0812345678901234'}),b=await register(id(),{year:'abc'});assert.ok([a.status,b.status].every(s=>s>=400&&s<500),`statuses ${a.status},${b.status}`);return 'both 4xx';});
 await check('TC_AUTH_020',async()=>{let missing=payload(id());delete missing.password;let a=await http('POST','/auth/register',missing),b=await register(id(),{password:''});assert.ok([a.status,b.status].every(s=>s>=400&&s<500),`statuses ${a.status},${b.status}`);return 'missing/empty password rejected';});
 await check('TC_AUTH_025',async()=>{let statuses=[];for(const username of ['',null,[],{}]){let r=await login(username,'bad');statuses.push(r.status)}assert.deepEqual(statuses,[401,401,401,401]);return `statuses ${statuses}`;});
 await check('TC_SEC_001',async()=>{let r=await http('GET','/bookings/me');expectStatus(r,401);return '401 guest';});
 await check('TC_SEC_002',async()=>{let r=await http('GET','/bookings/me',undefined,studentToken.slice(0,-3)+'bad');expectStatus(r,401);return '401 modified signature';});
 await check('TC_SEC_004',async()=>{let r=await http('GET','/bookings',undefined,studentToken);expectStatus(r,403);return '403 role boundary';});
 await check('TC_SEC_005',async()=>{let r=await http('GET','/users',undefined,studentToken);expectStatus(r,403);return '403, no other students';});
 await check('TC_SEC_007',async()=>{let before=await sql('SELECT COUNT(*) AS n FROM Booking');let r=await http('POST','/bookings/reset',{},studentToken);expectStatus(r,403);let after=await sql('SELECT COUNT(*) AS n FROM Booking');assert.equal(after[0].n,before[0].n);return '403, no mutation';});
 // TC_SEC_009 needs a signed test JWT lacking sub; leave it pending rather than record a fake failure.
 await check('TC_SEC_010',async()=>{let a=await login('testuser','password');assert.ok(!JSON.stringify(a.json).includes('"password"'));return 'login response has no password/hash';});
 await check('TC_SEC_020',async()=>{let r=await http('GET','/courts/availability?date='+date);expectStatus(r,200);assert.equal(r.json.length,4);assert.ok(!/email|tel|password|token/i.test(JSON.stringify(r.json)));return '4 courts, no PII in public availability';});
 await check('TC_SEC_022',async()=>{let r=await login("' OR 1=1 --",'irrelevant');expectStatus(r,401);assert.ok(!/SQL|SELECT|syntax/i.test(JSON.stringify(r.json)));return 'SQL-like login stays 401';});
 await check('TC_BOOK_005',async()=>{let r=await http('POST','/bookings',{courtId:1,date:tomorrow,startTime:slot},studentToken);expectStatus(r,400);assert.equal(r.json.message,'Day-by-day policy: You can only book courts for today.');return '400 other date';});
 await check('TC_BOOK_022',async()=>{let statuses=[];for(const t of ['10:30','ab:cd','24:00']){let r=await http('POST','/bookings',{courtId:1,date,startTime:t},studentToken);statuses.push(r.status)}assert.deepEqual(statuses,[400,400,400]);return `statuses ${statuses}`;});
 await check('TC_BOOK_024',async()=>{let statuses=[];for(const t of ['07:00','23:00']){let r=await http('POST','/bookings',{courtId:1,date,startTime:t},studentToken);statuses.push(r.status);assert.equal(r.json.message,'Booking hours are 08:00 to 23:00.')}assert.deepEqual(statuses,[400,400]);return `statuses ${statuses}`;});
 await check('TC_BOOK_029',async()=>{let statuses=[];for(const courtId of [0,-1,5,1.5,'abc',null]){let r=await http('POST','/bookings',{courtId,date,startTime:slot},studentToken);statuses.push(r.status)}let count=(await sql('SELECT COUNT(*) AS n FROM Booking'))[0].n;assert.ok(statuses.every(s=>s>=400&&s<500)&&count===0,`statuses ${statuses}; booking rows ${count}`);return `all 4xx: ${statuses}; rows=0`;});
 await sql('DELETE FROM Booking');
 await check('TC_BOOK_040',async()=>{let statuses=[];for(const body of [{date,startTime:slot},{courtId:'abc',date,startTime:slot},{courtId:1,date,startTime:1800}]){let r=await http('POST','/bookings',body,studentToken);statuses.push(r.status)}let count=(await sql('SELECT COUNT(*) AS n FROM Booking'))[0].n;assert.ok(statuses.every(s=>s>=400&&s<500)&&count===0,`statuses ${statuses}; booking rows ${count}`);return `all 4xx: ${statuses}; rows=0`;});
 await sql('DELETE FROM Booking');
 await check('TC_BOOK_001',async()=>{let r=await http('POST','/bookings',{courtId:1,date,startTime:slot},studentToken);expectStatus(r,201);assert.equal(r.json.status,'PENDING');assert.equal(r.json.court,1);return `201 booking id=${r.json.booking_id} ${slot}`;});
 await check('TC_BOOK_008',async()=>{let r=await http('POST','/bookings',{courtId:2,date,startTime:slot2},studentToken);expectStatus(r,400);assert.match(r.json.message,/active booking/);return '400 quota';});
 await check('TC_CANC_008',async()=>{let r=await http('POST','/bookings/999999/cancel',{},studentToken);expectStatus(r,404);return '404 nonexistent booking';});
 await check('TC_CANC_010',async()=>{let all=await http('GET','/bookings/me',undefined,studentToken);let b=all.json.find(x=>x.court===1&&x.status==='PENDING');assert.ok(b);let r=await http('POST',`/bookings/${b.booking_id}/cancel`,{},studentToken);expectStatus(r,201);let after=await http('GET','/bookings/me',undefined,studentToken);assert.equal(after.json.find(x=>x.booking_id===b.booking_id).status,'CANCELLED');return 'cancelled booking visible in /bookings/me';});
 await check('TC_CANC_006',async()=>{let all=await http('GET','/bookings/me',undefined,studentToken);let b=all.json.find(x=>x.status==='CANCELLED');let r=await http('POST',`/bookings/${b.booking_id}/cancel`,{},studentToken);expectStatus(r,400);return '400 repeated cancellation';});
 await check('TC_CANC_009',async()=>{let r=await http('POST','/bookings',{courtId:2,date,startTime:slot2},studentToken);expectStatus(r,201);return '201 rebook after timely cancel';});
 await check('TC_SEC_016',async()=>{let r=await http('GET','/bookings',undefined,adminToken);expectStatus(r,200);assert.ok(!/"password"\s*:/.test(JSON.stringify(r.json)));return 'admin relation response excludes password';});
 await check('TC_BOOK_030',async()=>{let r=await http('GET','/courts/availability?date='+date);expectStatus(r,200);assert.equal(r.json.length,4);assert.ok(r.json.find(c=>c.id===2).bookings.some(b=>b.status==='PENDING'));return 'availability reflects pending Court 2';});
 await check('TC_CONC_019',async()=>{let r=await http('GET','/route-that-does-not-exist',undefined,studentToken);expectStatus(r,404);return '404 unknown route (wrong method/id variants not covered)';});
 await check('TC_ADM_016',async()=>{let r=await http('GET','/bookings?date='+date,undefined,adminToken);expectStatus(r,200);assert.ok(r.json.some(b=>b.stu_id==='65010000'));return 'admin sees dated bookings';});
 await check('TC_ADM_026',async()=>{let r=await http('POST','/users/admin',{username:'qa_admin',name:'QA Admin'},adminToken);let defaultLogin=await login('qa_admin','password');assert.ok(r.status>=400&&r.status<500,`HTTP ${r.status}; default-password login HTTP ${defaultLogin.status}`);return 'reject no password';});
 await check('TC_CONC_020',async()=>{let n=id(),r=await register(n,{role:'ADMIN',strikes:2,banned_until:'2099-01-01',status:'CHECKED_IN',admin_id:'A001'});expectStatus(r,201);let row=await sql('SELECT strikes,banned_until FROM users_students WHERE stu_id=?',[n]);assert.equal(r.json.user.role,'STUDENT');assert.equal(row[0].strikes,0);assert.equal(row[0].banned_until,null);return 'extra role/status/strikes ignored for register';});
 await check('TC_SEC_009',async()=>{const jwt=require('../backend/node_modules/jsonwebtoken');const token=jwt.sign({username:'testuser',role:'STUDENT'},'DO_NOT_USE_THIS_VALUE_IN_PROD',{expiresIn:'10m'});let r=await http('GET','/bookings/me',undefined,token);expectStatus(r,200);assert.deepEqual(r.json,[]);return 'signed QA JWT missing sub returned [] (no all-user leak)';});
 await check('TC_SEC_006',async()=>{let r=await http('POST','/bookings/1/finish',{},studentToken);expectStatus(r,403);return 'student cannot finish';});
 await check('TC_AUTH_023',async()=>{let n=id(),p=payload(n),responses=await Promise.all([http('POST','/auth/register',p),http('POST','/auth/register',p)]),count=(await sql('SELECT COUNT(*) AS n FROM users_students WHERE stu_id=?',[n]))[0].n;assert.equal(count,1);assert.deepEqual(responses.map(r=>r.status).sort(),[201,400]);return 'one account; statuses 201/400';});
 await sql('DELETE FROM Booking');
 await check('TC_BOOK_010',async()=>{let a=await http('POST','/bookings',{courtId:1,date,startTime:slot},studentToken);expectStatus(a,201);let n=id(),b=await register(n);expectStatus(b,201);let r=await http('POST','/bookings',{courtId:1,date,startTime:slot},b.json.access_token);expectStatus(r,400);assert.equal(r.json.message,'This court is already booked at this time.');return 'different user, same court/slot 400';});
 await check('TC_CANC_007',async()=>{let b=(await http('GET','/bookings/me',undefined,studentToken)).json.find(x=>x.status==='PENDING');let n=id(),login=await register(n);expectStatus(login,201);let r=await http('POST',`/bookings/${b.booking_id}/cancel`,{},login.json.access_token);expectStatus(r,404);assert.equal((await sql('SELECT status FROM Booking WHERE booking_id=?',[b.booking_id]))[0].status,'PENDING');return 'other owner receives 404; booking remains PENDING';});
 await check('TC_BOOK_013',async()=>{let n=id(),r=await register(n);expectStatus(r,201);let b=await http('POST','/bookings',{courtId:2,date,startTime:slot},r.json.access_token);expectStatus(b,201);return 'different court same slot 201';});
 await check('TC_SEC_008',async()=>{let n=id(),r=await register(n);expectStatus(r,201);let mine=await http('GET','/bookings/me',undefined,studentToken);let theirs=await http('GET','/bookings/me',undefined,r.json.access_token);assert.ok(mine.json.length>0);assert.equal(theirs.json.length,0);return 'B sees no A bookings';});
 await sql('DELETE FROM Booking');
 await check('TC_CONC_001',async()=>{let n=id(),r=await register(n);expectStatus(r,201);let body={courtId:1,date,startTime:slot},responses=await Promise.all([http('POST','/bookings',body,studentToken),http('POST','/bookings',body,r.json.access_token)]),rows=await sql('SELECT booking_id FROM Booking WHERE court=1 AND booking_date=?',[date]);assert.deepEqual(responses.map(x=>x.status).sort(),[201,400],`statuses ${responses.map(x=>x.status)}`);assert.equal(rows.length,1);return 'two users, statuses 201/400, one booking';});
 await sql('DELETE FROM Booking');
 await check('TC_CONC_002',async()=>{let a={courtId:1,date,startTime:slot},b={courtId:2,date,startTime:slot},responses=await Promise.all([http('POST','/bookings',a,studentToken),http('POST','/bookings',b,studentToken)]),rows=await sql('SELECT booking_id FROM Booking WHERE stu_id=? AND booking_date=?',['65010000',date]);assert.deepEqual(responses.map(x=>x.status).sort(),[201,400],`statuses ${responses.map(x=>x.status)}`);assert.equal(rows.length,1);return 'same user, one booking 201/400';});
 await sql('DELETE FROM Booking');
 await check('TC_CONC_007',async()=>{let n=id(),r=await register(n);expectStatus(r,201);let responses=await Promise.all([http('POST','/bookings',{courtId:1,date,startTime:slot},studentToken),http('POST','/bookings',{courtId:2,date,startTime:slot2},r.json.access_token)]);assert.deepEqual(responses.map(x=>x.status).sort(),[201,201]);return 'independent courts/users both 201';});
 // A full case must exercise every stated step; partial probes above are not marked Pass.
 const partial=new Set(['TC_AUTH_010','TC_CONC_019','TC_BOOK_030','TC_BOOK_001','TC_CANC_010','TC_CONC_020']);
 for(const row of results) if(row.status==='ผ่าน'&&partial.has(row.id)) {row.status='ตรวจไม่ได้';row.actual+='; remaining UI/subcases not exercised';}
 await clearFixtures();
 const remaining=await sql('SELECT COUNT(*) AS n FROM users_students');
 const remainingBookings=await sql('SELECT COUNT(*) AS n FROM Booking');
 assert.equal(remaining[0].n,1); assert.equal(remainingBookings[0].n,0);
 const data={environment:{branch:'feature-Docx',commit:'581a654',caseBranch:'ferture-tee-testing',caseCommit:'ed3bdca',databaseVolume:expectedVolume,date,slot,started:new Date().toISOString(),cleanup:'QA fixtures removed; seed student/admin and 4 courts remain'},results};
 fs.writeFileSync(resultPath,JSON.stringify(data,null,2),'utf8');
 console.log('RESULTS',resultPath,results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}));
}
run().catch(e=>{console.error('RUN ABORTED:',safe(e.stack));process.exitCode=1}).finally(async()=>{if(db)await db.end()});
