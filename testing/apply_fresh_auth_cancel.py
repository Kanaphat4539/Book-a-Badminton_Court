import json,glob,openpyxl,collections
from pathlib import Path
p=Path('testing/Test_Case_Book-a-Badminton_Court_Results_20261001_feature-Docx_QA.xlsx')
e='testing/evidence/qa_real_auth_cancel_ui_2026-10-01T01-09-27-774Z.json'
d=json.load(open(e,encoding='utf-8'))
mapids={'TC_AUTH_032':'01_REQ-AUTH','TC_AUTH_017':'01_REQ-AUTH','TC_CANC_017':'03_REQ-CANCEL'}
w=openpyxl.load_workbook(p)
for result in d['results']:
 sh=w[mapids[result['id']]]
 row=next(r for r in range(3,sh.max_row+1) if sh.cell(r,1).value==result['id'])
 sh.cell(row,7).value='ผ่าน' if result['status']=='PASS' else 'ไม่ผ่าน'
 sh.cell(row,6).value=result['actual']+'; Chromium UI execution; evidence '+e
s=w.create_sheet('24_Real_AUTH_CANCEL_UI')
for row in [['Case ID','Result','Actual result','Evidence file','Source HEAD','Scope note'],*[[r['id'],'ผ่าน' if r['status']=='PASS' else 'ไม่ผ่าน',r['actual'],e,d['environment']['commit'],'Playwright Chromium UI + isolated QA MySQL fixture; DB cleanup verified'] for r in d['results']]]:s.append(row)
counts=collections.Counter()
for sn in ['01_REQ-AUTH','02_REQ-BOOK','03_REQ-CANCEL','04_REQ-CHECKIN','05_REQ-BAN','06_REQ-ADMIN','07_REQ-UI','08_REQ-SEC','09_REQ-CONC']:
 for r in w[sn].iter_rows(min_row=3,values_only=True):
  if r[0]:counts[r[6]]+=1
s=w['00_Summary']
for row in s.iter_rows():
 if row[0].value and 'Current workbook row counts (271 cases):' in str(row[0].value):row[0].value=f"Current workbook row counts (271 cases): ผ่าน {counts['ผ่าน']}, ไม่ผ่าน {counts['ไม่ผ่าน']}, ตรวจไม่ได้ {counts['ตรวจไม่ได้']}, รอทดสอบ {counts['รอทดสอบ']}. Fresh real-browser batch TC_AUTH_017/032 + TC_CANC_017 added 3 PASS; supplemental probes excluded."
w.save(p);print('updated counts',dict(counts))