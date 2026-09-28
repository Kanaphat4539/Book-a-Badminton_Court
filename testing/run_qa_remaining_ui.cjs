// Additional isolated QA-browser checks. No destructive API calls.
const { chromium } = require('C:/Users/TEE/AppData/Local/hermes/cache/scratch/qa-node/node_modules/playwright');
const fs = require('node:fs');
const assert = require('node:assert/strict');
const base = 'http://localhost:3001';
const results = [];
const sleep = ms => new Promise(r => setTimeout(r, ms));
let browser;
async function check(id, fn, partial = false) {
  try { const actual = await fn(); results.push({id, status: partial ? 'ตรวจไม่ได้' : 'ผ่าน', actual: String(actual).slice(0,500)}); }
  catch (e) { results.push({id, status: 'ไม่ผ่าน', actual: String(e.message).slice(0,500)}); }
  console.log(id, results.at(-1).status, results.at(-1).actual);
}
async function page() { const p=await browser.newPage(); p.setDefaultTimeout(15000); return p; }
async function goto(p, path) {await p.goto(base+path,{waitUntil:'domcontentloaded'});}
async function hydrate(p,selector){await p.waitForFunction(s=>Object.keys(document.querySelector(s)||{}).some(k=>k.startsWith('__reactProps')),selector,{timeout:30000})}
async function login(p) {await goto(p,'/login'); await hydrate(p,'#username'); await p.locator('#username').fill('testuser');await p.locator('#password').fill('password');await p.locator('button[type=submit]').click();await p.waitForURL('**/dashboard',{timeout:30000});}
async function main(){
  if((await fetch('http://127.0.0.1:4001/courts/availability')).status!==200)throw Error('QA backend unavailable');
  browser=await chromium.launch({headless:true});
  await check('TC_AUTH_030',async()=>{
    const p=await page();try{for(const path of ['/dashboard','/booking']){
      await goto(p,'/login');await p.evaluate(()=>{localStorage.setItem('token','null');localStorage.setItem('user','{broken')});
      await goto(p,path);await sleep(3500);assert.equal(new URL(p.url()).pathname,'/login',`${path} with broken JSON landed at ${p.url()}, body=${(await p.locator('body').innerText()).slice(0,120)}`);assert.ok((await p.locator('body').innerText()).length>100);
      await p.evaluate(()=>{localStorage.setItem('token','null');localStorage.removeItem('user')});
      await goto(p,path);await sleep(3500);assert.equal(new URL(p.url()).pathname,'/login',`${path} without user landed at ${p.url()}`);
    }return 'malformed/missing user plus token="null": dashboard and booking redirect to login, no blank page';}finally{await p.close()}
  });
  await check('TC_SEC_011',async()=>{const p=await page();try{await login(p);const data=await p.evaluate(()=>Object.fromEntries(Object.entries(localStorage)));assert.ok(data.token);assert.ok(data.user);assert.ok(!/password/i.test(JSON.stringify(data)));const user=JSON.parse(data.user);assert.ok(!('password' in user));return 'localStorage keys='+Object.keys(data).sort().join(',')+'; user fields='+Object.keys(user).sort().join(',')+'; no password';}finally{await p.close()}});
  await check('TC_AUTH_012',async()=>{const p=await page();try{await login(p);const observed=[];p.on('request',req=>{if(req.url().includes('/api/')&&req.method()==='GET')observed.push({path:new URL(req.url()).pathname, bearer:/^Bearer\s+\S+$/.test(req.headers().authorization||'')})});await goto(p,'/booking');await p.waitForResponse(r=>r.url().includes('/api/courts/availability')&&r.status()===200,{timeout:30000});const matched=observed.filter(x=>x.path.includes('/api/bookings/'));assert.ok(matched.length,'no booking request observed');assert.ok(matched.every(x=>x.bearer),JSON.stringify(matched));return 'authenticated booking GET requests with Bearer header; availability 200; paths='+matched.map(x=>x.path).join(',');}finally{await p.close()}});
  await check('TC_BOOK_004',async()=>{const p=await page();try{await login(p);await goto(p,'/booking');await p.getByText('กฎและกติกาการใช้สนาม').waitFor();await p.getByTitle('ปิดหน้าต่างเพื่อดำเนินการจอง').click();let sent=0;p.on('request',r=>{if(r.url().includes('/api/bookings')&&r.method()==='POST')sent++});const next=p.getByRole('button',{name:/ดำเนินการจองต่อ/});assert.equal(await next.isDisabled(),false,'ปุ่มดำเนินการจองต่อถูกปิดใช้งาน จึงกดเพื่อแสดงข้อความเตือนตาม Expected Result ไม่ได้');await next.click();await p.getByText('กรุณาเลือกรอบเวลาก่อนทำรายการ').waitFor();assert.equal(sent,0);return 'warning appears, no POST';}finally{await p.close()}});
  await check('TC_UI_016',async()=>{const p=await page();try{await login(p);await goto(p,'/booking');await p.getByText('กฎและกติกาการใช้สนาม').waitFor();const body=await p.locator('body').innerText();for(const text of ['โควตา 1 ครั้ง/วัน','15 นาที','24 ชั่วโมง'])assert.ok(body.includes(text),text);await p.getByTitle('ปิดหน้าต่างเพื่อดำเนินการจอง').click();await p.getByText('กฎและกติกาการใช้สนาม').waitFor({state:'detached'});await p.getByText('เลือกรอบเวลาการจอง').waitFor();return 'auto-open modal: quota/15-minute/24-hour text; close and booking page remains usable; backend policy text not independently verified';}finally{await p.close()}},true);
  await check('TC_UI_001',async()=>{const p=await page();try{await login(p);for(const [w,h] of [[1440,900],[1920,1080]]){await p.setViewportSize({width:w,height:h});for(const path of ['/dashboard','/booking']){await goto(p,path);await sleep(900);const z=await p.evaluate(()=>({scroll:document.documentElement.scrollWidth,inner:window.innerWidth}));assert.ok(z.scroll<=z.inner,`${path} ${w} scroll=${z.scroll}`)}}return 'dashboard/booking at 1440x900,1920x1080 no horizontal overflow; overlap not visually verified';}finally{await p.close()}},true);
  const out='C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court/testing/evidence/qa_remaining_ui_results.json';
  fs.writeFileSync(out,JSON.stringify({environment:{commit:'581a654',caseCommit:'ed3bdca',frontend:base,backend:'http://127.0.0.1:4001',at:new Date().toISOString()},results},null,2));
  console.log('EVIDENCE',out);
  await browser.close();
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
