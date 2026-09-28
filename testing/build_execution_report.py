"""Merge real isolated-MySQL/API and browser results into a copy of the QA workbook
and refresh the professor-template summary. Original branch and template stay untouched.
"""
import io
import json
import shutil
import subprocess
from collections import Counter
from pathlib import Path
from openpyxl import load_workbook
from openpyxl.styles import Alignment, Font, PatternFill
from docx import Document
from docx.shared import Pt

repo = Path('C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court')
scratch = Path('C:/Users/TEE/AppData/Local/hermes/cache/scratch')
evidence = repo / 'testing' / 'evidence'
evidence.mkdir(exist_ok=True)
for stem in ('qa_mysql_results', 'qa_ui_results'):
    dst = evidence / (stem + '.json')
    if not dst.exists():
        shutil.copyfile(scratch / (stem + '.json'), dst)
api = json.loads((evidence/'qa_mysql_results.json').read_text(encoding='utf-8'))
ui = json.loads((evidence/'qa_ui_results.json').read_text(encoding='utf-8'))
round2 = json.loads((evidence/'qa_mysql_round2_results.json').read_text(encoding='utf-8'))
time_cases = json.loads((evidence/'qa_mysql_time_results.json').read_text(encoding='utf-8'))
assert api['environment']['databaseVolume']==round2['environment']['databaseVolume']==time_cases['environment']['databaseVolume']=='badminton_qa_20260928_mysql_data'
assert api['environment']['commit']==ui['environment']['commit']==round2['environment']['commit']==time_cases['environment']['commit']=='581a654'
source = subprocess.check_output(['git','show','ferture-tee-testing:testing/Test_Case_Book-a-Badminton_Court.xlsx'],cwd=repo)
wb = load_workbook(io.BytesIO(source))
case_sheets=wb.worksheets[1:10]
all_ids={s.cell(r,1).value for s in case_sheets for r in range(3,s.max_row+1)}
assert len(all_ids)==271
# The browser runner completes the API-only Admin login case. Failed observations
# always win over partial or passed observations from a different channel.
rank={'ตรวจไม่ได้':1,'ผ่าน':2,'ไม่ผ่าน':3}
merged={}
for channel,data in [('API/MySQL',api),('Browser/Chromium',ui),('API/MySQL round 2',round2),('TypeORM/MySQL mocked time',time_cases)]:
    for item in data['results']:
        case_id=item['id']; assert case_id in all_ids
        if case_id not in merged:
            merged[case_id]={'status':item['status'],'actual':[],'channels':[]}
        row=merged[case_id]
        if rank[item['status']]>rank[row['status']]: row['status']=item['status']
        row['actual'].append(f"{channel}: {item['actual']}")
        row['channels'].append(channel)
# Expected Result has multiple assertions for these cases; observed part is useful
# but not enough to declare an entire workbook row passed.
additional_partial={'TC_AUTH_002','TC_AUTH_003','TC_AUTH_004','TC_AUTH_008',
                    'TC_SEC_010','TC_BOOK_005','TC_BOOK_022','TC_BOOK_024',
                    'TC_ADM_016'}
for case_id in additional_partial:
    if case_id in merged and merged[case_id]['status']=='ผ่าน':
        merged[case_id]['status']='ตรวจไม่ได้'
        merged[case_id]['actual'].append('Only some workbook assertions were exercised.')
# TC_AUTH_010 is covered end-to-end by the browser, beyond the partial API result.
assert merged['TC_AUTH_010']['status']=='ผ่าน'
status_by_group={}
for sheet in case_sheets:
    for r in range(3,sheet.max_row+1):
        case_id=sheet.cell(r,1).value
        if case_id in merged:
            item=merged[case_id]
            sheet.cell(r,6).value='\n'.join(item['actual'])
            sheet.cell(r,7).value=item['status']
    status_by_group[sheet.title]=Counter(sheet.cell(r,7).value for r in range(3,sheet.max_row+1))
