// REQ-BOOK time/transaction service checks using mocked Date + real isolated MySQL.
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
const volume='badminton_qa_20260928_mysql_data',date='2026-09-28';
const out='C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court/testing/evidence/qa_book_time_results.json';
const results=[],users=[];let ds,br,sr,ar,svc,seq=0;
async function student(){let id=String(76200000+ ++seq);assert.equal(await sr.countBy({stu_id:id}),0);let s=sr.create({stu_id:id,username:'booktime_'+id,first_name:'Book',last_name:'Time '+id,email:`booktime${id}@kmitl.ac.th`,tel:'0812345678',major:'IT',year:3,password:'not-used',strikes:0,banned_until:null});await sr.save(s);users.push(id);return id}
async function clean(){if(!users.length)return;await br.createQueryBuilder().delete().where('stu_id IN (:...ids)',{ids:users}).execute();await sr.createQueryBuilder().delete().where('stu_id IN (:...ids)',{ids:users}).execute();users.length=0}
function at(time,day=date){mock.timers.setTime(Date.parse(`${day}T${time}+07:00`))}
async function check(id,fn,partial=false){try{let actual=await fn();results.push({id,status:partial?'ตรวจไม่ได้':'ผ่าน',actual:String(actual).slice(0,450)})}catch(e){results.push({id,status:'ไม่ผ่าน',actual:String(e.message).slice(0,450)})}finally{await clean()}console.log(id,results.at(-1).status,results.at(-1).actual)}
async function main(){
 assert.equal(process.env.QA_ISOLATED_DB,volume);assert.equal(process.env.DB_HOST,'127.0.0.1');assert.equal(process.env.DB_NAME,'badminton_db');assert.ok(execFileSync('docker',['inspect','--format','{{range .Mounts}}{{.Name}} {{end}}','badminton_mysql'],{encoding:'utf8'}).split(/\s+/).includes(volume));
 ds=new DataSource({type:'mysql',host:'127.0.0.1',port:3306,username:process.env.DB_USER,password:process.env.DB_PASSWORD,database:'badminton_db',entities:[Booking,Student,Admin,Court],synchronize:false});await ds.initialize();br=ds.getRepository(Booking);sr=ds.getRepository(Student);ar=ds.getRepository(Admin);svc=new BookingsService(br,sr,ar);assert.equal(await br.count(),0,'preserve existing Booking rows');mock.timers.enable({apis:['Date'],now:Date.parse(`${date}T09:00:00+07:00`)});
 await check('TC_BOOK_014',async()=>{let id=await student();at('07:59:00');let b=await svc.createBooking(id,3,date,'08:00');assert.equal(b.time_in,'08:00');assert.equal(b.time_out,'09:00:00');assert.equal(b.status,'PENDING');let row=await br.findOneByOrFail({booking_id:b.booking_id});assert.equal(row.time_in,'08:00:00');assert.equal(row.time_out,'09:00:00');return `service/DB id=${b.booking_id}, Court3 08:00-09:00 PENDING`});
 await check('TC_BOOK_026',async()=>{let id=await student();at('10:30:00');let b=await svc.createBooking(id,2,date,'10:00');let row=await br.findOneByOrFail({booking_id:b.booking_id});assert.equal(row.time_in,'10:00:00');assert.equal(row.time_out,'11:00:00');return `booked at mocked 10:30; DB interval remains ${row.time_in}-${row.time_out}`});
 await check('TC_BOOK_034',async()=>{let id=await student();at('23:58:00');assert.equal(new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Bangkok'}).format(new Date()),date);at('00:01:00','2026-09-29');let message;try{await svc.createBooking(id,1,date,'22:00')}catch(e){message=e.message}assert.equal(message,'Day-by-day policy: You can only book courts for today.');assert.equal(await br.countBy({stu_id:id}),0);return 'mocked page date Sep 28 then action Sep 29 00:01: backend rejects old date with day-by-day policy; no row; browser stale-page toast not exercised'},true);
 await check('TC_BOOK_042',async()=>{let id=await student();at('17:00:00');let original=ds.manager.transaction.bind(ds.manager),first=true;ds.manager.transaction=async(...args)=>{if(first){first=false;throw new Error('QA simulated transaction failure before callback')}return original(...args)};let firstError;try{await svc.createBooking(id,1,date,'18:00')}catch(e){firstError=e.message}assert.equal(firstError,'QA simulated transaction failure before callback');assert.equal(await br.countBy({stu_id:id}),0);let b=await svc.createBooking(id,1,date,'18:00');assert.ok(b.booking_id);assert.equal(await br.countBy({stu_id:id}),1);return `simulated transaction error -> DB rows 0; next create succeeds id=${b.booking_id}; no stale lock observed`});
 await clean();mock.timers.reset();await ds.destroy();ds=null;fs.writeFileSync(out,JSON.stringify({environment:{databaseVolume:volume,commit:'37aea29',codeCommit:'581a654',caseCommit:'ed3bdca',at:new Date().toISOString(),approach:'mocked Date + compiled BookingsService + real isolated MySQL',cleanup:'all created users/bookings removed'},results},null,2));console.log('EVIDENCE',out,results.reduce((m,x)=>(m[x.status]=(m[x.status]||0)+1,m),{}));
}
main().catch(async e=>{console.error('ABORT',String(e.stack).slice(0,1600));mock.timers.reset();if(ds?.isInitialized){try{await clean()}finally{await ds.destroy()}}process.exitCode=1});
