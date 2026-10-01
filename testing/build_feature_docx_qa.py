import json, os, re, sys, subprocess, shutil
from pathlib import Path
from collections import Counter
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment, PatternFill
from docx import Document
from docx.shared import Inches, Pt
from docx.oxml import OxmlElement
from docx.oxml.ns import qn

ROOT=Path(__file__).resolve().parents[1]
TESTING=ROOT/'testing'; EVIDENCE=TESTING/'evidence'
SOURCE=TESTING/'Test_Case_Book-a-Badminton_Court_Results_20260928_v5_UI_SEC_CONC.xlsx'
OUT=TESTING/'Test_Case_Book-a-Badminton_Court_Results_20261001_feature-Docx_QA.xlsx'
DOCX=TESTING/'Test_Summary_Report_Book-a-Badminton_Court_20261001_feature-Docx_QA.docx'
REV='60a23c800d56a4f012cdead21adf4ab3f38d0e82'

def save_evidence():
    ev=EVIDENCE/'qa_feature_docx_20261001.json'
    raw=subprocess.run(['git','rev-parse','HEAD'],cwd=ROOT,text=True,capture_output=True,check=True).stdout.strip()
    result={'run':'2026-10-01','branch':'feature-Docx','commit':raw,'requested_commit':REV,
      'environment':{'dbDocker':'unavailable: Docker engine named pipe not connected','qaMysql':'127.0.0.1:3306 ECONNREFUSED; no test API/UI run against DB','externalData':'none modified; no seed accounts/fixtures touched'},
      'checks':[
       {'id':'BUILD-BE','area':'backend production build','command':'cd backend && npm run build','result':'PASS','actual':'Nest build exit 0; existing backend/dist ignored output regenerated'},
       {'id':'UNIT-BE-ALL','area':'backend full Jest unit suite','command':'cd backend && npm test -- --runInBand','result':'FAIL / PARTIAL','actual':'18 tests: 11 passed, 7 failed in booking-lifecycle.spec.ts; TypeError transactionalEntityManager.getRepository is not a function; 10/11 suites passed.'},
       {'id':'UNIT-BE-FOCUSED','area':'backend user/auth/court focused Jest tests','command':'cd backend && npm test -- --runInBand src/users/users.service.spec.ts src/users/auth.service.spec.ts src/courts/courts.service.spec.ts','result':'PASS','actual':'2 suites passed, 2 tests passed.'},
       {'id':'CONC-REG','area':'registration concurrency runner','command':'cd backend && node test/registration-concurrency.cjs','result':'BLOCKED','actual':'Missing isolated SQL.js dependency at .qa-deps/node_modules/sql.js; did not install or alter app dependencies.'},
       {'id':'BUILD-FE','area':'frontend production build','command':'cd frontend && rm -rf .next && npm run build','result':'PASS','actual':'Next.js 16.2.10 compiled, TypeScript checked and statically generated all 12 pages; warning: root and frontend multiple lockfiles.'},
       {'id':'LINT-FE','area':'frontend lint','command':'cd frontend && npm run lint','result':'FAIL','actual':'ESLint: 87 problems (55 errors, 32 warnings), including newly merged dashboard/admin/users patterns; no application files modified.'},
       {'id':'LOADING-UNIT','area':'frontend loading controller tests','command':'cd frontend && node --test tests/loading.test.mjs','result':'PASS','actual':'4 tests passed, 0 failed.'},
       {'id':'DB-QA-INFRA','area':'isolated MySQL/API/Chromium comprehensive integration suites','result':'BLOCKED','actual':'Docker Desktop Linux engine unavailable (pipe missing); QA MySQL connection refused. Existing runners explicitly require container badminton_mysql and volume badminton_qa_20260928_mysql_data. No DB or production service was used.'},
       {'id':'WEB-BROWSER','area':'real browser/UI flows','result':'BLOCKED','actual':'No QA frontend/backend services running; browser dependencies not installed in this session. Existing Playwright suite depends on absent QA services; no data-backed UI flows executed.'},
       {'id':'MOBILE-CAMERA','area':'physical phone QR/camera','result':'BLOCKED','actual':'No physical device/camera, HTTPS deployed environment or admin/user QA services available.'},
       {'id':'REG-MERGE','area':'new dev merged behaviors','result':'PARTIAL','actual':'Changed backend/frontend builds exercised; focused loading unit tests pass. Registration race and live QA admin/dashboard/scan flows could not be run due infra/dependency blocks.'}
      ],
      'carryover':'The existing v5 workbook and prior JSON are historical evidence (2026-09-28, source marker 37aea29) and are not counted as tests for this 60a23c8 run.',
      'dataPolicy':'No scripts that can cancel/ban real users executed. No authentic accounts, production DB, tokens or secrets were read or modified.'}
    ev.write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    return ev,result

