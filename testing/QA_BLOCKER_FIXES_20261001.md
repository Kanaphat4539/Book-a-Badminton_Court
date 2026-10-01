# QA blocker fixes — 2026-10-01

## สรุปผล

ทดสอบบน branch `feature-Docx` ที่ HEAD `60a23c800d56a4f012cdead21adf4ab3f38d0e82` โดยไม่ commit/push และไม่แก้ production logic แก้เฉพาะ QA login helper: marker `__reactProps` เดิมไม่ยืนยันว่า input ควบคุมโดย React แล้ว; helper ใหม่กรอกซ้ำจน username/password คงค่าต่อเนื่อง 500ms และตรวจ HTTP auth response ก่อนรอ dashboard

## Regression และ login verification

- `node testing/login_helper.test.cjs`: ผ่าน; regression จำลอง controlled-input reset ที่หน่วงเวลา แสดงว่า fill แบบเดิมถูกล้าง ส่วน helper ใหม่กู้ค่าและรักษาค่าทั้งสองได้
- Chromium กับแอปจริง: student 5/5 และ admin 5/5 login POST ได้ HTTP 201, role ตรง, ไป `/dashboard` รวม 10/10
- `TC_UI_001` rerun ผ่าน; full UI suite rerun 33 case IDs: 10 ผ่าน, 10 ไม่ผ่าน, 13 ตรวจไม่ได้/partial. บาง case ยังมี navigation timeout หรือ assertion/fixture failures แยกจาก login helper; ไม่เปลี่ยนเป็น PASS และเก็บรายละเอียดตาม evidence
- ไม่มีการเปลี่ยน production authentication code


## สภาพแวดล้อม QA ที่แยกจากข้อมูลจริง

- ใช้ Compose project `badminton-qa` และ MySQL volume ภายนอกชื่อ `badminton_qa_20260928_mysql_data` ซึ่งยืนยัน mount แล้ว
- พอร์ตที่เปิดเฉพาะ loopback: frontend `127.0.0.1:3001`, backend `127.0.0.1:4001`, MySQL `127.0.0.1:13306` ตรวจซ้ำด้วย `docker compose ps` และ `docker inspect`
- แก้ QA runner ให้ใช้ `DB_PORT` (ค่า 13306) และเขียน commit marker จาก `git rev-parse HEAD` แทนค่าเก่า hardcoded; ยังรักษา volume guard
- การตรวจเริ่ม suite เต็มหนึ่งครั้งใช้เวลาจนหมด window โดยไม่มี evidence; แบ่งรัน UI suite เป็น batch ต่อมา มีบาง case ผ่าน และหลาย case ติด timeout ในขั้น login
- ฐานข้อมูล QA ตรวจว่ามี booking 0 รายการก่อนทดสอบ; ต่อมา runner พบ booking ที่เหลือจาก batch ก่อนหน้า จึงปรับการ cleanup ให้ลบได้เฉพาะ booking ของ test student `65010000` และหยุดปฏิเสธเมื่อพบข้อมูลนอก scope

## ผลที่ยืนยันได้

- Backend Jest suite เต็ม: 11/11 suites และ 18/18 tests ผ่าน (ผลที่ parent ยืนยัน)
- Chromium login smoke test ที่บันทึกไว้ก่อนหน้านี้: HTTP 201, ไป `/dashboard`, role STUDENT; token ไม่ถูกบันทึกลงหลักฐาน
- UI batch ก่อนหน้า: 30 case IDs เคยถูกทดสอบ; ผลรอบนั้นบางส่วนติด login timeout. หลังปรับ hydration helper มี regression test, 10 real role-specific logins ผ่าน และ full UI rerun 33 case IDs ได้ผล 10 ผ่าน / 10 ไม่ผ่าน / 13 ตรวจไม่ได้หรือ partial; ดู JSON ล่าสุดเพื่อแยกสาเหตุ
- XLSX requirement cases 271 รายการ ปรับด้วยผลปัจจุบัน: ผ่าน 17, ไม่ผ่าน 12, ตรวจไม่ได้ 16, รอทดสอบ 226 รวม 271. มี fresh UI result 33 IDs และ login evidence แยก; ไม่รวม source `37aea29` เป็นผล fresh

## ประเด็น API ที่ยังต้องตัดสิน

- `TC_BOOK_011`: เวลา 18:30 ถูกปฏิเสธว่าเวลาเริ่มไม่ถูกต้อง แทนการตรวจ overlap; ต้องเทียบ expected กับกฎจองเป็นช่วงชั่วโมงเต็ม
- `TC_BOOK_022`: `24:00` ได้ข้อความเวลาทำการ แทนข้อความ invalid-time ที่คาด; exact assertion ไม่ตรง
- `TC_BOOK_025`: ไม่ได้ freeze เวลา จึงยังพิสูจน์กรณีรอบเวลาผ่านไปไม่ได้
- `TC_BOOK_009` ใช้ fixture เปลี่ยนสถานะเองแทน scheduler จริง; `TC_BOOK_015` ทดสอบ API ไม่ได้ยืนยัน 15 slots ใน UI

## ไฟล์ที่เกี่ยวข้อง

- `testing/compose.qa.yml` — Compose override พร้อม external volume ที่ระบุชื่อชัด
- `testing/run_qa_ui_suite.cjs`, `testing/login_helper.cjs`, `testing/login_helper.test.cjs` — hydration-safe controlled-input login and regression
- `testing/evidence/qa_ui_login_hydration_fix_20261001.json`, `testing/evidence/qa_ui_suite_hydration_full_results.json` — role-repeat and full UI rerun evidence
- `testing/update_hydration_qa_workbook.py` — maps current 33 UI case results into workbook and verifies total/status counts
- `testing/Test_Case_Book-a-Badminton_Court_Results_20261001_feature-Docx_QA.xlsx` — per-case outcomes and recalculated totals
- `backend/src/auth/auth.service.spec.ts`, `backend/src/bookings/booking-lifecycle.spec.ts` — earlier test coverage/mock edits; no production logic change

## สถานะเอกสารและงานค้าง

DOCX ที่มีอยู่ยังเป็น draft ไม่ finalize เพราะมี UI/API cases ที่ยัง pending/partial หรือมี assertion failure ตามหลักฐานจริง; login helper issue ได้รับการแก้และยืนยัน regression/repeated login แล้ว. รัน API cases ที่เหลือและแก้เฉพาะ oracle/fixture ที่ตรวจ requirement แล้ว; ปรับ controlled-clock cases และทวน XLSX ก่อนสร้างรายงานฉบับ final. ไม่มีการ push หรือ commit
