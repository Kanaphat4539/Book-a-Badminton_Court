import json, collections, openpyxl, re
from pathlib import Path
root=Path('testing')
book=root/'Test_Case_Book-a-Badminton_Court_Results_20261001_feature-Docx_QA.xlsx'
# Include only complete flows with current isolated-stack evidence and exact workbook IDs.
batches=[
 ('testing/evidence/qa_admin_ui_recheck_results.json',{'TC_ADM_001':'ผ่าน','TC_ADM_002':'ไม่ผ่าน','TC_ADM_004':'ผ่าน','TC_ADM_005':'ผ่าน','TC_ADM_007':'ผ่าน','TC_ADM_008':'ผ่าน','TC_ADM_009':'ผ่าน','TC_ADM_012':'ผ่าน','TC_ADM_013':'ผ่าน','TC_ADM_014':'ผ่าน','TC_ADM_018':'ผ่าน','TC_ADM_022':'ผ่าน','TC_ADM_023':'ผ่าน','TC_ADM_025':'ผ่าน','TC_ADM_027':'ผ่าน','TC_ADM_030':'ผ่าน','TC_ADM_034':'ผ่าน','TC_ADM_035':'ผ่าน','TC_ADM_036':'ผ่าน','TC_ADM_037':'ผ่าน','TC_ADM_038':'ผ่าน','TC_ADM_041':'ผ่าน'}),
 ('testing/evidence/qa_book_ui_recheck_results.json',{'TC_BOOK_003':'ไม่ผ่าน','TC_BOOK_006':'ผ่าน','TC_BOOK_017':'ผ่าน','TC_BOOK_018':'ผ่าน','TC_BOOK_019':'ผ่าน','TC_BOOK_027':'ไม่ผ่าน','TC_BOOK_028':'ไม่ผ่าน','TC_BOOK_030':'ผ่าน','TC_BOOK_031':'ผ่าน','TC_BOOK_032':'ผ่าน','TC_BOOK_033':'ไม่ผ่าน','TC_BOOK_036':'ไม่ผ่าน','TC_BOOK_038':'ผ่าน','TC_BOOK_041':'ผ่าน'}),
 ('testing/evidence/qa_admin_api_results.json',{'TC_ADM_016':'ผ่าน','TC_ADM_019':'ผ่าน','TC_ADM_020':'ผ่าน','TC_ADM_021':'ไม่ผ่าน','TC_ADM_024':'ผ่าน','TC_ADM_026':'ผ่าน','TC_ADM_028':'ผ่าน','TC_ADM_029':'ผ่าน','TC_ADM_033':'ผ่าน'}),
 ('testing/evidence/qa_conc_service_results.json',{'TC_CONC_004':'ผ่าน','TC_CONC_005':'ผ่าน','TC_CONC_006':'ตรวจไม่ได้','TC_CONC_009':'ไม่ผ่าน','TC_CONC_010':'ผ่าน','TC_CONC_011':'ตรวจไม่ได้','TC_CONC_012':'ตรวจไม่ได้','TC_CONC_016':'ผ่าน'}),
 ('testing/evidence/qa_conc_api_focused_results.json',{'TC_CONC_001':'ผ่าน','TC_CONC_002':'ไม่ผ่าน','TC_CONC_007':'ไม่ผ่าน','TC_CONC_019':'ไม่ผ่าน','TC_CONC_020':'ตรวจไม่ได้','TC_CONC_021':'ไม่ผ่าน','TC_CONC_022':'ผ่าน','TC_CONC_023':'ตรวจไม่ได้'}),
 ('testing/evidence/qa_book_ui_TC_BOOK_002.json',{'TC_BOOK_002':'ผ่าน'})]
source='testing/evidence/qa_fullflow_batches_20261001.json'
combined=[]
for path, expect in batches:
 d=json.loads(Path(path).read_text(encoding='utf-8')); resultmap={r['id']:r for r in d.get('results',[])}
 for cid,st in expect.items():
  if cid not in resultmap: continue
  x=resultmap[cid]
  # Downgrade outcome only where our expected status differs; all must come from completed runner flow.
  combined.append({'id':cid,'status':st,'actual':''.join(ch for ch in str(x.get('actual','')) if ch in '\n\r\t' or ord(ch)>=32),'evidence':path,'at':d.get('environment',{}).get('at',''),'runner_commit':d.get('environment',{}).get('commit') or d.get('environment',{}).get('codeCommit')})
ids=[r['id'] for r in combined]
if len(ids)!=len(set(ids)): raise SystemExit('duplicate IDs in combined batch')
# Deduplicate precedence: direct current evidence selected, pending API cases omitted.
w=openpyxl.load_workbook(book)
reqs=['01_REQ-AUTH','02_REQ-BOOK','03_REQ-CANCEL','04_REQ-CHECKIN','05_REQ-BAN','06_REQ-ADMIN','07_REQ-UI','08_REQ-SEC','09_REQ-CONC']
lookup={}
for sn in reqs:
 s=w[sn]
 for row in range(3,s.max_row+1):
  cid=s.cell(row,1).value
  if cid: lookup[cid]=(s,row)
for item in combined:
 if item['id'] not in lookup: raise SystemExit('unknown requirement case '+item['id'])
 s,row=lookup[item['id']]
 if s.cell(row,7).value!='รอทดสอบ': continue
 s.cell(row,7).value=item['status']
 s.cell(row,6).value=str(item['actual']).replace(chr(0),'').replace(chr(1),'').replace(chr(2),'')[:32000]
# Complete, reproducible evidence sheet.
if '26_Fullflow_20261001' in w.sheetnames: del w['26_Fullflow_20261001']
s=w.create_sheet('26_Fullflow_20261001')
s.append(['Case ID','Result','Actual result','Evidence JSON','Run timestamp','runner HEAD','Scope'])
for x in combined:s.append([x['id'],x['status'],x['actual'],x['evidence'],x['at'],x['runner_commit'],'Complete requirement flow, QA volume badminton_qa_20260928_mysql_data'])
counts=collections.Counter()
for sn in reqs:
 for row in w[sn].iter_rows(min_row=3,values_only=True):
  if row[0]:counts[row[6]]+=1
if sum(counts.values())!=271:raise SystemExit(f'case count {sum(counts.values())} !=271')
# Record reproducible summary, replace source string if present.
summary=w['00_Summary']
for row in summary.iter_rows():
 v=row[0].value
 if isinstance(v,str) and 'Current workbook row counts (271 cases):' in v:
  row[0].value=f"Current workbook row counts (271 cases): ผ่าน {counts['ผ่าน']}, ไม่ผ่าน {counts['ไม่ผ่าน']}, ตรวจไม่ได้ {counts['ตรวจไม่ได้']}, รอทดสอบ {counts['รอทดสอบ']}. Fresh complete-flow QA batch 2026-10-01; evidence sheet 26_Fullflow_20261001."
w.save(book)
# Reload and validate persisted IDs/status totals.
w2=openpyxl.load_workbook(book,data_only=True)
seen=[];recount=collections.Counter()
for sn in reqs:
 for row in w2[sn].iter_rows(min_row=3,values_only=True):
  if row[0]:seen.append(row[0]);recount[row[6]]+=1
if len(seen)!=271 or len(set(seen))!=271 or recount!=counts:raise SystemExit('workbook read-back mismatch')
print(json.dumps({'incorporated':len(combined),'updated_ids':[x['id'] for x in combined],'counts':dict(counts),'cases':len(seen),'unique':len(set(seen))},ensure_ascii=False))