def create_xlsx(ev, run):
    wb=load_workbook(SOURCE)
    original=Counter()
    case_sheets=wb.worksheets[1:10]
    assert len(case_sheets)==9
    checks=run['checks']
    for sh in case_sheets:
        original.update(sh.cell(r,7).value for r in range(3,sh.max_row+1))
    for sh in case_sheets:
        for r in range(3,sh.max_row+1):
            sh.cell(r,6).value='ยังไม่ได้รันซ้ำกับ feature-Docx 60a23c8; ผลในรอบ 28/09/2569 เป็นหลักฐานเดิม ไม่ใช่ผลรอบนี้'
            sh.cell(r,7).value='รอทดสอบ'
    sm=wb['00_Summary']
    sm.cell(7,1).value=f'รุ่นทดสอบจริง: feature-Docx @ {REV}; merge dev รับรองที่ commit 60a23c8'
    sm.cell(9,1).value='Status รอบนี้: ผ่าน / ไม่ผ่าน / รอทดสอบ / ตรวจไม่ได้ — ห้ามนับหลักฐานรุ่นเก่าเป็นผลของ merge นี้'
    sm.cell(36,1).value='ผล QA รอบ feature-Docx 01/10/2569: ทดสอบ build/unit บน commit merge; integration DB/API/UI บางส่วนติด infrastructure, แสดงสถานะตามผลจริง'
    sm.cell(37,1).value='รอบนี้ — backend build PASS; focused tests PASS 2/2; full Jest 11/18 ผ่าน; frontend build PASS; frontend lint FAIL 55 errors/32 warnings; loading tests PASS 4/4; DB/API/UI BLOCKED'
    sm.cell(38,1).value='ข้อจำกัด: Docker Engine ไม่พร้อมและ localhost MySQL ปฏิเสธการเชื่อมต่อ จึงไม่สามารถรัน isolated MySQL/API/Chromium runners ได้; runner concurrency ขาด .qa-deps/sql.js. ผล v5 จาก 28/09/2569 เป็น historical only.'
    sm.cell(39,1).value='หลักฐานใหม่: testing/evidence/qa_feature_docx_20261001.json'
    sm.cell(40,1).value='ผลเดิมจาก workbook v5 และ testing/evidence/qa_*.json ไม่ถูกนำมานับว่าเป็น execution ของ feature-Docx 60a23c8'
    sm['A41']='ผลรอบ merge นี้: 271 รอทดสอบ; Dev delta 7 ตรวจไม่ได้; ผ่าน 0; ไม่ผ่าน 0. รายละเอียดจำนวน automation test แยกอยู่ใน 13_Run_Evidence.'
    # Keep the original summary table's per-requirement case counts intact; no result columns exist there.
    if '13_Run_Evidence' in wb: del wb['13_Run_Evidence']
    s=wb.create_sheet('13_Run_Evidence')
    s.append(['Check ID','Scope','Command/Method','Result','Observed evidence / blocker'])
    for c in checks:s.append([c['id'],c['area'],c.get('command','(recorded environment check)'),c['result'],c.get('actual','')])
    s.append(['Historical evidence guard','prior-round references','not re-executed','EXCLUDED','Prior v5 and prior evidence are from 2026-09-28 / 37aea29, not current merge commit.'])
    s.append(['Merge revision','feature-Docx',REV,'VERIFIED','HEAD equals expected merge revision; branch is feature-Docx; working tree was clean before QA.'])
    for cell in s[1]:cell.font=Font(name='Tahoma',bold=True,color='FFFFFF');cell.fill=PatternFill('solid',fgColor='1F4E78')
    for row in s.iter_rows(min_row=2):
        for cell in row:cell.font=Font(name='Tahoma',size=10);cell.alignment=Alignment(wrap_text=True,vertical='top')
        s.row_dimensions[row[0].row].height=54
    for col,width in {'A':22,'B':42,'C':64,'D':22,'E':100}.items():s.column_dimensions[col].width=width
    s.freeze_panes='A2';s.auto_filter.ref=f'A1:E{s.max_row}'
    reg=wb.create_sheet('12_DevMerge_Regression')
    rows=[
     ['TC_DEV_001','Registration rejects duplicate student ID without overwriting saved profile','POST /auth/register using unique QA IDs; create then retry with same ID','Isolated SQLite/MySQL QA only; no production/student accounts','Duplicate returns controlled 4xx and original username/email unchanged','Blocked: dedicated race runner lacks .qa-deps SQL.js; DB unavailable','ตรวจไม่ได้'],
     ['TC_DEV_002','Concurrent identical registration creates one account','Send 2 identical POST /auth/register requests concurrently','Isolated QA fixture payload; only fake student ID','One 201, one controlled 4xx; exactly one persisted row','Blocked: isolated QA database unavailable / missing SQL.js','ตรวจไม่ได้'],
     ['TC_DEV_003','Login/register loading transition and overlay timing','Automated loading-controller state tests and exercise UI form transition','Mocked network, 4 loading controller cases','Refresh/auth loading ends on readiness or failure; no indefinite overlay','4 loading controller tests passed. Full browser integration blocked.','ตรวจไม่ได้'],
     ['TC_DEV_004','Student dashboard booking status/countdown after check-in','Login as QA student; check in; observe student/admin dashboard polls/countdown','Isolated QA student/admin and booking; no real accounts','Status reconciles with API and countdown ends at booking time_out','Blocked: QA MySQL/API/frontend services unavailable','ตรวจไม่ได้'],
     ['TC_DEV_005','Admin dashboard bookings/countdown/QR regression','Run admin UI lifecycle PENDING→CHECKED_IN→COMPLETED and verify QR/controls','Isolated QA student/admin; QR payload fixture','Polling updates open dialog, QR and countdown; finish permitted only for checked-in','Blocked: QA MySQL/API/browser services unavailable','ตรวจไม่ได้'],
     ['TC_DEV_006','Registration/admin-user UI and blocking/loading behavior','Browser validation and slow/failing request interaction','Fake-only registration/admin fixtures','Validation, race messages, and loading indicators visible; no partial registration','Blocked: QA services/browser runner unavailable','ตรวจไม่ได้'],
     ['TC_DEV_007','Scan page loading and check-in UI','Login QA student with pending booking; scan fixture QR / API check-in','Fake QA booking + numeric court QR','Server status displayed; successful check-in reflected on dashboard','Blocked: QA services/camera HTTPS unavailable','ตรวจไม่ได้']]
    reg.append(['Test Case ID','Scenario','Steps','Test Data (QA only)','Expected Result','Actual Result','Status'])
    for row in rows:reg.append(row)
    for cell in reg[1]:cell.font=Font(name='Tahoma',bold=True)
    reg.freeze_panes='A2';reg.auto_filter.ref=reg.dimensions
    for col,width in {'A':20,'B':52,'C':60,'D':48,'E':64,'F':68,'G':18}.items():reg.column_dimensions[col].width=width
    for row in reg.iter_rows(min_row=2):
        for cell in row:cell.font=Font(name='Tahoma',size=9);cell.alignment=Alignment(wrap_text=True,vertical='top')
        reg.row_dimensions[row[0].row].height=78
    wb.calculation.fullCalcOnLoad=True
    wb.save(OUT)
    out=load_workbook(OUT,read_only=True,data_only=False)
    ids=[];total=0
    for sh in out.worksheets[1:10]:
        for r in range(3,sh.max_row+1):
            cid=sh.cell(r,1).value
            if cid and str(cid).startswith('TC_'):
                ids.append(cid);total+=1
                assert sh.cell(r,7).value=='รอทดสอบ'
    assert total==271 and len(set(ids))==271,(total,len(set(ids)))
    assert out['13_Run_Evidence'].max_row==len(checks)+3
    assert out['00_Summary']['A41'].value.startswith('ผลรอบ merge นี้: 271')
    return {'path':str(OUT.resolve()),'case_count':total,'previous_case_statuses':dict(original),'current_statuses':{'รอทดสอบ':total},'new_regression_cases':len(rows)}