counts=Counter(status for stats in status_by_group.values() for status,n in stats.items() for _ in range(n))
assert sum(counts.values())==271
assert counts['ผ่าน']+counts['ไม่ผ่าน']+counts['ตรวจไม่ได้']==len(merged)
# A static summary works even before Excel recalculates the original COUNTIFs.
summary=wb['00_Summary']
summary.append(['ผลทดสอบจริง 28/09/2569: ทดสอบบน feature-Docx 581a654 เทียบ workbook ferture-tee-testing ed3bdca; MySQL แยกใน Docker; เฉพาะเคสที่ทำครบทุกขั้นจึงนับผ่าน/ไม่ผ่าน'])
summary.append(['ผ่าน (ทดสอบครบ)',counts['ผ่าน'],'ไม่ผ่าน (ทดสอบครบ)',counts['ไม่ผ่าน'],'ตรวจบางส่วน/ตรวจไม่ได้',counts['ตรวจไม่ได้'],'ยังรอทดสอบ',counts['รอทดสอบ']])
summary.append(['ข้อจำกัด: ไม่ได้ทดสอบครบทั้ง 271; อุปกรณ์กล้อง, โหลดสูง, production HTTPS, เวลาเส้นตายจริง, หลาย instance และนโยบายที่ยังไม่ยืนยันคงเป็นรอทดสอบ'])
summary.append(['หลักฐาน: testing/evidence/qa_mysql_results.json; qa_ui_results.json; qa_mysql_round2_results.json; qa_mysql_time_results.json; runners in testing/run_qa_*.cjs'])
wb.calculation.fullCalcOnLoad=True
sheet=wb.create_sheet('12_Execution_20260928')
sheet.append(['Test Case ID','Status','Actual Result (ย่อ)','Evidence Channel','Code / Case Revision'])
for case_id,item in sorted(merged.items()):
    sheet.append([case_id,item['status'],'\n'.join(item['actual']),'+'.join(item['channels']),'feature-Docx 581a654 / ferture-tee-testing ed3bdca'])
for cell in sheet[1]: cell.fill=PatternFill('solid',fgColor='DCE6F1');cell.font=Font(name='Tahoma',size=10,bold=True)
for row in sheet.iter_rows(min_row=2):
    for cell in row: cell.font=Font(name='Tahoma',size=9);cell.alignment=Alignment(wrap_text=True,vertical='top')
for col,width in {'A':20,'B':16,'C':92,'D':24,'E':45}.items():sheet.column_dimensions[col].width=width
sheet.freeze_panes='A2';sheet.auto_filter.ref=f'A1:E{sheet.max_row}'
for row in range(2,sheet.max_row+1): sheet.row_dimensions[row].height=60
workbook_out=repo/'testing'/'Test_Case_Book-a-Badminton_Court_Results_20260928.xlsx'
wb.save(workbook_out)

report_path=repo/'testing'/'Test_Summary_Report_Book-a-Badminton_Court.docx'
d=Document(report_path)
def replace(index,text):
    p=d.paragraphs[index];p.clear();run=p.add_run(text);run.font.name='Tahoma';run.font.size=Pt(14 if index==28 else 11)
    if index==28: run.bold=True;p.paragraph_format.keep_with_next=True
