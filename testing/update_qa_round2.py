"""Apply a second, evidenced QA round to copies of the open workbook/report."""
from pathlib import Path
from collections import Counter
from copy import copy
import json
from openpyxl import load_workbook
from openpyxl.styles import Font, Alignment, PatternFill
from docx import Document
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Pt

root=Path('C:/GuisTee/Project_Y3/Book-a-Badminton/Book-a-Badminton_Court/testing')
src_x=root/'Test_Case_Book-a-Badminton_Court_Results_20260928.xlsx'
src_d=root/'Test_Summary_Report_Book-a-Badminton_Court.docx'
out_x=root/'Test_Case_Book-a-Badminton_Court_Results_20260928_v2.xlsx'
out_d=root/'Test_Summary_Report_Book-a-Badminton_Court_v2.docx'
data=json.loads((root/'evidence/qa_remaining_ui_results.json').read_text(encoding='utf-8'))
assert data['environment']['commit']=='581a654' and data['environment']['caseCommit']=='ed3bdca'
results=data['results']; ids=[r['id'] for r in results]
assert len(ids)==len(set(ids))==6
assert Counter(r['status'] for r in results)=={'ผ่าน':2,'ไม่ผ่าน':2,'ตรวจไม่ได้':2}
w=load_workbook(src_x)
case_sheets=w.worksheets[1:10]
loc={s.cell(r,1).value:(s,r) for s in case_sheets for r in range(3,s.max_row+1)}
assert len(loc)==271
for item in results:
 s,r=loc[item['id']]
 assert s.cell(r,7).value=='รอทดสอบ',(item['id'],s.cell(r,7).value)
 s.cell(r,6).value='Browser/Chromium รอบเพิ่ม: '+item['actual']+'\nหลักฐาน: testing/evidence/qa_remaining_ui_results.json'
 s.cell(r,7).value=item['status']
summary=w['00_Summary'];summary.cell(37,1).value='ผลทดสอบจริง 28/09/2569: รอบแรก API/MySQL+Chromium+mock time; รอบเพิ่ม Chromium บน QA backend เดิม/โค้ด feature-Docx 581a654; เฉพาะเคสที่พิสูจน์ครบทุก assertion จึงนับผ่าน/ไม่ผ่าน'
by_group={s.title:Counter(s.cell(r,7).value for r in range(3,s.max_row+1)) for s in case_sheets}
counts=Counter({key:sum(g[key] for g in by_group.values()) for key in ['ผ่าน','ไม่ผ่าน','ตรวจไม่ได้','รอทดสอบ']})
assert sum(counts.values())==271
for col,key in [(2,'ผ่าน'),(4,'ไม่ผ่าน'),(6,'ตรวจไม่ได้'),(8,'รอทดสอบ')]:summary.cell(38,col).value=counts[key]
summary.cell(40,1).value='หลักฐานรอบแรก: testing/evidence/qa_mysql_results.json; qa_ui_results.json; qa_mysql_round2_results.json; qa_mysql_time_results.json; รอบเพิ่ม: qa_remaining_ui_results.json; runners: testing/run_qa_*.cjs'
summary.append(['รอบเพิ่ม 28/09/2569: ทดสอบ 6 เคสจากกลุ่มรอทดสอบเดิมด้วย Chromium + isolated QA backend: ผ่าน 2 (AUTH_012, SEC_011), ไม่ผ่าน 2 (AUTH_030, BOOK_004), ตรวจบางส่วน 2 (UI_001, UI_016); อ้างอิงชีต 13_Execution_Additional'])
extra=w.create_sheet('13_Execution_Additional')
extra.append(['Test Case ID','Status','Actual Result','Evidence','Build'])
for item in results:extra.append([item['id'],item['status'],item['actual'],'testing/evidence/qa_remaining_ui_results.json','feature-Docx 581a654 / cases ed3bdca'])
for cell in extra[1]:cell.fill=PatternFill('solid',fgColor='DCE6F1');cell.font=Font(name='Tahoma',size=10,bold=True)
for row in extra.iter_rows(min_row=2):
 for cell in row:cell.font=Font(name='Tahoma',size=9);cell.alignment=Alignment(wrap_text=True,vertical='top')
 extra.row_dimensions[row[0].row].height=65
for col,width in {'A':20,'B':16,'C':100,'D':55,'E':43}.items():extra.column_dimensions[col].width=width
extra.freeze_panes='A2';extra.auto_filter.ref=f'A1:E{extra.max_row}'
w.calculation.fullCalcOnLoad=True
w.save(out_x)

d=Document(src_d)
def paragraph(index,text):
 p=d.paragraphs[index];p.clear();p.add_run(text)
