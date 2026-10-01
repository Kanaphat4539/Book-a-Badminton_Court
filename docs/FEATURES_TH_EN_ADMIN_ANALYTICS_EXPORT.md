> **สถานะ: งานนี้กลับมาอยู่ใน working tree ของ `ferture-tee-tran` แล้ว (2026-10-01)** — ดูสรุปและหลักฐานล่าสุดที่ `docs/BILINGUAL_CHARTS_XLSX_TH.md`

# บันทึกฟีเจอร์ภาษาและรายงานผู้ดูแล

> **สถานะล่าสุด — กลับมาปิดงาน `ferture-tee-tran`**
>
> เนื้อหาด้านล่างเป็น checkpoint รอบก่อนหน้า ไม่ใช่สถานะปัจจุบันทั้งหมด โดยเฉพาะข้อความว่าแปลหน้ายังไม่ครบ, XLSX default ยังเป็น English และตัวกรอง READY ยังไม่ตรง ซึ่งมีการแก้ภายหลังแล้ว ดู `FINAL_FEATURE_REVIEW_TH.md` และเอกสาร verification แยกรายฟีเจอร์ประกอบ
>
> ฟีเจอร์ที่เพิ่มใน working tree: Thai/English (Thai default), Admin analytics จาก booking records และ ADMIN-only XLSX export พร้อมตัวกรองวันที่/สนาม/สถานะ/ค้นหาและ formula escaping; ลบ legacy Admin render branch และเพิ่มหมวด Other ในกราฟแล้ว
>
> ผลตรวจที่รันจริงก่อนพัก: frontend helper tests 41/41, dashboard structure 1/1, TypeScript และ frontend/backend build ผ่าน, export controller 7/7 และ HTTP integration 7/7 ผ่าน ผลเหล่านี้ไม่ใช่การทดสอบใหญ่ครบทุกเคสหรือ browser E2E
>
> ตามคำสั่งล่าสุด: ปิดงาน feature branch นี้ก่อน ไม่ merge dev, ไม่สลับไป branch Docx, ไม่ commit/push และไม่เริ่มทดสอบใหญ่โดยอัตโนมัติ Browser authenticated interaction/download ยังไม่ยืนยัน; lint ทั้งโปรเจกต์ยังไม่มีผลผ่าน

## ขอบเขตที่เพิ่ม

- เพิ่มตัวเลือกภาษาไทย/English ที่บันทึกไว้ใน `localStorage` (`site-locale`) และเปลี่ยน `<html lang>` ให้ตรงภาษา ค่าเริ่มต้นใหม่เป็นภาษาไทย
- เพิ่มคำแปลส่วนกลางสำหรับป้ายเมนู/ส่วนควบคุม และคำแปลหน้าภาพรวมผู้ดูแลที่แก้ในรอบนี้
- เปลี่ยนกราฟผู้ดูแลให้คำนวณจากรายการจองจริงที่โหลดจาก `GET /bookings` แทนชุดตัวเลขตัวอย่าง กรองตามสนามและช่วงเวลา วัน/สัปดาห์/เดือน/ปี โดยใช้ `booking_date`; ไม่แสดง trend เทียบช่วงก่อนเนื่องจาก API ปัจจุบันไม่ได้ให้ข้อมูลก่อนช่วงที่เลือก
- KPI แสดงจำนวนการจองและการยกเลิกจริงในช่วงที่เลือก พร้อมสัดส่วนสถานะที่ระบุความหมาย ไม่อ้างอัตราใช้สนามหรือแนวโน้มที่ระบบไม่มีข้อมูลรองรับ
- เพิ่ม `GET /bookings/export.xlsx` สำหรับ ADMIN เท่านั้น สร้างไฟล์ XLSX จริง ฝังชื่อคอลัมน์ภาษาไทย/อังกฤษ และส่งเฉพาะฟิลด์บันทึกการจอง (รหัสจอง/นักศึกษา/ชื่อ/สนาม/วัน/เวลา/สถานะ/เวลาแก้ไข) ป้องกัน cache และ escape ค่าข้อความที่ขึ้นต้น `= + - @` ก่อนเขียน workbook
- ปุ่มส่งออกส่งตัวกรองสนามและสถานะปัจจุบัน แต่ส่งออกทุกแถวที่ตรงตัวกรอง ไม่จำกัดเฉพาะหน้าที่กำลังแสดง

## ไฟล์หลัก