replace(5,'สถานะเอกสาร: ผลการทดสอบบางส่วนจาก 271 Test Cases — ยังไม่ใช่การรับรองพร้อมเปิดใช้งาน')
replace(7,f"สถานะความพร้อมภาพรวม: ยังไม่พร้อม Go-Live — ผ่าน {counts['ผ่าน']}, ไม่ผ่าน {counts['ไม่ผ่าน']}, ตรวจบางส่วน/ตรวจไม่ได้ {counts['ตรวจไม่ได้']}, รอทดสอบ {counts['รอทดสอบ']} จาก 271 เคส; พบปัญหาเขียนทับบัญชีเดิมเมื่อรหัสนักศึกษาซ้ำและข้อมูล hash รั่วใน API")
replace(8,'ผลที่ยืนยัน: Backend unit tests ผ่าน 18/18 (11 suites); E2E เมื่อเชื่อม isolated MySQL ผ่าน 1/1; ผลทั้งสองชุดเป็น automated tests แยกจากจำนวน Test Case ใน workbook การรัน API/MySQL และ Chromium อ้างอิงหลักฐานราย ID ใน workbook ผลรอบนี้')
completed=counts['ผ่าน']+counts['ไม่ผ่าน']
replace(9,f"Pass Rate ของเคสที่ตัดสินผลครบ = ผ่าน {counts['ผ่าน']} ÷ ({counts['ผ่าน']}+{counts['ไม่ผ่าน']}) = {counts['ผ่าน']/completed*100:.1f}% (เฉพาะ {completed} เคสที่ตัดสินผลแล้ว ไม่ใช่อัตราผ่านของ 271 เคส)")
replace(10,'ความเสี่ยงหลัก: studentId ซ้ำเขียนทับบัญชีเดิมบน MySQL; สมัครนักศึกษา/สร้าง Admin โดยไม่กำหนดรหัสผ่านแล้วล็อกอินด้วยรหัสเริ่มต้นได้; API Admin ส่ง hash ของ password กลับมา; validation บางกรณีคืน 500/รับข้อมูลผิด และยังไม่ทดสอบกล้อง QR กับอุปกรณ์จริง')
replace(13,'รัน Jest backend unit และ E2E กับ MySQL แยก; รัน API และตรวจฐานข้อมูลบน Docker QA volume; ทดสอบ service/cron กับ MySQL จริงโดย mock นาฬิกา (ไม่ใช่ scheduler หรือกล้องจริง); ใช้ Chromium headless ตรวจ flow/UI บางรายการ; บันทึกผลเทียบ workbook ราย ID')
replace(15,f"เคสที่ยังไม่จบ {counts['รอทดสอบ']+counts['ตรวจไม่ได้']} รายการยังต้องทดสอบเพิ่มเติม: กล้องจริง, ขอบเวลาตามนาฬิกา, 2 backend instances, โหลดสูง, Safari/iOS, production HTTPS, backup/restore และข้อที่ต้องตกลงนโยบายก่อน; ไม่ใช้ฐานข้อมูลจริง")
replace(18,'สภาพแวดล้อม: Windows 11, Node.js v26.7.0, npm v11.19.0, NestJS/Jest, MySQL 8.0 Docker container badminton_mysql ใน volume badminton_qa_20260928_mysql_data แยกจาก container งานอื่น, localhost:4001; Next.js localhost:3001; Chromium headless (Playwright)')
replace(19,'Database: MySQL QA ใหม่ ไม่ใช่ production; E2E ผ่านเมื่อบริการพร้อม ข้อมูล fixture ของ API ถูกล้างหลังรัน (เหลือ seed นักศึกษา/ผู้ดูแลและ 4 สนาม); Browser ทดสอบบน Windows เท่านั้น ไม่รับรอง iOS หรือกล้องจริง')
replace(20,'คำสั่ง: backend/ npm test -- --runInBand; E2E ต่อ QA MySQL --testTimeout=30000; node testing/run_qa_mysql.cjs, run_qa_mysql_round2.cjs, run_qa_mysql_time.cjs (QA volume guard); node testing/run_qa_ui.cjs. ขอบเวลาใช้ mock Date กับ service/cron จริง แต่ไม่ทดสอบจังหวะ scheduler หรือกล้อง; ดู testing/evidence/')
replace(23,'วิธีนับ: Pass Rate = ผ่าน ÷ (ผ่าน + ไม่ผ่าน) เฉพาะเคสที่พิสูจน์ครบ; “ตรวจไม่ได้” คือพยายามตรวจแต่ยังไม่ครบ Expected Result; “รอทดสอบ” คือไม่ได้ลงมือ ห้ามนับสองกลุ่มนี้เป็นผ่าน')
replace(27,'Defect Summary ด้านล่างนับเป็น 7 กลุ่มปัญหาที่พบ ไม่ใช่จำนวน Test Case ที่ล้ม (บางกลุ่มมีหลายเคส) และยังไม่มีหลักฐานว่าแก้ไขแล้ว; ความต่าง HTTP 201 เทียบกับ Expected 200 ของ TC_AUTH_007 เป็น contract mismatch ที่ต้องทบทวน ไม่จัดเป็น defect ด้านความปลอดภัย')
replace(28,'5.2 รายละเอียด Defect ที่ยังค้าง (Open Defects Detail)')
replace(29,'บันทึก QA-20260919 เดิมใน testing/verify_source_test.md เป็นประวัติบน SQL.js; รอบนี้ตรวจซ้ำบางประเด็นบน MySQL จริงของ QA และบันทึกผลใหม่แยกจากประวัติเดิม ไม่มี raw runner/results เก่าครบใน branch ที่อ้าง')
replace(32,'ความเสี่ยง: ผู้สมัครอาจเขียนทับข้อมูลบัญชีผู้อื่นเมื่อใช้ studentId ซ้ำ; endpoint รายการจอง Admin คืน hash; ค่า default password เสี่ยงถูกเดา; invalid courtId=0 สร้างรายการได้; validation คืน 500; Admin กด Finish สองคำขอพร้อมกันได้ 201 ทั้งคู่; ยังไม่มีหลักฐาน flow กล้องและข้ามหลาย instance')
replace(33,'แนวทางลดความเสี่ยง: แก้การบังคับ studentId ซ้ำ/validation/password และการ serialize API ก่อน; เพิ่ม regression tests ครอบคลุม MySQL; กำหนดเจ้าของข้อมูลทดสอบและนโยบายที่ค้าง; ทดสอบครบทุกแถวที่เหลือด้วยอุปกรณ์/สภาพแวดล้อมที่ตรงข้อกำหนดก่อนเสนอ Go-Live')
replace(35,'ข้อสรุป: ไม่อนุมัติ Go-Live ในรอบนี้ เนื่องจากพบข้อบกพร่องร้ายแรงและยังมีเคสที่ไม่ได้ตัดสินผลจำนวนมาก; ผู้จัดทำและผู้รับรองต้องทบทวนผลและลงนามหลังแก้ไข/ทดสอบซ้ำ')
replace(37,'Detailed Test Cases (สำเนาใส่ผลจริง): testing/Test_Case_Book-a-Badminton_Court_Results_20260928.xlsx — source: ferture-tee-testing @ ed3bdca; code under test: feature-Docx @ 581a654')
replace(38,'หลักฐานที่รันใหม่: testing/evidence/qa_mysql_results.json, qa_mysql_round2_results.json, qa_mysql_time_results.json และ qa_ui_results.json; ตัวรัน testing/run_qa_*.cjs. กรณีเวลาใช้ mock Date และเรียก service/cron โดยตรง ไม่ใช่อุปกรณ์กล้องหรืองาน scheduler จริง')
# Table 4.1: one row per workbook sheet, preserving the professor's seven-column layout.
t=d.tables[0];t.cell(0,4).text='ตรวจไม่ได้';t.cell(0,5).text='รอทดสอบ'
for i,(name,stats) in enumerate(status_by_group.items(),1):
    total=sum(stats.values());resolved=stats['ผ่าน']+stats['ไม่ผ่าน']
    vals=[name,total,stats['ผ่าน'],stats['ไม่ผ่าน'],stats['ตรวจไม่ได้'],stats['รอทดสอบ'],f"{stats['ผ่าน']/resolved*100:.1f}%" if resolved else 'N/A']
    for c,v in enumerate(vals):t.cell(i,c).text=str(v)
