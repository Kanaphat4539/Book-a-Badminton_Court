# บันทึกพักงาน QA — feature-Docx

## คำสั่งและขอบเขต

ผู้ใช้อนุญาตให้ทำงานต่อขณะพัก แก้บั๊กที่ขวางการทดสอบ พร้อมแยกเอกสาร MD และบันทึกผล XLSX ก่อนจัดทำ DOCX เมื่อทดสอบครบ ยังไม่อนุญาต commit/push การวัด token quota เหลือ 5% แบบตรง ๆ ไม่สามารถตรวจได้ในเครื่องมือที่ใช้ จึงห้ามอ้างว่าพักตรง 5% พอดี

## จุดตรวจล่าสุดที่ parent รันยืนยันเอง

- จาก root: `npm --prefix backend test -- --runInBand` — ผ่าน 11/11 suites และ 24/24 tests, exit code 0
- `node testing/run_pending_api_batch_20261001.cjs` — requirement cases ผ่าน 17/17, ไม่ผ่าน 0; อีก 3 API subchecks ไม่ใช่ผลผ่านครบ UI flow
- หลักฐานรอบยืนยัน: `testing/evidence/qa_pending_api_batch_2026-10-01T02-35-07-730Z.json`
- Cleanup ของรอบยืนยัน: remainingBookings=0, remainingBatchStudents=0, remainingBatchAdmins=0
- รอบก่อนหน้าที่นำเข้า XLSX: `testing/evidence/qa_pending_api_batch_2026-10-01T02-32-31-566Z.json` ผ่านชุดเดียวกัน 17/17

## สถานะงาน

XLSX ล่าสุดที่รายงานไว้รวม 271 cases: ผ่าน 56, ไม่ผ่าน 11, ตรวจไม่ได้ 46, รอทดสอบ 158 ให้ตรวจนับจากแถว ID จริงอีกครั้งก่อนทำรายงานฉบับต่อไป ไม่ใช้ API subchecks หรือ historical results เพิ่มยอดผ่าน

ไฟล์หลัก:
- `testing/Test_Case_Book-a-Badminton_Court_Results_20261001_feature-Docx_QA.xlsx`
- `testing/QA_BLOCKER_FIXES_20261001.md`
- `testing/QA_API_PROGRESS_20261001_TH.md`
- `testing/PROGRESS_CHECKPOINT.md` และ `.json`
- scratch handoff: `C:/Users/TEE/AppData/Local/hermes/cache/scratch/BADMINTON_QA_HANDOFF.md`

DOCX ที่มีอยู่ยังเป็น draft ไม่ใช่ฉบับสมบูรณ์ และยังไม่ได้ทดสอบครบ

## การแก้ที่ผ่านการตรวจ

- Lifecycle transaction-manager mock เพิ่ม Student repository
- Login helper รอค่ากรอกเสถียรระหว่าง hydration; เคยยืนยัน Student 5/5 และ Admin 5/5
- Admin creation ปฏิเสธรหัสผ่านที่ขาดหรือว่าง
- Booking responses และ user-list responses ไม่ส่ง password fields
- Finish read/check/write อยู่ใน mutex/transaction; finish ID ผิดรูปแบบถูก ParseIntPipe ปฏิเสธ 400 แทน 500
- Registration ตรวจรหัสผ่าน อีเมล และ student ID; บัญชีใหม่ใช้ bcrypt; non-string login usernames ปฏิเสธอย่างควบคุมได้
- Court ID ผิดรูปแบบหรือไม่มีอยู่ ถูกปฏิเสธก่อนบันทึก booking
- บัญชี plaintext เก่าไม่ได้ bulk migrate; login ยัง backward-compatible เป็นข้อจำกัดที่ต้องวางแผน migration ต่อ ไม่ถือว่า security migration เสร็จแล้ว

## สภาพแวดล้อม

Compose project `badminton-qa`: `docker-compose.yml` + `testing/compose.qa.yml`; volume `badminton_qa_20260928_mysql_data` เท่านั้น พอร์ต loopback frontend3001/backend4001/MySQL13306 ไม่ใช้3306ของ host และห้าม down -v

Parent ตรวจพบ services รันอยู่ก่อนรอบยืนยันล่าสุด ยังไม่ได้สั่งหยุดในบันทึกนี้ Source hashes ของ service ที่ runner ตรวจตรงกับ container runtime ก่อนทดสอบ; ไม่ต้องถือ cache layer เป็นหลักฐานว่าซอร์สเก่า แต่ต้องเทียบ hash ก่อนใช้ผล

## สิ่งที่ต้องทำต่อ

1. ตรวจ git status และ diff รักษางานค้าง ไม่มี commit/push
2. อ่าน root CLAUDE.md/feedback.md และ nested instructions พร้อม skills systematic-debugging/test-driven-development/xlsx/test-case-table-authoring
3. เลือก 158 pending ตาม actual steps ให้ตรงวิธี API/UI/service ไม่ทำ API-only แล้วนับ UI pass
4. ตรวจ 11 failures ด้วย fixtures แยกและ requirements จริง; 46 unable ต้องแยก manual-device limitations ออกจาก runner issues
5. เก็บ evidence เป็นราย ID มี source fingerprint ปัจจุบัน และอัปเดต XLSX/MD/checkpoint ทุก batch
6. ตรวจ plaintext-account migration และ race ที่ยังไม่มีหลักฐานยืนยันอย่างรอบคอบ ไม่ bulk แก้บัญชีจริง
7. เมื่อทดสอบครบจึงสร้าง DOCX พร้อม review ไม่ใช้ draft เดิมเป็น final

มีไฟล์ `NUL` untracked และ evidence หลายรอบจากการ debug: ยังไม่ได้ลบหรือรวม ห้าม cleanup ทิ้งหลักฐานโดยไม่ตรวจ scope