- `frontend/src/components/locale-provider.tsx` — state ภาษา/ข้อความ/การจำค่าที่เลือก
- `frontend/src/app/layout.tsx`, `frontend/src/components/MainLayout.tsx` — ภาษาเริ่มต้นและตัวเลือกภาษากับเมนู
- `frontend/src/app/dashboard/page.tsx`, `frontend/src/lib/dashboard-analytics.cjs` — กราฟ/KPI และการดาวน์โหลด
- `frontend/src/lib/dashboard-analytics.test.cjs` — ทดสอบการรวมข้อมูลจริงตามช่วงและสนาม
- `backend/src/bookings/bookings.controller.ts`, `backend/src/bookings/bookings.controller.spec.ts` — endpoint XLSX, role gate, filter และทดสอบเปิด workbook
- `backend/package.json`, `backend/package-lock.json` — เพิ่ม ExcelJS สำหรับการสร้าง XLSX

## การใช้

1. กดปุ่ม `EN` หรือ `ไทย` ในแถบด้านบนเพื่อสลับภาษา
2. ในหน้า Admin เลือกช่วงเวลา/สนามเพื่อดูยอดจริง แล้วเลือกสถานะ/สนามในส่วนประวัติ
3. กดส่งออก Excel เพื่อดาวน์โหลด workbook ตามตัวกรองสถานะและสนามที่เลือก ข้อมูลทั้งหมดที่ตรงตัวกรองรวมอยู่ในไฟล์ ไม่ใช่เฉพาะหน้าปัจจุบัน

## ข้อจำกัดที่ควรรู้

- API รายการจองปัจจุบันส่งประวัติทั้งหมดและไม่มี endpoint สรุป/กำหนดช่วงวันที่ฝั่ง server; กราฟจำกัดช่วงโดย client จากข้อมูลที่ endpoint ส่งมา และอาจมีต้นทุนสูงเมื่อข้อมูลสะสมมาก
- การจัดกลุ่มรายวันใช้ `time_in`; ช่วงสัปดาห์เริ่มวันจันทร์ตามวันที่ปัจจุบันใน Asia/Bangkok; เดือน/ปีนับจากวันแรกจนถึงวันนี้
- ยังไม่มีการเปรียบเทียบกับช่วงก่อน เพราะ API ไม่ได้ให้ประวัติครบช่วงเปรียบเทียบ
- เพิ่มตัวเลือกภาษาเดียวกันในหน้า Landing, Login และ Register แต่ข้อความเนื้อหาทุกหน้า/ทุก validation/toast ยังไม่ได้แปลครบ; หน้า Booking/Scan/News/Admin users และ API errors ยังต้องขยาย dictionary ก่อนประกาศว่า localization ครบระบบ
- ไม่ได้ทดสอบ endpoint กับฐานข้อมูลหรือบัญชีจริง เนื่องจากการยืนยันการควบคุม browser ถูกบล็อกโดย approval gate; ไม่ได้ลองซ้ำด้วยวิธีอื่น

## รูปแบบอ้างอิงที่ศึกษา

- shadcn/ui chart examples: <https://ui.shadcn.com/charts/area> — นำแนวคิดกราฟแนวโน้มที่มีลำดับชั้นชัด, ป้ายแกน/ช่วงเวลา และ responsive viewport มาใช้; ไม่ได้นำข้อมูลตัวอย่างมาใช้
- Stripe Dashboard chart layout: <https://docs.stripe.com/stripe-apps/patterns/chart-layout> — ใช้แนวคิดวางตัวชี้วัด/กราฟและตัวกรองใกล้กัน พร้อมคำอธิบายที่สื่อความหมาย; ไม่ได้คัดลอกตัวชี้วัดที่ไม่มีในระบบนี้

## หลักฐานตรวจใน checkout

- `node --test src/lib/dashboard-analytics.test.cjs` (frontend): ผ่าน 2/2
- `npm test -- --runInBand bookings.controller.spec.ts` (backend): ผ่าน 4/4
- `npm run build` (backend): ผ่าน
- `npm run build` (frontend): ผ่าน; Next.js แจ้งเตือน workspace root จากหลาย lockfile
- `git diff --check`: ผ่าน
- Browser ตรวจหน้า login ก่อนแก้ภาษาได้; การคลิกเพื่อทดสอบสลับภาษาถูก browser approval gate ปฏิเสธ จึงยังไม่ได้ยืนยันการสลับจริง, analytics แบบ authenticated หรือดาวน์โหลด XLSX ผ่าน browser
- `npm run lint` (frontend): ยังไม่ผ่านที่รอบก่อนหน้า; ต้องแก้/แยก errors เดิมและใหม่
- ไม่ได้ push/commit