vals=['รวมทั้งสิ้น (Total)',271,counts['ผ่าน'],counts['ไม่ผ่าน'],counts['ตรวจไม่ได้'],counts['รอทดสอบ'],f'{counts["ผ่าน"]/completed*100:.1f}%']
for c,v in enumerate(vals):t.cell(10,c).text=str(v)
t=d.tables[1]
for oldrow in list(t.rows)[4:]:t._tbl.remove(oldrow._tr)
t.cell(2,1).text='1 test ผ่าน (เมื่อพร้อม)';t.cell(2,2).text='isolated MySQL: ค่า default timeout 5s ล้มหลัง restart, รันใหม่ --testTimeout=30000 ผ่าน 1/1 exit 0; ไม่ใช่การทดสอบ flow จองครบเส้นทาง'
t.cell(3,1).text=f"{counts['ผ่าน']} ผ่าน / {counts['ไม่ผ่าน']} ไม่ผ่าน / {counts['ตรวจไม่ได้']} ตรวจไม่ได้ / {counts['รอทดสอบ']} รอทดสอบ"
t.cell(3,2).text='API/MySQL, Chromium และ TypeORM+mock time บันทึกผลแยก ID ใน workbook; Jest ไม่ถูกนับเพิ่ม'
for name,text in [('API/MySQL','QA volume แยก, ตรวจ response และ DB; qa_mysql_results.json + qa_mysql_round2_results.json'),('Browser/Chromium','localhost:3001 + API rewrite:4001; qa_ui_results.json'),('TypeORM/MySQL mocked time','เรียก service/cron กับ DB QA, mock Date; ไม่ใช่กล้องหรือ scheduler จริง; qa_mysql_time_results.json')]:
    cells=t.add_row().cells;cells[0].text=name;cells[1].text='ผลแยกราย ID';cells[2].text=text
