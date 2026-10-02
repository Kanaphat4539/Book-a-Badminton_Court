> **สถานะ: งานนี้กลับมาอยู่ใน working tree ของ `ferture-tee-tran` แล้ว (2026-10-01)** — ดูสรุปและหลักฐานล่าสุดที่ `docs/BILINGUAL_CHARTS_XLSX_TH.md`

# การตรวจสอบ HTTP สำหรับส่งออก XLSX รายการจอง

## ขอบเขตและข้อจำกัด

- ชุดทดสอบ `backend/test/bookings-export.e2e-spec.ts` เปิด Nest test application และยิง HTTP จริงผ่าน Express/Supertest ไปยัง `BookingsController` ที่ใช้ `JwtAuthGuard` และ `RolesGuard` จริง
- JWT ใช้ signing key เฉพาะในชุดทดสอบ และ Passport strategy สำหรับ test; ไม่พิมพ์หรือใช้รหัสผ่าน/secret ของระบบจริง
- `BookingsService` ถูกแทนด้วย fixture ในหน่วยความจำ เพื่อแยกผลจากฐานข้อมูลภายนอก; จึงยืนยัน HTTP routing, guards, controller, filter และไฟล์ XLSX ได้ แต่ไม่ใช่การตรวจข้อมูล production หรือ query/database integration
- เนื้อหา XLSX ถูกอ่านกลับด้วย ExcelJS จาก bytes ที่ HTTP ส่งคืน ไม่ได้ยืนยันเพียง metadata หรือ mock response

## สิ่งที่ครอบคลุม

- ไม่มี Bearer token ได้ HTTP 401; JWT นักศึกษาได้ HTTP 403; JWT ADMIN ได้ HTTP 200
- workbook ภาษาไทยเมื่อไม่ระบุ `lang` และภาษาอังกฤษเมื่อ `lang=en`
- ตัวกรอง court, status, search, from/to วันที่ และขอบเขตวันแบบรวมวันเริ่ม/วันสิ้นสุด
- ตรวจ date format ที่ไม่ถูกต้อง, วันปฏิทินที่ไม่มีจริง, วันที่บางส่วน และช่วงวันที่กลับด้าน ต้องได้ HTTP 400
- ตรวจเนื้อหาตารางจริง, ค่า formula-like ที่ถูก escape เป็นข้อความ, และไม่มี password/QR token ใน cell
- ยืนยันชื่อ query วันที่ `dateFrom`/`dateTo` ที่ frontend ส่ง และชื่อเดิม `from`/`to` เพื่อคง backward compatibility

## สัญญาตัวกรอง frontend/backend

`frontend/src/app/dashboard/page.tsx` ส่ง `court`, `status`, `search`, `lang`, `dateFrom`, `dateTo`; controller รับค่าเหล่านี้และยังรับ `from`/`to` เดิมด้วย วันที่อ้างอิง `booking_date` (คีย์วันที่ YYYY-MM-DD ในเวลาไทย) และการเปรียบเทียบช่วงเป็น inclusive

สถานะที่ backend รองรับ: `ALL`, `ACTIVE`, `READY_CHECK_IN`, `PENDING`, `CHECKED_IN`, `CANCELLED`, `COMPLETED` ส่วนหน้า Dashboard หลักเลือก `ALL`, `CANCELLED`, `ACTIVE`, `READY_CHECK_IN`, `COMPLETED`; ทั้งสองฝั่งจึงสอดคล้องกับตัวเลือก UI

## คำสั่งตรวจสอบ

เรียกจากโฟลเดอร์ `backend`:

```sh
npm run test:e2e -- --runInBand --runTestsByPath test/bookings-export.e2e-spec.ts
npm test -- --runInBand src/bookings/bookings.controller.spec.ts
npm run build
npm test -- --runInBand
```

ผลตรวจครั้งนี้: HTTP integration 7/7 ผ่าน, controller unit 7/7 ผ่าน และ Nest build ผ่าน ผล Jest เต็มชุดมี 10 suites ผ่านและ 1 suite ไม่ผ่าน (17 tests ผ่าน, 7 ไม่ผ่าน จาก 24 tests): `src/bookings/booking-lifecycle.spec.ts` ล้มเหลวเพราะ transactional mock ไม่มี `getRepository`; ความล้มเหลวดังกล่าวอยู่นอกขอบเขต export และไม่ได้เกิดจาก HTTP export tests.

## หมายเหตุการแก้ไข

พบ frontend ส่ง `dateFrom`/`dateTo` ในขณะที่ controller เดิมอ่าน `from`/`to`, ทำให้ export ละเลยช่วงวันที่จาก UI โดยไม่เกิด error. Controller รองรับชื่อที่ frontend ใช้แล้ว และยังคง alias เดิม. Regression test ที่ส่งผ่าน HTTP และอ่าน workbook ล้มเหลวก่อนแก้ (ได้ทุกแถวแทนช่วงวันที่แคบ) และผ่านหลังแก้.
