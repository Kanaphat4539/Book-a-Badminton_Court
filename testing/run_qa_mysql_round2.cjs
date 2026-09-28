// Second isolated-MySQL QA batch: cancellation, check-in, bans, Admin, races.
// Requires QA_ISOLATED_DB guard and DB_* QA credentials; refuses shared databases.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const mysql=require('../backend/node_modules/mysql2/promise');
const out='C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court/testing/evidence/qa_mysql_round2_results.json';
const base='http://127.0.0.1:4001';const volume='badminton_qa_20260928_mysql_data';
const results=[];let db,student,admin,other;let counter=72000000;
const date=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const hour=Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',hourCycle:'h23'}).format(new Date()));
const future=`${String(Math.min(22,hour+2)).padStart(2,'0')}:00`;
async function sql(q,values=[]){return (await db.query(q,values))[0]}
async function req(method,path,body,token){let r=await fetch(base+path,{method,headers:{...(body===undefined?{}:{'Content-Type':'application/json'}),...(token?{Authorization:'Bearer '+token}:{})},body:body===undefined?undefined:JSON.stringify(body)});return {status:r.status,data:await r.json().catch(()=>({}))}}
function status(r,s){assert.equal(r.status,s,`HTTP ${r.status}: ${r.data.message||''}`)}
async function attempt(id,fn,partial=false){try{let actual=await fn();results.push({id,status:partial?'ตรวจไม่ได้':'ผ่าน',actual:String(actual).slice(0,330)+(partial?' (only part of workbook case exercised)':'')})}catch(e){results.push({id,status:'ไม่ผ่าน',actual:String(e.message).slice(0,330)})}console.log(id,results.at(-1).status,results.at(-1).actual)}
async function clean(){await sql('DELETE FROM Booking');await sql("DELETE FROM users_students WHERE stu_id<>'65010000'");await sql("DELETE FROM admin WHERE admin_id<>'A001'");await sql("UPDATE users_students SET strikes=0,banned_until=NULL WHERE stu_id='65010000'")}
async function freshStudent(){let n=String(++counter),p={studentId:n,username:'qa_'+n,name:'QA Second',email:`qa${n}@kmitl.ac.th`,phone:'0812345678',major:'IT',year:3,password:'QA-only-123!'},r=await req('POST','/auth/register',p);status(r,201);return {id:n,token:r.data.access_token}}
async function seed(stu,statusValue='PENDING',start=future,created=new Date()){
 let h=Number(start.slice(0,2)),end=`${String(h+1).padStart(2,'0')}:00:00`;
 let r=await sql('INSERT INTO Booking(stu_id,court,booking_date,time_in,time_out,status,admin_id,created_at,updated_at) VALUES(?,1,?,?,?,?,?, ?,NOW())',[stu,date,start+':00',end,statusValue,'A001',created]);
 return r.insertId;
}
async function setup(){
 if(process.env.QA_ISOLATED_DB!==volume || process.env.DB_HOST!=='127.0.0.1' || process.env.DB_NAME!=='badminton_db')throw Error('QA guard mismatch');
 let mounts=execFileSync('docker',['inspect','--format','{{range .Mounts}}{{.Name}} {{end}}','badminton_mysql'],{encoding:'utf8'});
 if(!mounts.split(/\s+/).includes(volume))throw Error('QA volume mismatch');
 db=await mysql.createPool({host:process.env.DB_HOST,port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,dateStrings:true});
 assert.equal((await sql('SELECT DATABASE() AS d'))[0].d,'badminton_db');await clean();
 let a=await req('POST','/auth/login',{username:'testuser',password:'password'}),b=await req('POST','/auth/login',{username:'admin',password:'password'});status(a,201);status(b,201);student=a.data.access_token;admin=b.data.access_token;other=await freshStudent();
}
async function run(){
 await setup();
 await attempt('TC_CANC_005',async()=>{let id=await seed('65010000','CHECKED_IN'),r=await req('POST',`/bookings/${id}/cancel`,{},student);status(r,400);assert.equal(r.data.message,'Cannot cancel. Status is currently CHECKED_IN');assert.equal((await sql('SELECT status FROM Booking WHERE booking_id=?',[id]))[0].status,'CHECKED_IN');return 'HTTP 400, CHECKED_IN unchanged'});
 await sql('DELETE FROM Booking');
 await attempt('TC_CHK_012',async()=>{let id=await seed('65010000'),r=await req('POST',`/bookings/${id}/finish`,{},admin);status(r,400);assert.equal(r.data.message,'Cannot finish. Status is currently PENDING');assert.equal((await sql('SELECT status FROM Booking WHERE booking_id=?',[id]))[0].status,'PENDING');return 'HTTP 400, PENDING unchanged'});
 await attempt('TC_CHK_003',async()=>{let id=(await sql('SELECT booking_id FROM Booking WHERE stu_id=?',['65010000']))[0].booking_id,r=await req('POST',`/bookings/${id}/check-in`,{courtId:1},student);status(r,400);assert.equal(r.data.message,'You cannot check in more than 15 minutes before the booking time starts.');assert.equal((await sql('SELECT status FROM Booking WHERE booking_id=?',[id]))[0].status,'PENDING');return `early check-in rejected before ${future}`},true);
 await attempt('TC_CHK_005',async()=>{let id=(await sql('SELECT booking_id FROM Booking WHERE stu_id=?',['65010000']))[0].booking_id,r=await req('POST',`/bookings/${id}/check-in`,{courtId:2},student);status(r,404);return 'API rejects mismatched court with 404; UI QR message not checked'},true);
 await sql('DELETE FROM Booking');
 await attempt('TC_BAN_011',async()=>{await sql("UPDATE users_students SET strikes=2,banned_until=DATE_ADD(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+07:00'),INTERVAL 1 HOUR) WHERE stu_id='65010000'");let count=(await sql('SELECT COUNT(*) AS n FROM Booking'))[0].n,r=await req('POST','/bookings',{courtId:2,date,startTime:future},student);status(r,400);assert.equal(r.data.message,'Your account is currently banned from booking courts.');assert.equal((await sql('SELECT COUNT(*) AS n FROM Booking'))[0].n,count);return 'HTTP 400; no new booking'});
 await attempt('TC_BAN_013',async()=>{await sql("UPDATE users_students SET strikes=2,banned_until=DATE_SUB(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+07:00'),INTERVAL 1 HOUR) WHERE stu_id='65010000'");let r=await req('GET','/users/me/ban-status',undefined,student);status(r,200);assert.equal(r.data.isBanned,false);assert.equal(r.data.strikes,0);let rows=await sql("SELECT strikes,banned_until FROM users_students WHERE stu_id='65010000'");assert.equal(rows[0].strikes,0);assert.equal(rows[0].banned_until,null);return '200 isBanned=false, strikes=0, DB cleared'});
 await attempt('TC_BAN_012',async()=>{let r=await sql("SELECT strikes,banned_until FROM users_students WHERE stu_id='65010000'");assert.equal(r[0].strikes,0);assert.equal(r[0].banned_until,null);return 'ban cleared by ban-status, automatic cron path not exercised'},true);
 await sql('DELETE FROM Booking');
 await attempt('TC_BAN_017',async()=>{await sql("UPDATE users_students SET strikes=2,banned_until=DATE_ADD(CONVERT_TZ(UTC_TIMESTAMP(),'+00:00','+07:00'),INTERVAL 1 HOUR) WHERE stu_id='65010000'");let r=await req('POST','/bookings',{courtId:2,date,startTime:future},other.token);status(r,201);let a=(await sql("SELECT strikes FROM users_students WHERE stu_id='65010000'"))[0].strikes,b=(await sql('SELECT strikes FROM users_students WHERE stu_id=?',[other.id]))[0].strikes;assert.equal(a,2);assert.equal(b,0);return 'B booked while A banned; strikes A=2/B=0'});
 await clean();
 await attempt('TC_CANC_015',async()=>{let id=await seed('65010000'),path=`/bookings/${id}/cancel`,responses=await Promise.all([req('POST',path,{},student),req('POST',path,{},student)]),rows=await sql("SELECT status FROM Booking WHERE booking_id=?",[id]),s=(await sql("SELECT strikes FROM users_students WHERE stu_id='65010000'"))[0].strikes;assert.deepEqual(responses.map(x=>x.status).sort(),[201,400]);assert.equal(rows[0].status,'CANCELLED');assert.equal(s,0);return 'concurrent cancel 201/400; CANCELLED, strikes=0'});
 await clean();
 await attempt('TC_ADM_019',async()=>{let id=await seed('65010000','CHECKED_IN'),path=`/bookings/${id}/finish`,responses=await Promise.all([req('POST',path,{},admin),req('POST',path,{},admin)]),row=(await sql('SELECT status FROM Booking WHERE booking_id=?',[id]))[0];assert.deepEqual(responses.map(x=>x.status).sort(),[201,400],`statuses=${responses.map(x=>x.status)}`);assert.equal(row.status,'COMPLETED');return 'one success and one rejected, COMPLETED'},true);
 await clean();
 await attempt('TC_ADM_020',async()=>{let id=await seed('65010000'),before=(await sql('SELECT COUNT(*) AS n FROM Court'))[0].n;await sql("UPDATE users_students SET strikes=1 WHERE stu_id='65010000'");let r=await req('POST','/bookings/reset',{},admin);status(r,201);assert.equal((await sql('SELECT COUNT(*) AS n FROM Booking'))[0].n,0);assert.equal((await sql("SELECT strikes FROM users_students WHERE stu_id='65010000'"))[0].strikes,1);assert.equal((await sql('SELECT COUNT(*) AS n FROM Court'))[0].n,before);assert.equal((await sql('SELECT COUNT(*) AS n FROM admin'))[0].n,1);return `reset removed booking ${id}; retained students/strikes/admin/${before} courts`});
 await clean();
 const evidence={environment:{databaseVolume:volume,branch:'feature-Docx',commit:'581a654',caseBranch:'ferture-tee-testing',caseCommit:'ed3bdca',at:new Date().toISOString(),cleanup:'QA fixtures removed'},results};
 fs.writeFileSync(out,JSON.stringify(evidence,null,2));
 console.log('RESULTS',out,results.reduce((acc,row)=>(acc[row.status]=(acc[row.status]||0)+1,acc),{}));
}
run().catch(e=>{console.error('ABORT',String(e.stack).slice(0,2000));process.exitCode=1}).finally(async()=>{if(db)await db.end()});