## จุดพักงาน / ส่งต่องาน

สถานะ ณ จุดพัก: branch `ferture-tee-tran`; ไม่มี commit/push ตามคำสั่ง ผู้ใช้ขอหยุดงานก่อนและกลับมารันต่อภายหลัง จึงไม่มีการแก้โค้ดหรือสั่ง build/test เพิ่มหลังคำขอหยุด

### สิ่งที่มีอยู่แล้วใน working tree

- LocaleProvider ตั้ง Thai เป็นค่าเริ่มต้น, เก็บ `site-locale` ใน localStorage และปรับ `<html lang>`; ปุ่มเลือกภาษามีใน MainLayout และหน้า Landing/Login/Register ใช้ provider
- Dashboard มีการใช้ aggregation จริงแทน mock chart/KPI และปุ่ม export เรียก API XLSX; มี unit tests
- Endpoint `GET /bookings/export.xlsx` อยู่หลัง JWT + ADMIN role guard, มี ExcelJS workbook, text formula escaping และ filters
- รายละเอียดไฟล์และคำสั่งตรวจเดิมระบุในส่วนด้านบน; working tree มีไฟล์ `NUL` และ `testing/` ที่เป็น untracked อยู่ก่อนแล้ว ห้ามลบ/เขียนทับโดยไม่ตรวจที่มา

### ช่องว่างที่ยังห้ามถือว่าเสร็จ

1. **Localization ยังไม่ครบทั้งเว็บไซต์**: หน้า `/booking`, `/booking/select-court`, `/scan`, `/news`, `/admin/users` และข้อความ validation/API/toast บางส่วนยังเป็นข้อความ hard-coded; ต้องเติมคำแปลอย่างเจาะจง ไม่ใช้การแปล DOM แบบกว้างที่ทำให้ accessibility/ข้อมูลเปลี่ยนผิด
2. **ภาษาเริ่มต้นของ XLSX**: controller ปัจจุบันใช้ English เมื่อไม่มี `lang=th`; ต้องเปลี่ยน default ให้ Thai และทดสอบกรณีละ `lang`
3. **ความตรงกันของ export filter**: ตรวจ logic `READY_CHECK_IN`/ช่วงเวลาและนิยาม ACTIVE เทียบตัวกรองในหน้า dashboard ก่อนอ้างว่าไฟล์ตรงกับ UI; วันที่/`updated_at` ต้องไม่สร้างค่าปลอม
4. **การตรวจ browser จริงถูกปฏิเสธ**: approval gate ปฏิเสธ browser click สำหรับทดสอบก่อนหน้านี้ ผู้ใช้ระบุชัดห้ามเลี่ยงด้วย tool/route อื่น การทดสอบ authenticated click/download ต้องรออนุมัติใหม่โดยตรง; อย่าลองซ้ำเพื่อหลบ gate
5. **Verification เพิ่มเติมที่ค้าง**: lint frontend ยัง fail ตามบันทึก; รัน focused tests/build/lint หลังแก้ช่องว่างข้างต้น และถ้าได้รับอนุญาตค่อยตรวจ browser/download ด้วยบัญชี/fixture ทดสอบที่ปลอดภัย

### ขั้นตอนทำต่อ

- อ่าน `git status --short` และตรวจไฟล์ที่เปลี่ยนก่อนแตะต้อง; รักษา `NUL`/`testing/` และงานเดิมไว้
- ทำ TDD แยกกรณี Thai default ใน export และ localization/filters; รัน focused tests ก่อน/หลังแก้
- เติม localization แบบ explicit ในหน้าที่ยังขาด รวม validation, empty/error/loading states และ toast ที่เกี่ยวข้อง
- ตรวจ filter semantics ฝั่ง UI เทียบ export backend; เพิ่ม regression tests ทั้ง XLSX content/security/roles และ analytics
- รัน backend/frontend tests, lint/type-check และ production builds; browser download test ทำเฉพาะเมื่อได้รับ authorization gate ใหม่เท่านั้น
- ปรับบันทึกนี้ด้วยผลจริงและข้อจำกัดที่เหลือ; ไม่ commit/push เว้นแต่ผู้ใช้สั่ง

## A07 — QR ออกโดยผู้ดูแล เพื่อให้ผู้ใช้สแกนเช็กอิน (ปิดช่องว่างแล้ว)