paragraph(7,f"สถานะความพร้อมภาพรวม: ยังไม่พร้อม Go-Live — ผ่าน {counts['ผ่าน']}, ไม่ผ่าน {counts['ไม่ผ่าน']}, ตรวจบางส่วน/ตรวจไม่ได้ {counts['ตรวจไม่ได้']}, รอทดสอบ {counts['รอทดสอบ']} จาก 271 เคส; ยังคงมีช่องโหว่บัญชีซ้ำ/ข้อมูล hash และรอบเพิ่มพบ localStorage JSON เสียทำให้หน้า error")
completed=counts['ผ่าน']+counts['ไม่ผ่าน']
paragraph(9,f"Pass Rate ของเคสที่ตัดสินผลครบ = ผ่าน {counts['ผ่าน']} ÷ ({counts['ผ่าน']}+{counts['ไม่ผ่าน']}) = {counts['ผ่าน']/completed*100:.1f}% (เฉพาะ {completed} เคสที่ตัดสินผลแล้ว ไม่ใช่อัตราผ่านของ 271 เคส)")
paragraph(10,'ความเสี่ยงหลัก: studentId ซ้ำเขียนทับบัญชีเดิม; API Admin ส่ง password hash; default password ถูกเดาได้; validation บางกรณีผิดพลาด; localStorage user JSON เสียทำให้ /dashboard ขึ้น error; ยังไม่ทดสอบกล้อง QR กับอุปกรณ์จริง')
paragraph(13,'รัน Jest backend unit/E2E เดิมบน isolated MySQL; ทดสอบ API/ฐานข้อมูล, service/cron ด้วย mock time และ Chromium headless รอบแรก; รอบเพิ่มทดสอบ Chromium 6 เคสจากที่ยังรอ บน backend QA เดิม (2 ผ่าน, 2 ไม่ผ่าน, 2 ตรวจบางส่วน) พร้อมหลักฐานราย ID')
paragraph(15,f"เคสที่ยังไม่จบ {counts['รอทดสอบ']+counts['ตรวจไม่ได้']} รายการยังต้องทดสอบเพิ่มเติม: กล้องจริง, ขอบเวลาตามนาฬิกา, 2 backend instances, โหลดสูง, Safari/iOS, production HTTPS, backup/restore และข้อที่ต้องตกลงนโยบายก่อน; ไม่ใช้ฐานข้อมูลจริง")
paragraph(20,'คำสั่งรอบแรก: backend/ npm test -- --runInBand; E2E ต่อ QA MySQL --testTimeout=30000; node testing/run_qa_mysql.cjs, run_qa_mysql_round2.cjs, run_qa_mysql_time.cjs, run_qa_ui.cjs. รอบเพิ่ม: node testing/run_qa_remaining_ui.cjs; ไม่ใช่อุปกรณ์กล้องหรือ scheduler จริง; ดู testing/evidence/')
paragraph(27,'Defect Summary ด้านล่างนับเป็น 9 กลุ่มปัญหาที่พบ ไม่ใช่จำนวน Test Case ที่ล้ม (บางกลุ่มมีหลายเคส) และยังไม่มีหลักฐานว่าแก้ไขแล้ว; ความต่าง HTTP 201 เทียบกับ Expected 200 ของ TC_AUTH_007 เป็น contract mismatch ที่ต้องทบทวน')
paragraph(29,'รอบเพิ่ม 28/09/2569: TC_AUTH_030 เมื่อ token="null" และ user="{broken" เปิด /dashboard ได้หน้า error (SyntaxError) ไม่กลับ login; TC_BOOK_004 ปุ่มดำเนินการจองต่อ disabled จึงไม่มีคำเตือนที่ Expected Result กำหนด — เป็นความต่างของ UI contract, ไม่มี POST. UI_001 และ UI_016 ตรวจได้บางส่วนเท่านั้น; ดู testing/evidence/qa_remaining_ui_results.json')
paragraph(32,'ความเสี่ยง: บัญชีซ้ำเขียนทับข้อมูล; API Admin ส่ง hash; default password เสี่ยงถูกเดา; invalid courtId=0 สร้างรายการได้; localStorage JSON เสียทำให้หน้า error; ยังไม่มีหลักฐาน flow กล้องและข้ามหลาย instance')
paragraph(33,'แนวทางลดความเสี่ยง: แก้ studentId ซ้ำ/validation/password และการ serialize API ก่อน; ป้องกันการ parse localStorage เสียและเพิ่ม regression test; ตัดสินใจว่าจะให้ปุ่ม disabled หรือแสดงคำเตือนแล้วปรับ Expected/UI ให้ตรง; ทดสอบเคสที่เหลือด้วยอุปกรณ์/สภาพแวดล้อมจริงก่อน Go-Live')
paragraph(37,'Detailed Test Cases (สำเนาใส่ผลจริงรอบเพิ่ม): testing/Test_Case_Book-a-Badminton_Court_Results_20260928_v2.xlsx — source: ferture-tee-testing @ ed3bdca; code under test: feature-Docx @ 581a654')
paragraph(38,'หลักฐานรอบแรก: testing/evidence/qa_mysql_results.json, qa_mysql_round2_results.json, qa_mysql_time_results.json, qa_ui_results.json; รอบเพิ่ม: qa_remaining_ui_results.json พร้อม testing/run_qa_remaining_ui.cjs (Chromium + QA backend). เวลาใช้ mock Date เฉพาะรอบแรก ไม่ใช่กล้องหรือ scheduler จริง')
t=d.tables[0]
for i,(name,stats) in enumerate(by_group.items(),1):
 resolved=stats['ผ่าน']+stats['ไม่ผ่าน']
 vals=[name,sum(stats.values()),stats['ผ่าน'],stats['ไม่ผ่าน'],stats['ตรวจไม่ได้'],stats['รอทดสอบ'],f"{stats['ผ่าน']/resolved*100:.1f}%" if resolved else 'N/A']
 for col,v in enumerate(vals):t.cell(i,col).text=str(v)
