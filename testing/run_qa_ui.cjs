// Playwright tests for selected workbook UI cases, using ONLY the local isolated QA backend.
const {chromium}=require('C:/Users/TEE/AppData/Local/hermes/cache/scratch/qa-node/node_modules/playwright');
const fs=require('node:fs');
const assert=require('node:assert/strict');
const base='http://localhost:3001';
const out='C:/Users/TEE/AppData/Local/hermes/cache/scratch/qa_ui_results.json';
const results=[];
let browser;
const safe=x=>String(x??'').slice(0,300);
async function check(id,fn){try{results.push({id,status:'ผ่าน',actual:safe(await fn())})}catch(e){results.push({id,status:'ไม่ผ่าน',actual:safe(e.message)})}console.log(id,results.at(-1).status,results.at(-1).actual)}
async function page(){let p=await browser.newPage({viewport:{width:1440,height:900}});p.setDefaultTimeout(15000);return p}
async function goto(p,path){await p.goto(base+path,{waitUntil:'domcontentloaded'});if(path==='/booking'||path==='/news')await p.waitForFunction(()=>document.body?.innerText?.length>100,null,{timeout:30000})}
async function hydrate(p,selector){await p.waitForFunction(s=>Object.keys(document.querySelector(s)||{}).some(k=>k.startsWith('__reactProps')),selector,{timeout:30000})}
async function login(p,user='testuser'){
 await goto(p,'/login');await hydrate(p,'#username');await p.locator('#username').fill(user);await p.locator('#password').fill('password');await p.locator('button[type=submit]').click();await p.waitForURL('**/dashboard',{timeout:30000});await p.locator('h1').first().waitFor();
}
async function openMenu(p){await p.getByRole('button',{name:'menu'}).click();await p.getByText('KMITL Menu').waitFor()}
async function main(){
 let up=await fetch(base+'/api/courts/availability');assert.equal(up.status,200);
 browser=await chromium.launch({headless:true});
 await check('TC_AUTH_010',async()=>{let p=await page();try{await login(p,'admin');assert.match(await p.locator('body').innerText(),/Good morning, Admin/);await openMenu(p);let text=await p.locator('body').innerText();assert.match(text,/Manage Users|จัดการผู้ใช้|Users/);return 'admin login -> dashboard with Users menu'}finally{await p.close()}});
 await check('TC_AUTH_013',async()=>{let p=await page();try{await login(p);await openMenu(p);await p.getByRole('button',{name:/ออกจากระบบ/}).click();await p.waitForURL('**/login');let state=await p.evaluate(()=>({token:localStorage.getItem('token'),user:localStorage.getItem('user')}));assert.equal(state.token,null);assert.equal(state.user,null);await goto(p,'/dashboard');await p.waitForURL('**/login');return 'logout clears storage and protected dashboard redirects'}finally{await p.close()}});
 await check('TC_AUTH_026',async()=>{let p=await page();try{await login(p);await p.reload();await p.getByText('Hi, Test Student').waitFor();assert.equal(new URL(p.url()).pathname,'/dashboard');return 'refresh retains STUDENT and own dashboard'}finally{await p.close()}});
 await check('TC_AUTH_014',async()=>{let p=await page();try{await goto(p,'/login');await hydrate(p,'#username');await p.route('**/api/auth/login',async route=>{await new Promise(r=>setTimeout(r,700));await route.continue()});await p.locator('#username').fill('testuser');await p.locator('#password').fill('password');await p.locator('button[type=submit]').click();let button=p.locator('button[type=submit]');assert.equal(await button.isDisabled(),true);assert.match(await button.innerText(),/Logging in/);await p.waitForURL('**/dashboard');return 'disabled/Logging in while pending; dashboard after success'}finally{await p.close()}});
 await check('TC_AUTH_006',async()=>{let p=await page();try{await goto(p,'/register');await hydrate(p,'#studentId');let inputs=await p.locator('input[required]').count();assert.ok(inputs>=7);let requests=0;p.on('request',r=>{if(r.url().includes('/api/auth/register'))requests++});for(let i=0;i<inputs;i++){for(let j=0;j<inputs;j++){let e=p.locator('input[required]').nth(j);await e.fill(j===i?'':e.getAttribute('type')==='email'?'a@kmitl.ac.th':'QAtest123')}await p.locator('button[type=submit]').click();assert.equal(await p.locator('input[required]').nth(i).evaluate(e=>e.validity.valueMissing),true)}assert.equal(requests,0);return `${inputs} required inputs reject blank before POST` }finally{await p.close()}});
 await check('TC_BOOK_006',async()=>{let p=await page();try{await login(p);await goto(p,'/booking');let body=await p.locator('body').innerText();assert.match(body,/เฉพาะวันนี้เท่านั้นที่จองได้/);let dateInputs=await p.locator('input[type=date]').count();assert.equal(dateInputs,0);return 'today-only display, no date input'}finally{await p.close()}});
 await check('TC_BOOK_007',async()=>{let p=await page();try{await login(p);await goto(p,'/booking');let body=await p.locator('body').innerText();assert.match(body,/กันยายน/);assert.equal(await p.locator('select').count(),0);return 'current month displayed, no select element'}finally{await p.close()}});
 await check('TC_UI_003',async()=>{let p=await page();try{await login(p);await goto(p,'/booking');assert.match(await p.locator('body').innerText(),/เฉพาะวันนี้เท่านั้นที่จองได้/);assert.equal(await p.locator('input[type=date]').count(),0);return 'today only (UI)' }finally{await p.close()}});
 await check('TC_UI_004',async()=>{let p=await page();try{await login(p);await goto(p,'/booking');assert.match(await p.locator('body').innerText(),/กันยายน/);assert.equal(await p.locator('select').count(),0);return 'current month, no dropdown (UI)'}finally{await p.close()}});
 await check('TC_UI_008',async()=>{let p=await page();try{await login(p);let region=p.getByText('Recent Bookings').locator('..').locator('..');assert.ok(await region.count());let body=await p.locator('body').innerText();assert.match(body,/Recent Bookings/);return 'Recent Bookings visible; X absence/alternate cancel action needs separate DOM proof'}finally{await p.close()}});
 await check('TC_UI_010',async()=>{let p=await page();try{await login(p);await openMenu(p);let text=await p.locator('body').innerText();for(let label of ['หน้าหลัก (Home)','จองคอร์ท (Book Courts)','สแกนคิวอาร์ (Scan QR)','ข่าวสาร (News)'])assert.ok(text.includes(label),label);return 'four student menu labels'}finally{await p.close()}});
 await check('TC_ADM_013',async()=>{let p=await page();try{await login(p,'admin');await openMenu(p);let text=await p.locator('body').innerText();assert.ok(!text.includes('จองคอร์ท (Book Courts)'));assert.ok(!text.includes('สแกนคิวอาร์ (Scan QR)'));return 'admin menu hides booking and scan; student menu tested in UI_010'}finally{await p.close()}});
 await check('TC_ADM_014',async()=>{let p=await page();try{await login(p,'admin');for(let path of ['/booking','/scan']){await goto(p,path);await p.waitForURL('**/dashboard');}return 'admin direct booking/scan -> dashboard'}finally{await p.close()}});
 await check('TC_SEC_017',async()=>{let p=await page();try{for(let path of ['/dashboard','/booking','/scan','/admin/users']){await goto(p,path);await p.waitForURL('**/login');}return 'guest four protected pages redirect to login'}finally{await p.close()}});
 await check('TC_SEC_018',async()=>{let p=await page();try{await login(p);await goto(p,'/admin/users');await p.waitForURL('**/dashboard');let status=await p.evaluate(async()=>{let t=localStorage.getItem('token');return (await fetch('/api/users',{headers:{Authorization:'Bearer '+t}})).status});assert.equal(status,403);return 'STUDENT admin/users redirect + API 403'}finally{await p.close()}});
 await check('TC_UI_013',async()=>{let p=await page();try{for(let role of ['testuser','admin']){await p.context().clearCookies();await goto(p,'/login');await p.evaluate(()=>localStorage.clear());await hydrate(p,'#username');await p.locator('#username').fill(role);await p.locator('#password').fill('password');await p.locator('button[type=submit]').click();await p.waitForURL('**/dashboard');await goto(p,'/news');assert.equal(new URL(p.url()).pathname,'/news');assert.ok((await p.locator('body').innerText()).length>100)}return 'news renders for both roles'}finally{await p.close()}});
 // Do not mark a case Pass if only one of its required assertions was exercised.
 const partial=new Set(['TC_UI_008','TC_BOOK_006','TC_UI_003','TC_AUTH_006','TC_UI_010','TC_ADM_013','TC_SEC_017']);
 for(const r of results)if(r.status==='ผ่าน'&&partial.has(r.id)){r.status='ตรวจไม่ได้';r.actual+='; remaining workbook assertions not verified'}
 fs.writeFileSync(out,JSON.stringify({environment:{frontend:'http://localhost:3001',backend:'http://127.0.0.1:4001',commit:'581a654',caseCommit:'ed3bdca',at:new Date().toISOString()},results},null,2));
 console.log('RESULTS',out,results.reduce((a,r)=>(a[r.status]=(a[r.status]||0)+1,a),{}));
 await browser.close();
}
main().catch(async e=>{console.error(e);if(browser)await browser.close();process.exitCode=1});
