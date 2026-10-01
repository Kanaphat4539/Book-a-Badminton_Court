// Time-bound service/cron tests backed by the isolated QA MySQL volume.
// Uses Node's mocked Date and real TypeORM repositories; it does NOT validate
// browser QR capture or real scheduler cadence. Never target a shared database.
require('../backend/node_modules/reflect-metadata');
const assert=require('node:assert/strict');
const {mock}=require('node:test');
const fs=require('node:fs');
const {execFileSync}=require('node:child_process');
const {DataSource}=require('../backend/node_modules/typeorm');
const {Booking}=require('../backend/dist/bookings/entities/booking.entity');
const {Student}=require('../backend/dist/users/entities/student.entity');
const {Admin}=require('../backend/dist/users/entities/admin.entity');
const {Court}=require('../backend/dist/courts/entities/court.entity');
const {BookingsService}=require('../backend/dist/bookings/bookings.service');
const {CronService}=require('../backend/dist/cron/cron.service');
const out='C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court/testing/evidence/qa_mysql_time_results.json';
const volume='badminton_qa_20260928_mysql_data';const today='2026-09-28';const seedUser='65010000';
let ds,br,sr,booking,cron;const results=[];
function at(day,time){mock.timers.setTime(Date.parse(`${day}T${time}+07:00`));}
async function reset(){await br.clear();await sr.update({stu_id:seedUser},{strikes:0,banned_until:null});}
async function fixture({day=today,start='18:00:00',end,created='17:00:00',status='PENDING',stu=seedUser,court=1}={}){
 const ending=end??`${String(Number(start.slice(0,2))+1).padStart(2,'0')}:00:00`;
 let b=br.create({stu_id:stu,court,booking_date:day,time_in:start,time_out:ending,status,admin_id:'A001',created_at:created===null?null:new Date(`${day}T${created}+07:00`)});
 return br.save(b);
}
async function state(id){return br.findOneByOrFail({booking_id:id})}
async function strikes(){return sr.findOneByOrFail({stu_id:seedUser})}
async function check(id,fn,partial=false){try{await reset();let actual=await fn();results.push({id,status:partial?'ตรวจไม่ได้':'ผ่าน',actual:String(actual).slice(0,340)+(partial?'; only service/cron path, not physical UI':'')})}catch(e){results.push({id,status:'ไม่ผ่าน',actual:String(e.message).slice(0,340)})}console.log(id,results.at(-1).status,results.at(-1).actual)}
async function rejected(fn,code,message){try{await fn();throw new Error('operation succeeded unexpectedly')}catch(e){if(e.message==='operation succeeded unexpectedly')throw e;assert.equal(e.getStatus?.(),code);if(message)assert.equal(e.message,message);return `${code} ${e.message}`}}
async function main(){
 if(process.env.QA_ISOLATED_DB!==volume||process.env.DB_NAME!=='badminton_db'||process.env.DB_HOST!=='127.0.0.1')throw Error('QA DB guard failed');
 let mounts=execFileSync('docker',['inspect','--format','{{range .Mounts}}{{.Name}} {{end}}','badminton_mysql'],{encoding:'utf8'});
 if(!mounts.split(/\s+/).includes(volume))throw Error('not isolated QA volume');
 ds=new DataSource({type:'mysql',host:'127.0.0.1',port:Number(process.env.DB_PORT||13306),username:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME,entities:[Booking,Student,Admin,Court],synchronize:false});
 await ds.initialize();br=ds.getRepository(Booking);sr=ds.getRepository(Student);booking=new BookingsService(br,sr,ds.getRepository(Admin));cron=new CronService(br,sr);
 await reset();mock.timers.enable({apis:['Date'],now:Date.parse('2026-09-28T17:00:00+07:00')});
 await check('TC_CANC_002',async()=>{let b=await fixture();at(today,'18:14:59');await booking.cancelBooking(b.booking_id,seedUser);assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,0);return '18:14:59 CANCELLED, strikes=0'},true);
 await check('TC_CANC_003',async()=>{let b=await fixture();at(today,'18:15:00');await booking.cancelBooking(b.booking_id,seedUser);let s=await strikes();assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal(s.strikes,1);assert.equal(s.banned_until,null);return '18:15:00 CANCELLED, strikes=1, no ban'},true);
 await check('TC_CANC_004',async()=>{await sr.update({stu_id:seedUser},{strikes:1,banned_until:null});let b=await fixture();at(today,'18:15:00');await booking.cancelBooking(b.booking_id,seedUser);let s=await strikes();assert.equal(s.strikes,2);assert.equal(+new Date(s.banned_until)-Date.now(),86400000);return 'second late cancel: strikes=2, ban exactly +24h'},true);
 await check('TC_CANC_013',async()=>{let b=await fixture({start:'10:00:00',end:'11:00:00',created:'10:50:00'});at(today,'11:00:00');await booking.cancelBooking(b.booking_id,seedUser);assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,0);return 'short round end 11:00, no strike'},true);
 await check('TC_CANC_014',async()=>{let b=await fixture({start:'10:00:00',created:'09:00:00'});at(today,'10:20:00');await booking.cancelBooking(b.booking_id,seedUser);assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,1);return 'manual late cancel before cron, strikes=1'},true);
 await check('TC_CHK_004',async()=>{let b=await fixture({court:2});at(today,'17:45:00');await booking.checkIn(b.booking_id,seedUser,2);assert.equal((await state(b.booking_id)).status,'CHECKED_IN');return '17:45:00 accepted; no camera scan'},true);
 await check('TC_CHK_015',async()=>{let b=await fixture({start:'10:00:00',created:'09:00:00',court:2});at(today,'10:15:00');let r=await rejected(()=>booking.checkIn(b.booking_id,seedUser,2),400,'The check-in period has ended.');assert.equal((await state(b.booking_id)).status,'PENDING');return r+'; remains PENDING'},true);
 await check('TC_CHK_016',async()=>{let b=await fixture({start:'10:00:00',created:'09:00:00',court:2});at(today,'10:14:59');await booking.checkIn(b.booking_id,seedUser,2);assert.equal((await state(b.booking_id)).status,'CHECKED_IN');return '10:14:59 CHECKED_IN'},true);
 await check('TC_CHK_017',async()=>{let a=await fixture({start:'10:00:00',created:'10:30:00',court:2});at(today,'10:44:59');await booking.checkIn(a.booking_id,seedUser,2);assert.equal((await state(a.booking_id)).status,'CHECKED_IN');await br.clear();let b=await fixture({start:'10:00:00',created:'10:30:00',court:2});at(today,'10:45:00');let r=await rejected(()=>booking.checkIn(b.booking_id,seedUser,2),400,'The check-in period has ended.');assert.equal((await state(b.booking_id)).status,'PENDING');return '10:44:59 accepted; 10:45:00 '+r},true);
 await check('TC_CHK_018',async()=>{let a=await fixture({start:'10:00:00',created:'10:50:00',court:2});at(today,'10:59:59');await booking.checkIn(a.booking_id,seedUser,2);assert.equal((await state(a.booking_id)).status,'CHECKED_IN');await br.clear();let b=await fixture({start:'10:00:00',created:'10:50:00',court:2});at(today,'11:00:00');let r=await rejected(()=>booking.checkIn(b.booking_id,seedUser,2),400,'The check-in period has ended.');return '10:59:59 accepted; 11:00:00 '+r},true);
 await check('TC_CHK_019',async()=>{let a=await fixture({start:'10:00:00',created:null,court:2});at(today,'10:14:59');await booking.checkIn(a.booking_id,seedUser,2);await br.clear();let b=await fixture({start:'10:00:00',created:null,court:2});at(today,'10:15:00');await rejected(()=>booking.checkIn(b.booking_id,seedUser,2),400,'The check-in period has ended.');return 'legacy created_at null: 10:14:59 accepted; 10:15:00 rejected'},true);
 await check('TC_CHK_027',async()=>{let b=await fixture({start:'10:00:00',created:'10:30:00',court:2});at(today,'10:45:00');let r=await rejected(()=>booking.checkIn(b.booking_id,seedUser,2),400,'The check-in period has ended.');assert.equal((await state(b.booking_id)).status,'PENDING');return r+'; PENDING'},true);
 await check('TC_BAN_004',async()=>{let b=await fixture();at(today,'18:14:30');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'PENDING');assert.equal((await strikes()).strikes,0);return '18:14:30 pending, strikes=0'},true);
 await check('TC_BAN_005',async()=>{let b=await fixture();at(today,'18:15:00');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,1);return '18:15:00 cancelled, strikes=1'},true);
 await check('TC_BAN_003',async()=>{let b=await fixture();at(today,'18:15:00');await cron.handleCron();await cron.handleCron();await cron.handleCron();assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,1);assert.equal((await strikes()).banned_until,null);return 'cron called three times, one strike and no ban'});
 await check('TC_BAN_006',async()=>{let b=await fixture();at(today,'18:15:00');await cron.handleCron();let s=await strikes();assert.equal(s.strikes,1);assert.equal(s.banned_until,null);return 'first strike=1, no ban'});
 await check('TC_BAN_007',async()=>{await sr.update({stu_id:seedUser},{strikes:1});let b=await fixture();at(today,'18:15:00');await cron.handleCron();let s=await strikes();assert.equal(s.strikes,2);assert.equal(+new Date(s.banned_until)-Date.now(),86400000);return 'second strike=2, ban +24h'});
 await check('TC_BAN_008',async()=>{let first=await fixture({day:'2026-09-27',created:'17:00:00'});at('2026-09-27','18:15:00');await cron.handleCron();assert.equal((await state(first.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,1);await fixture({day:today});at(today,'18:15:00');await cron.handleCron();let s=await strikes();assert.equal(s.strikes,2);assert.equal(+new Date(s.banned_until)-Date.now(),86400000);return 'strike 1 Sep 27; strike 2 Sep 28; ban +24h'});
 await check('TC_BAN_009',async()=>{let a=await fixture({day:'2026-09-27',created:'17:00:00'}),b=await fixture({day:today});at(today,'18:15:00');await cron.handleCron();let s=await strikes();assert.equal((await state(a.booking_id)).status,'CANCELLED');assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal(s.strikes,2);assert.ok(s.banned_until);return 'two rows cancelled, strikes=2, banned'});
 await check('TC_BAN_010',async()=>{let b=await fixture();at(today,'18:15:00');await booking.cancelBooking(b.booking_id,seedUser);await cron.handleCron();assert.equal((await strikes()).strikes,1);return 'late cancel + cron remains 1 strike'});
 await check('TC_BAN_018',async()=>{let b=await fixture({start:'10:00:00',end:'11:00:00',created:'10:50:00'});at(today,'11:00:00');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,0);return 'short round ended, no strike'});
 await check('TC_BAN_019',async()=>{let b=await fixture({start:'10:00:00',end:'11:00:00',created:'10:45:00'});at(today,'11:00:00');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'CANCELLED');assert.equal((await strikes()).strikes,1);return 'deadline equals end, strike 1'});
 await check('TC_BAN_020',async()=>{let b=await fixture({start:'10:00:00',end:'11:00:00',created:'10:30:00'});at(today,'10:44:59');await booking.checkIn(b.booking_id,seedUser,1);assert.equal((await state(b.booking_id)).status,'CHECKED_IN');at(today,'10:59:59');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'CHECKED_IN');at(today,'11:00:00');await cron.handleCron();assert.equal((await state(b.booking_id)).status,'COMPLETED');return 'service check-in at 10:44:59; cron 10:59:59 checked-in and 11:00 completed'},true);
 await reset();mock.timers.reset();await ds.destroy();ds=null;
 fs.writeFileSync(out,JSON.stringify({environment:{databaseVolume:volume,branch:'feature-Docx',commit:'581a654',caseBranch:'ferture-tee-testing',caseCommit:'ed3bdca',at:new Date().toISOString(),approach:'mocked Date + real MySQL TypeORM; direct service/cron, no camera/real scheduler',cleanup:'QA fixture bookings removed'},results},null,2));
 console.log('RESULTS',out,results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}));
}
main().catch(async e=>{console.error('ABORT',String(e.stack).slice(0,2200));mock.timers.reset();if(ds?.isInitialized)await ds.destroy();process.exitCode=1});