for col,v in enumerate(['รวมทั้งสิ้น (Total)',271,counts['ผ่าน'],counts['ไม่ผ่าน'],counts['ตรวจไม่ได้'],counts['รอทดสอบ'],f"{counts['ผ่าน']/completed*100:.1f}%"]):t.cell(10,col).text=str(v)
d.tables[1].cell(3,1).text=f"{counts['ผ่าน']} ผ่าน / {counts['ไม่ผ่าน']} ไม่ผ่าน / {counts['ตรวจไม่ได้']} ตรวจไม่ได้ / {counts['รอทดสอบ']} รอทดสอบ"
d.tables[1].cell(3,2).text='API/MySQL, Chromium และ TypeORM+mock time; รอบเพิ่ม Chromium อีก 6 ID; Jest ไม่ถูกนับเพิ่ม'
row=d.tables[1].add_row().cells
for c,v in enumerate(['Browser/Chromium รอบเพิ่ม','6 เคส: 2 ผ่าน, 2 ไม่ผ่าน, 2 ตรวจบางส่วน','qa_remaining_ui_results.json; isolated QA backend; ไม่มีการเปลี่ยนข้อมูลฐานทดสอบ']):row[c].text=v
for rr,vals in [(3,["Medium",5,0,5,0]),(4,["Low",1,0,1,0]),(5,["รวมทั้งสิ้น",9,0,9,0])]:
 for c,v in enumerate(vals):d.tables[2].cell(rr,c).text=str(v)
for entry in [
 ('QA-UI-08','Medium','TC_AUTH_030: localStorage user JSON เสีย + token="null" ทำให้ /dashboard ขึ้นหน้า error แทน redirect login','Open','จับ JSON.parse อย่างปลอดภัย ตรวจ token ที่ไม่ถูกต้อง แล้วกลับ login'),
 ('QA-UI-09','Low','TC_BOOK_004: ไม่เลือกรอบแล้วปุ่มดำเนินการจองต่อ disabled ไม่สามารถกดเพื่อให้ขึ้นข้อความตาม Expected Result (ไม่มี POST)','Open / contract mismatch','ตัดสินใจร่วมกันว่าจะให้ปุ่ม disabled หรือข้อความเตือน; ปรับ UI/Expected Result ให้ตรง')]:
 row=d.tables[3].add_row()
 for c,v in enumerate(entry):row.cells[c].text=v
 row._tr.get_or_add_trPr().append(OxmlElement('w:cantSplit'))
 for cell in row.cells:
  for para in cell.paragraphs:
   para.paragraph_format.space_after=Pt(0)
   for run in para.runs:run.font.size=Pt(8)
# Assign the named Thai face explicitly in document defaults, styles and each run (both Latin/East Asia).
def set_font(f):
 f.name='TH SarabunPSK'
 rpr=f._element.get_or_add_rPr() if hasattr(f._element,'get_or_add_rPr') else f._element
 rfonts=rpr.rFonts
 if rfonts is None:rfonts=OxmlElement('w:rFonts');rpr.insert(0,rfonts)
 for attr in ('ascii','hAnsi','eastAsia','cs'):rfonts.set(qn('w:'+attr),'TH SarabunPSK')
for style in d.styles:
 if style.type in (1,2):set_font(style.font)
for para in list(d.paragraphs)+[p for sec in d.sections for obj in (sec.header,sec.footer) for p in obj.paragraphs]:
 for run in para.runs:set_font(run.font)
for table in d.tables:
 for row in table.rows:
  for cell in row.cells:
   for para in cell.paragraphs:
    for run in para.runs:set_font(run.font)
d.paragraphs[36].paragraph_format.keep_with_next=True
d.paragraphs[37].paragraph_format.keep_together=True
d.save(out_d)
check=load_workbook(out_x,read_only=True)
assert Counter(check[s.title].cell(r,7).value for s in case_sheets for r in range(3,s.max_row+1))==counts
assert [check[loc[i][0].title].cell(loc[i][1],7).value for i in ids]==[x['status'] for x in results]
re=Document(out_d)
assert re.tables[0].cell(10,2).text==str(counts['ผ่าน'])
assert re.tables[2].cell(5,1).text=='9'
assert all('TH SarabunPSK'==re.styles[n].font.name for n in ['Normal','Heading 1','Heading 2'])
print(json.dumps({'counts':counts,'xlsx':str(out_x),'docx':str(out_d),'ids':ids,'font':'TH SarabunPSK','defects':9},ensure_ascii=False))