def setfont(run,name='TH SarabunPSK',size=14,bold=None):
    run.font.name=name;run._element.rPr.rFonts.set(qn('w:eastAsia'),name);run.font.size=Pt(size)
    if bold is not None:run.bold=bold

def make_docx(ev,run,xlsx_info):
    d=Document();sec=d.sections[0];sec.top_margin=Inches(.8);sec.bottom_margin=Inches(.8);sec.left_margin=Inches(.85);sec.right_margin=Inches(.85)
    for style_name,size in [('Normal',14),('Title',24),('Heading 1',20),('Heading 2',18),('Heading 3',16)]:
        st=d.styles[style_name];st.font.name='TH SarabunPSK';st._element.rPr.rFonts.set(qn('w:eastAsia'),'TH SarabunPSK');st.font.size=Pt(size)
    p=d.add_paragraph();p.style='Title';setfont(p.add_run('รายงานผลการทดสอบ QA'),size=24,bold=True)
    p=d.add_paragraph();setfont(p.add_run('Book-a-Badminton Court — feature-Docx หลัง merge dev'),size=18,bold=True)
    p=d.add_paragraph();setfont(p.add_run(f"รอบตรวจ 1 ตุลาคม 2569 | commit {REV}"),size=14)
    d.add_heading('1. สรุปผล',level=1)
    d.add_paragraph(f"ตาราง XLSX มีกรณีเดิม {xlsx_info['case_count']} เคส และเพิ่ม regression เฉพาะ diff ของ dev อีก {xlsx_info['new_regression_cases']} เคส. ผล status ราย TC รอบนี้: จาก 271 เคสเดิม ผ่าน 0, ไม่ผ่าน 0, ตรวจไม่ได้ 0, รอทดสอบ 271; จาก 7 เคส Dev-delta ตรวจไม่ได้ 7. สถานะยังไม่มี Pass/Fail ของกรณีเหล่านี้เพราะ QA integration infra ใช้งานไม่ได้; ไม่ยืมผลจากการทดสอบเก่ามาอ้างเป็นผลใหม่.")
    d.add_paragraph('ผลคำสั่ง: Backend production build ผ่าน; backend focused auth/users/courts ผ่าน 2/2; full backend Jest ผ่าน 11/18 (7 failures); frontend production build ผ่าน; loading-controller tests ผ่าน 4/4; frontend ESLint ไม่ผ่าน 55 errors / 32 warnings.')
    d.add_heading('2. Revision และขอบเขต',level=1)
    d.add_paragraph(f"Branch: feature-Docx. Commit ตรวจ: {run['commit']} (ตรงกับ merge commit ที่ร้องขอ: {REV}). การทดสอบ static/build และ unit รันบน checkout จริง. ไม่แก้ application code, ไม่ push/commit/merge เพิ่ม และไม่ใช้ production data.")
    d.add_paragraph('Coverage เน้น changeset dev: registration duplicate/race protection, users admin UI, dashboard polling/countdown, scan/check-in page และ loading provider/controller. Regression suites สำหรับ booking/cancel/ban, admin, UI, security และ concurrency คงอยู่ใน 271 เคสจาก v5; ยังไม่ได้รันซ้ำบน merge นี้.')
    d.add_heading('3. ผลคำสั่งที่รันจริง',level=1)
    t=d.add_table(rows=1,cols=4);t.style='Table Grid'
    for c,v in zip(t.rows[0].cells,['Check','ผล','หลักฐาน','หมายเหตุ']):c.text=v
    for c in run['checks']:
        row=t.add_row().cells;row[0].text=c['id'];row[1].text=c['result'];row[2].text=c.get('command','(ตรวจ environment)');row[3].text=c.get('actual','')
    d.add_heading('4. Blockers และข้อพบ',level=1)
    for txt in [
      'DB/API/UI: Docker Engine ไม่พร้อม (Docker Desktop Linux pipe หาย); 127.0.0.1:3306 ECONNREFUSED. จึงไม่ได้ start app services หรือแตะ DB ใด ๆ. Existing runners ต้องการ isolated Docker volume badminton_qa_20260928_mysql_data.',
      'Registration race regression: node backend/test/registration-concurrency.cjs หยุดก่อนทดสอบ เพราะ dependency .qa-deps/node_modules/sql.js ไม่มี. ไม่ติดตั้งเพิ่มและไม่ปรับโค้ด.',
      'Backend Jest เต็ม: 7 กรณี booking lifecycle ล้มเพราะ test mock TransactionalEntityManager ไม่มี getRepository; 10 suite ผ่าน. เป็น test harness failure ที่เห็นจริง ไม่สรุปเป็น production defect.',
      'Frontend lint: 55 errors/32 warnings รวม explicit any, render/effect, React hooks ordering และ unescaped entities. ต้องตรวจแก้ภายหลัง แต่ไม่ได้แก้ตามขอบเขต QA.',
      'Next build รอบแรกติดไฟล์ .next/dev/types/validator.ts ที่เสียรูปจาก cache เก่า; ลบเฉพาะ ignored build cache .next แล้ว build ใหม่ผ่าน.'
    ]:d.add_paragraph(txt,style='List Bullet')
    d.add_heading('5. เกณฑ์สถานะและจำนวน',level=1)
    d.add_paragraph('271 cases ใน requirement sheets ของเดิมยังตั้งเป็น “รอทดสอบ” เพราะยังไม่ได้รันกับ commit 60a23c8. เพิ่ม 7 cases DEV ในชีต 12_DevMerge_Regression และให้ “ตรวจไม่ได้” เพราะลงมือพยายามแต่ environment/dependencies ปิดกั้น. ไม่มีผล Pass/Fail ที่อนุมานจากผลเก่า.')
    d.add_paragraph('จำนวน suite unit (11 suites), tests (18), loading tests (4), และ status ของ 271 Test Case เป็นหน่วยคนละแบบ; ไม่รวมยอดข้ามหน่วย.')
    d.add_heading('6. ไฟล์หลักฐาน',level=1)
    d.add_paragraph(str(xlsx_info['path']));d.add_paragraph(str(ev.resolve()))
    d.add_paragraph('หลักฐานเก่าใน testing/evidence และ XLSX v5 เก็บตามเดิม เป็น historical only.')
    sec.header.paragraphs[0].text='Book-a-Badminton Court | รายงาน QA feature-Docx'
    sec.footer.paragraphs[0].text='เอกสารผลทดสอบ — ใช้เฉพาะฐานข้อมูล QA แยกเท่านั้น'
    for par in list(d.paragraphs)+[p for tbl in d.tables for row in tbl.rows for cell in row.cells for p in cell.paragraphs]:
        for r in par.runs:setfont(r)
    for tbl in d.tables:
        for row in tbl.rows:row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
    d.save(DOCX)
    reread=Document(DOCX)
    text='\n'.join(p.text for p in reread.paragraphs)+'\n'+'\n'.join(c.text for t in reread.tables for row in t.rows for c in row.cells)
    assert 'Docker Engine ไม่พร้อม' in text and '55 errors / 32 warnings' in text and str(REV) in text
    assert len(reread.tables)==1
    return {'path':str(DOCX.resolve()),'paragraphs':len(reread.paragraphs),'tables':len(reread.tables),'embedded_font':'TH SarabunPSK'}

if __name__=='__main__':
    ev,run=save_evidence();x=create_xlsx(ev,run);d=make_docx(ev,run,x)
    print(json.dumps({'evidence':str(ev.resolve()),'xlsx':x,'docx':d,'checks':Counter(c['result'] for c in run['checks'])},ensure_ascii=False,indent=2))