# Seven reproducible issue groups; contract mismatch remains in prose.
severity={'Critical / Blocker':1,'High':2,'Medium':4,'Low':0,'รวมทั้งสิ้น':7}
for r,(name,n) in enumerate(severity.items(),1):
    for c,v in enumerate((name,n,0,n,0)):d.tables[2].cell(r,c).text=str(v)
defects=[
 ('QA-MYSQL-01','Critical','TC_AUTH_005: สมัครด้วย studentId เดิมได้ HTTP 201 และ username ของบัญชีเดิมเปลี่ยน','Open','ห้าม Go-Live; ปฏิเสธ PK ซ้ำ ตรวจ immutable account'),
 ('QA-MYSQL-02','High','TC_AUTH_020/TC_ADM_026: ไม่มีรหัสผ่านแต่สร้างบัญชีได้; Admin login ด้วยรหัสเริ่มต้นได้','Open','บังคับ password; ยกเลิก default password และ seed ที่เดาง่าย'),
 ('QA-MYSQL-03','High','TC_SEC_016: GET /bookings ของ Admin ส่ง nested password hash ใน JSON','Open','ตัด sensitive fields ที่ serializer/query ก่อนส่ง response'),
 ('QA-MYSQL-04','Medium','TC_AUTH_015/016/018/025: รูปแบบ email/id/phone/year หรือ login input ผิดแล้วรับหรือคืน 500','Open','เพิ่ม schema validation ทั้ง API และ UI; test MySQL'),
 ('QA-MYSQL-05','Medium','TC_BOOK_029/040: courtId=0 สร้าง booking ได้; ข้อมูลหาย/ผิดชนิดบางกรณีคืน 500','Open','ตรวจ courtId/field ครบและความมีอยู่จริงก่อน transaction'),
 ('QA-MYSQL-06','Medium','TC_AUTH_023: register payload ซ้ำพร้อมกันได้ HTTP 201/500 แทน controlled 400','Open','รับ duplicate-key error เป็น controlled 4xx'),
 ('QA-MYSQL-07','Medium','TC_ADM_019: Admin สองคำขอกด Finish รายการเดียวพร้อมกันได้ HTTP 201 ทั้งคู่','Open','ทำ finish แบบ atomic/idempotent และตอบผลคำขอซ้ำชัดเจน'),
]
t=d.tables[3]
for row in list(t.rows)[1:]:t._tbl.remove(row._tr)
for entry in defects:
    row=t.add_row();
    for c,v in enumerate(entry):row.cells[c].text=v
for row in t.rows:
    for cell in row.cells:
        for paragraph in cell.paragraphs:
            paragraph.paragraph_format.space_after=Pt(0)
            for run in paragraph.runs:run.font.size=Pt(8)
# Avoid splitting a defect row between pages; repeat header.
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
for row in t.rows:row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
t.rows[0]._tr.get_or_add_trPr().append(OxmlElement('w:tblHeader'))
d.save(report_path)
# Real file verification, not just save success.
check=load_workbook(workbook_out,read_only=True)
observed=Counter(check[s.title].cell(r,7).value for s in case_sheets for r in range(3,s.max_row+1))
assert observed==counts
assert len(Document(report_path).tables)==5
print(json.dumps({'total':271,'counts':counts,'attempted_ids':len(merged),'xlsx':str(workbook_out),'docx':str(report_path),'evidence':str(evidence)},ensure_ascii=False,default=dict))