ก่อนหน้านี้หน้า `AdminAnalyticsDashboard` ถูกเขียนใหม่จนไม่มีจุดออก QR (legacy `dashboard/page.tsx` เคยมี `import QRCode` แต่โค้ดที่ใช้ถูกตัดออกพร้อม dead branch) ตอนนี้คืนฟีเจอร์แล้วโดยยึดสัญญากับหน้า `/scan` ที่มีอยู่จริง

### สัญญาข้อมูลของ QR (สำคัญที่สุด)

หน้า `/scan` ถอด QR ด้วย `parseInt(decodedText, 10)` เพื่อได้ **เลขสนาม** แล้วจึงหาการจอง PENDING ของผู้ใช้ในสนามนั้นและเรียก `POST /bookings/:id/check-in` ด้วย `{ courtId }`
ดังนั้น QR ที่ผู้ดูแลแสดงต้องมีค่าเป็น **ตัวเลขสนามล้วน** ("1"–"4") เท่านั้น ถ้าใส่ JSON (booking_id/court_id/time) ผู้ใช้จะสแกนไม่ผ่าน และขึ้นข้อความ QR ไม่ถูกต้อง — ของเดิมที่ทำไว้เป็น JSON จึงถูกถอดออกและแทนด้วย helper กลาง

### ไฟล์ที่เพิ่ม/แก้

- `frontend/src/lib/checkin-qr.cjs` (+ `.d.cts`) — `CHECK_IN_COURTS`, `checkInQrValue`, `parseCheckInQr`, `checkInQrPayload`: แหล่งความจริงเดียวของค่า QR และรายละเอียดที่แสดง
- `frontend/src/components/AdminAnalyticsDashboard.tsx` — ส่วน "QR สำหรับเช็กอิน / Check-in QR" แสดง QR ต่อสนาม 4 ใบ และสรุปการจองที่เลือก (คลิกแถวในตาราง = เลือก, แถวที่เลือกถูกไฮไลต์) ข้อความสองภาษา
- `frontend/tests/admin-qr-structure.test.mjs`, `frontend/tests/admin-qr-render.test.mjs`, `frontend/src/lib/checkin-qr.test.cjs`

### หลักฐานที่รันจริง (2026-10-01)

| การตรวจ | คำสั่ง/วิธี | ผล |
| --- | --- | --- |
| Unit + structural + render | `node --test tests/*.test.mjs src/lib/*.test.cjs` | 65/65 ผ่าน |
| Type check | `npx tsc --noEmit` | ผ่าน |
| Production build | `npm run build` | Compiled successfully (12 หน้า) |
| เรนเดอร์ QR จริง | `node C:/GuisTee/UseHermes/book-preview/emit_admin_qr_panel.mjs` | ได้ QR 4 ใบ (SVG module จริง) — `testing/evidence/admin_qr_panel_rendered.html` |
| ถอดรหัส QR ด้วยตัวอ่านบิตสตรีมเอง | `python C:/GuisTee/UseHermes/book-preview/decode_rendered_qr.py` | ทั้ง 4 ใบถอดออกมาเป็นเลขสนามของตนเอง (byte mode, mask 2/3), PNG สำหรับสแกน: `testing/evidence/admin_qr_court{1..4}.png` |
| เช็กอินจริงผ่าน HTTP | `python C:/GuisTee/UseHermes/book-preview/verify_admin_qr_checkin.py` | สร้างนักศึกษาจำลอง → จอง → ค่า QR จาก helper = "2" → scan parse = 2 → `POST /bookings/482/check-in` = 201 CHECKED_IN → แถวใน DB = CHECKED_IN |
| ผู้ดูแลเห็นสถานะ | `python C:/GuisTee/UseHermes/book-preview/verify_admin_checkin_visibility.py` | `GET /bookings?date=...` เป็น 200 พบรายการสถานะ CHECKED_IN |

### ข้อจำกัดที่ยังเหลือ

- ยังไม่ได้คลิกทดสอบผ่าน browser จริง (ต้องมี approval gate/bัญชีทดสอบ); สิ่งที่ยืนยันคือเรนเดอร์จากคอมโพเนนต์จริง + อ่านค่าจากเมทริกซ์ QR + ยิง API จริง
- `npm run lint` (frontend) ยังไม่ผ่านตามบันทึกเดิม แยกได้ว่าเป็น error เดิมหรือใหม่ก่อนแก้
- ยังไม่ commit/push; งานยังอยู่บน `ferture-tee-tran`
