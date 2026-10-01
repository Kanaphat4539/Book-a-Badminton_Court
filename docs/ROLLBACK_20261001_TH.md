# บันทึกการรีสโตร์ branch `ferture-tee-tran` (2026-10-01)

## สิ่งที่ผู้ใช้สั่ง

"รีทุกอย่างเหลือแค่ทำสองภาษาหน้า admin กลับเป็นเหมือนเดิมแต่ต้นที่ได้จาก dev" และยืนยันขอบเขตว่า
หน้า admin ให้เหมือนของ dev แต่สลับ ไทย/อังกฤษได้เหมือนหน้าอื่น ๆ (ใช้ระบบภาษาที่มีอยู่)

## จุดตั้งต้น

- branch `ferture-tee-tran` ชี้ที่ `f9cc9f6` ซึ่งเป็น commit เดียวกับ `dev` (ไม่มี commit บน branch เลย ทุกอย่างอยู่ใน working tree)
- งานทั้งหมดเป็นไฟล์ที่ยังไม่ commit จึงสำรองไว้ก่อนรี:
  `C:\GuisTee\UseHermes\rollback-backup-20261001-2150\`
  - `tracked-changes.patch` — diff ของไฟล์ที่ track อยู่ (311 KB)
  - `working-tree-snapshot.tgz` — snapshot ทั้ง working tree (38 MB)
  - `status-before-rollback.txt`, `untracked-list.txt` — รายการไฟล์ ณ ก่อนรี

## สิ่งที่ถอดออก (คืนค่าเป็นของ dev)

| งาน | ไฟล์ที่ถอดออก |
| --- | --- |
| Analytics/กราฟ/KPI แบบใหม่ + คอมโพเนนต์แยก | `frontend/src/components/AdminAnalyticsDashboard.tsx`, `src/lib/dashboard-analytics.*`, `tests/dashboard-structure.test.mjs` |
| Export XLSX ฝั่ง backend | `backend/src/bookings/bookings.controller.ts` (endpoint export), `bookings.controller.spec.ts`, `backend/test/bookings-export.e2e-spec.ts`, `backend/package.json`, `backend/package-lock.json` |
| QR/A07 ที่เขียนใหม่ (Admin เลือกการจองแล้วออก QR) | `src/lib/checkin-qr.*`, `tests/admin-qr-*.test.mjs`, หลักฐาน `testing/evidence/admin_qr_*` |
| โครงหน้า `dashboard/page.tsx` แบบใหม่ | คืนไฟล์ทั้งไฟล์เป็นของ dev แล้วเติมสองภาษาเฉพาะมุมมอง ADMIN |

## สิ่งที่เก็บไว้ (งานสองภาษา)

- ระบบภาษา: `src/components/locale-provider.tsx`, `src/app/layout.tsx`, ปุ่มสลับภาษาใน `src/components/MainLayout.tsx`
- พจนานุกรม/โมดูลคำแปล: `src/lib/locale-messages.cjs`, `landing-messages.cjs`, `auth-news-messages.cjs`,
  `booking-page-messages.cjs`, `booking-overview-copy.cjs`, `select-court-copy.cjs`, `backend-error-messages.cjs`,
  `dashboard-action-copy.cjs` + ไฟล์เทสต์ของแต่ละตัว
- หน้าที่แปลแล้ว: `/`, `/login`, `/register`, `/news`, `/booking`, `/booking/select-court`, `/scan`, `/admin/users`, และมุมมอง ADMIN ของ `/dashboard`

## งานใหม่รอบนี้: สองภาษาของมุมมอง ADMIN ใน `/dashboard`

- `src/lib/admin-dashboard-copy.cjs` (+ `.d.cts`) — พจนานุกรม ไทย/อังกฤษ ของมุมมอง admin (หัวข้อ, KPI, ตัวกรอง, การ์ดการจอง, modal รายละเอียด, ป้ายสถานะ/บทบาท, ปุ่ม, ข้อความ QR)
- `dashboard/page.tsx` — มุมมอง ADMIN (บรรทัด 453–1361) ดึงข้อความจากพจนานุกรมทั้งหมด;
  มุมมองนักศึกษา (บรรทัดถัดไปจนจบไฟล์) คงข้อความเดิมของ dev ตามคำสั่ง
- `dashboard-action-copy.cjs` — เพิ่มคีย์ toast/คำยืนยันที่ admin มองเห็น (finish/cancel/sync/export/reset)
- เทสต์: `src/lib/admin-dashboard-copy.test.cjs`, `tests/admin-dashboard-localization.test.mjs`
  (ตรวจว่ามุมมอง admin ไม่มีข้อความ hard-coded ไทย/อังกฤษเหลือ, ใช้ `c.*` จากพจนานุกรม ≥ 40 จุด,
  และ QR ของ admin ยังเข้ารหัส "เลขสนาม" ให้หน้า `/scan` อ่านด้วย `parseInt` ได้)

## หลักฐานที่รันจริง

| การตรวจ | ผล |
| --- | --- |
| `node --test tests/*.test.mjs src/lib/*.test.cjs` | 49/49 ผ่าน |
| `npx tsc --noEmit` | ผ่าน |
| `npm run build` | Compiled successfully |
| `git diff --check` | ผ่าน |
| ตรวจด้วยสคริปต์ `admin_copy_tool.py list` | มุมมอง admin ไม่เหลือข้อความที่ต้องแปล (เหลือแต่ชื่อแบรนด์/ไอคอนของดีไซน์) |

## ข้อจำกัด

- ยังไม่ได้คลิกทดสอบผ่าน browser จริง (ต้องมีบัญชีทดสอบ/approval) — สิ่งที่ยืนยันคือ static guard, parity ของพจนานุกรม, type-check และ production build
- มุมมองนักศึกษาใน `/dashboard` ยังเป็นข้อความเดิมของ dev (ไม่ได้ทำสองภาษา) ตามขอบเขตที่ตกลง
- ยังไม่ commit/push
- เอกสารที่อธิบายฟีเจอร์ซึ่งถอดออกไปแล้วถูกติดป้ายกำกับที่ต้นไฟล์ว่า superseded
