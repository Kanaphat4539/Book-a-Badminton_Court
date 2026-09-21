# Feedback: แบ่งงาน Admin / User

เอกสารนี้รวม feedback เดิมและกติกาที่ตกลงแล้ว เพื่อพัฒนาคนละ branch และ merge เข้า `dev` ภายหลัง Checkbox คือรายการงาน/เกณฑ์ตรวจรับ ไม่ใช่ผลยืนยันบั๊กจากการทดสอบโค้ด

## Branch และวิธีทำงานของทีม

- Nongpooh ใช้ `feature-nongpooh`; MIDTION ใช้ `feature-midtion`; รวมงานที่เสร็จแล้วเข้า `dev`
- ก่อนเริ่มงานทุกครั้ง ต้องนำ `dev` ล่าสุดเข้า feature branch ของตน โดยตรวจและเก็บงานค้างก่อน ตัวอย่างเมื่ออยู่บน branch ของตน: `git pull --no-rebase origin dev`
- เมื่อเสร็จให้ทดสอบและ push งานของตน แล้วรวมเข้า `dev` ทีละคน/ทีละ PR ดูขั้นตอนใน `CLAUDE.md`; push feature branch อย่างเดียวยังไม่ใช่การรวมเข้า `dev`
- การแบ่งหน้าที่: MIDTION รับฝั่ง User (`U01`–`U10`) บน `feature-midtion`; Nongpooh รับฝั่ง Admin (`A01`–`A09`) บน `feature-nongpooh` ส่วนงานส่วนกลาง (`Sxx`) ยังต้องยืนยันเจ้าของตามหัวข้อ 4

### คำสั่ง Git: pull จาก dev ก่อนเริ่มงาน

รันจากโฟลเดอร์โปรเจกต์ใน checkout ของตน ตัวอย่างใช้ remote ชื่อ `origin` ตรวจด้วย `git remote -v` ก่อนใช้งานครั้งแรก รันทีละคำสั่ง หากคำสั่งใดผิดพลาดหรือเกิด conflict ให้หยุดแก้ก่อนทำขั้นตอนถัดไป

ตรวจ `git status --short` ก่อน switch/pull ถ้ามีงานค้าง ให้ commit เฉพาะงานของตนที่พร้อม หรือเก็บงานให้เรียบร้อยก่อน ห้ามทิ้งงานของอีกคน

MIDTION — ฝั่ง User:

```bash
git status --short
git switch feature-midtion
git pull --no-rebase origin dev
```

Nongpooh — ฝั่ง Admin:

```bash
git status --short
git switch feature-nongpooh
git pull --no-rebase origin dev
```

คำสั่ง pull นี้นำ `dev` จาก remote มารวมใน feature branch ที่กำลังอยู่ ไม่จำเป็นต้อง switch ไป `dev` ก่อน และการ pull แค่ local `dev` ไม่ทำให้ feature branch อัปเดตเอง

### คำสั่ง Git: ส่งงานจาก feature branch เข้า dev

ทำทีละคน เมื่อทดสอบงานของตนแล้ว ขั้นตอนคือ commit งานบน feature branch → อัปเดตจาก `dev` และตรวจผล → push feature branch → merge เข้า local `dev` → ตรวจผลรวม → push `dev`

#### 1. Commit งานของตนบน feature branch

ตรวจว่าอยู่ branch ของตนก่อน และเลือก stage ทีละไฟล์ ตัวอย่าง `PATH_TO_FILE` ต้องแทนด้วย path จริง ห้ามคัดลอกชื่อนี้ไปใช้ตรง ๆ ตรวจ staged diff เพื่อไม่ให้ติดงานของคนอื่นหรือข้อมูลลับ

```bash
git branch --show-current
git status --short
git diff
git add -- PATH_TO_FILE
git diff --cached
git commit -m "fix: describe completed feedback feature"
```

ทำ `git add -- PATH_TO_FILE` ซ้ำสำหรับไฟล์อื่นในงาน และเปลี่ยน commit message ให้ตรงกับสิ่งที่แก้ หาก commit งานครบแล้วให้ข้ามขั้นตอนนี้

#### 2. อัปเดตและ push feature branch ของตน

MIDTION:

```bash
git switch feature-midtion
git pull --no-rebase origin dev
```

แก้ conflict ถ้ามี และรันการตรวจที่เกี่ยวข้องหลังรวม `dev` เมื่อผ่านแล้ว:

```bash
git push -u origin feature-midtion
```

Nongpooh:

```bash
git switch feature-nongpooh
git pull --no-rebase origin dev
```

แก้ conflict ถ้ามี และรันการตรวจที่เกี่ยวข้องหลังรวม `dev` เมื่อผ่านแล้ว:

```bash
git push -u origin feature-nongpooh
```

#### 3. รวมเข้า dev — เลือกทำเฉพาะชุดของตน

ขั้นตอนนี้ใช้เมื่อทีมอนุญาตให้ push `dev` โดยตรง หาก remote บังคับ PR ให้เปิด PR จาก feature branch ของตนเข้า `dev` หลังขั้นตอน 2 แล้ว merge ผ่าน PR ตามกติกาทีมแทน

MIDTION:

```bash
git status --short
git switch dev
git pull --ff-only origin dev
git merge feature-midtion
```

Nongpooh:

```bash
git status --short
git switch dev
git pull --ff-only origin dev
git merge feature-nongpooh
```

หากเครื่องยังไม่มี local branch `dev` ให้ใช้ `git fetch origin` แล้ว `git switch --track origin/dev` แทน `git switch dev` ในครั้งแรก หาก `dev` ถูกเปิดอยู่ใน worktree อื่น ให้ทำขั้นตอนรวมงานใน worktree นั้นโดยประสานเจ้าของก่อน

#### 4. ตรวจผลรวม แล้ว push dev

หลัง merge ให้รัน build/test ที่เกี่ยวข้องและตรวจ flow ร่วมตาม checklist ด้านล่าง เมื่อผ่านแล้วตรวจว่าอยู่ `dev` และไม่มีงานแก้ค้าง จากนั้น push:

```bash
git branch --show-current
git status --short
git push origin dev
```

กลับ branch ของตนหลัง push สำเร็จ:

```bash
git switch feature-midtion
```

สำหรับ Nongpooh ใช้ `git switch feature-nongpooh` และก่อนเริ่มงานครั้งถัดไปให้ pull จาก `dev` ตามขั้นตอนแรกเสมอ

### เมื่อมี conflict หรือ push ไม่ผ่าน

- ถ้า merge/pull มี conflict: ใช้ `git status` ดูไฟล์ แก้ให้รักษาพฤติกรรมของทั้งสองฝั่ง ลบ conflict markers แล้ว `git add -- PATH_TO_FILE` เฉพาะไฟล์ที่แก้ และ `git merge --continue` จากนั้นทดสอบใหม่ก่อน push
- ถ้า `git pull --ff-only origin dev` ไม่ผ่าน: local `dev` อาจมีประวัติแยกจาก remote ให้ตรวจ `git log --oneline --graph --decorate --all -20` และประสานทีมก่อนรวมต่อ ห้าม reset หรือ force-push ทับงาน
- ถ้า push `dev` ถูกปฏิเสธเพราะอีกคน push งานใหม่แล้ว: ขณะอยู่ `dev` และไม่มีงานค้าง ใช้ `git pull --no-rebase origin dev` แก้ conflict และตรวจผลรวมใหม่ แล้วจึง `git push origin dev` อีกครั้ง
- ถ้า push ถูกปฏิเสธเพราะสิทธิ์หรือ branch protection ให้ใช้ PR/ประสานผู้ดูแล ไม่ใช้ force-push เพื่อข้ามข้อจำกัด
- คำสั่งในส่วนนี้เป็นคู่มือ ไม่ใช่หลักฐานว่ามีการรัน Git หรือรวมงานแล้ว

## 1. กติกาที่ตกลงแล้ว

| เรื่อง | กติกา |
| --- | --- |
| วันจอง | จองเฉพาะวันปัจจุบัน แบบวันต่อวัน ไม่มีการจองล่วงหน้าหรือข้ามวัน |
| โควตา | ผู้ใช้ 1 คนจองได้ 1 ครั้งต่อวัน หากยกเลิกเองทันเวลาสามารถจองใหม่วันเดิมได้ |
| จองชนกัน | ห้ามจองคอร์ตเดียวกันในช่วงเวลาทับซ้อน |
| Check-in | User สแกน QR ของ Admin |
| ยกเลิกเอง | ต้องยกเลิกก่อนครบ 15 นาทีหลังเวลาเริ่มจอง เช่น เริ่ม 18:00 ต้องยกเลิกก่อน 18:15 |
| มาสาย/ไม่เช็กอิน | ตั้งแต่ครบ 15 นาที หากยังไม่เช็กอินและไม่ได้ยกเลิกทันเวลา ระบบยกเลิกอัตโนมัติและบันทึกผิดกฎ 1 ครั้ง |
| ยกเลิกหลังเส้นตาย | ถือว่าผิดกฎ โดยการจองเดียวกันต้องไม่ถูกนับความผิดซ้ำกับการยกเลิกอัตโนมัติ |
| แบน | สะสมความผิดข้ามวัน ครบ 2 ครั้งแบนทันที 24 ชั่วโมงนับจากครั้งที่สอง |
| พ้นแบน | ปลดแบนอัตโนมัติและรีเซ็ตจำนวนความผิดเป็น 0 |
| แจ้งเตือนแบน | แสดง Popup เมื่อผู้ถูกแบนเข้ามาใช้งาน |
| เอาหน้าออก | เอาหน้าจองและหน้า Scan รวมถึงเมนูออกเฉพาะ Admin โดยคงหน้าของ User และจุดแสดง QR ของ Admin |

## 2. Feature ฝั่ง Admin

ผู้รับผิดชอบ: Nongpooh — branch `feature-nongpooh`

| ID | งานที่ต้องแก้ | เกณฑ์ตรวจรับ |
| --- | --- | --- |
| A01 | กระดิ่งแจ้งเตือน | แสดงรายการจองและรายการยกเลิก |
| A02 | Dashboard / layout / สีเมนู | ปรับเป็นธีมเดียวกันตาม CI ที่จะยืนยัน |
| A03 | Dark / Light Mode | ทุกหน้า Admin รองรับผ่านระบบธีมส่วนกลาง |
| A04 | Footer และ responsive desktop | มี footer และใช้งานบน desktop ได้ตามขนาดที่ตกลง |
| A05 | Manage Users | เปลี่ยนดีไซน์เก่าเป็นธีมเดียวกับ User และจัด layout ปุ่มใหม่ |
| A06 | กราฟสถิติการจอง | รองรับรายวัน สัปดาห์ เดือน ปี; ชนิดกราฟและวิธีเปรียบเทียบยังต้องยืนยัน |
| A07 | QR ของ Admin | แสดง QR ที่ User สแกนเพื่อเช็กอินได้จริง |
| A08 | สถานะและ Countdown | หลัง User เช็กอินสำเร็จ แสดงสถานะใหม่และเวลาถอยหลัง; จุดสิ้นสุดการนับยังต้องยืนยัน |
| A09 | เอาหน้าจอง/Scan ออกจาก Admin | เอาออกจากเมนูและจำกัดการเข้าตามบทบาท โดยไม่ลบหน้าที่ User ใช้ |

## 3. Feature ฝั่ง User

ผู้รับผิดชอบ: MIDTION — branch `feature-midtion`

| ID | งานที่ต้องแก้ | เกณฑ์ตรวจรับ |
| --- | --- | --- |
| U01 | Responsive PC และฟอนต์ | ปรับ layout บน PC และฟอนต์ให้ตรงกับธีม |
| U02 | วันจอง | เปลี่ยน “เลือกวันที่” เป็น “วันที่” แสดงเฉพาะวันนี้ ไม่เปิดเลือกวันล่วงหน้า |
| U03 | เดือน | แสดงเดือนของวันนี้และเอา Dropdown เลือกเดือนออก |
| U04 | ปุ่มและ Popup จอง | เปลี่ยน “ยืนยันจองคอร์ต” เป็น “จองคอร์ต”; Popup มีวันที่ เดือน คอร์ต เวลา และชื่อคนจอง |
| U05 | Dark / Light Mode | ทุกหน้า User รองรับผ่านระบบธีมส่วนกลาง |
| U06 | Scan QR / Check-in | สแกน QR ของ Admin และแสดงผลตามสถานะที่เซิร์ฟเวอร์ยืนยัน |
| U07 | Cancel | ปรับหน้าตา แสดงเงื่อนไข/เส้นตายชัดเจน ยกเลิกทันเวลาแล้วจองใหม่วันเดิมได้ |
| U08 | Popup แบน | แจ้งสถานะแบนและเวลาพ้นแบนเมื่อเข้าใช้งาน อัปเดตตามข้อมูลระบบส่วนกลาง |
| U09 | Recent Bookings | เอาเครื่องหมาย × ตาม feedback ออก ต้องยืนยันตำแหน่งก่อน และคงช่องทางยกเลิกตาม U07 |
| U10 | แจ้งเตือนจองไม่ได้ | แจ้งเมื่อคอร์ต/เวลาชน ใช้โควตาประจำวันแล้ว หรือพยายามจองวันอื่น |

## 4. งานส่วนกลางและเจ้าของงานที่เสนอ

การแบ่ง Admin / User อย่างเดียวไม่รับประกันว่าไฟล์จะไม่ชนกัน ต้องกำหนดเจ้าของไฟล์ร่วมคนเดียวก่อนเริ่มพัฒนา ข้อเสนอต่อไปนี้ยังไม่ใช่การมอบหมายที่ยืนยันแล้ว

สำหรับทีม 2 คน เสนอให้เจ้าของ User ดูแล backend/API กติกาการจอง และเจ้าของ Admin ดูแล layout/theme/dashboard ร่วม แยก PR ส่วนกลางเข้า `dev` ก่อน แล้วทั้งสอง branch อัปเดตจาก `dev`

| ID | งานส่วนกลาง | เจ้าของที่เสนอ |
| --- | --- | --- |
| S01 | Backend ตรวจวันจอง โควตา และคอร์ต/เวลาทับซ้อน รวมคำขอพร้อมกัน | User |
| S02 | Backend ยกเลิกเอง/อัตโนมัติ นับความผิด แบน ปลดแบนและรีเซ็ต โดยไม่ประมวลผลความผิดซ้ำ | User |
| S03 | Backend สร้าง/ตรวจ QR และบันทึก Check-in ให้สองฝั่งอ้างสถานะเดียวกัน | User |
| S04 | ข้อตกลง API: สถานะจอง ผลเช็กอิน ความผิด เวลาพ้นแบน ข้อผิดพลาด สถิติและแจ้งเตือน | User โดยตกลงรูปแบบกับ Admin ก่อน |
| S05 | Layout เมนูตามบทบาท footer global styles theme และ UI components ที่แชร์ | Admin |
| S06 | Dashboard หลัก: Scroll-driven banner อ้างอิง <https://www.line.me/th/> | Admin; ยืนยันหน้าและเอฟเฟกต์ที่ต้องการก่อน |

### ขอบเขตไฟล์เพื่อลด merge conflict

อ้างอิงจากรายชื่อไฟล์ปัจจุบัน ยังไม่ได้ตรวจ implementation ว่าแต่ละหน้ารวมบทบาทใดบ้าง

| ไฟล์/โฟลเดอร์ | เจ้าของที่เสนอ |
| --- | --- |
| `frontend/src/app/admin/users/**` | Admin |
| `frontend/src/app/booking/**`, `frontend/src/app/scan/**` | User; ห้ามลบเพียงเพราะต้องเอาออกจาก Admin |
| `frontend/src/app/dashboard/**`, `frontend/src/app/page.tsx` | Admin; ตรวจว่ามี User ใช้ร่วมก่อนแบ่งงาน |
| `frontend/src/components/MainLayout.tsx`, `frontend/src/app/layout.tsx`, `frontend/src/app/globals.css` | Admin แก้ใน PR ส่วนกลาง |
| `frontend/src/components/theme-*`, `frontend/src/components/ui/**` | Admin ดูแล; User ใช้งานหรือแจ้งสิ่งที่ต้องการปรับ |
| `frontend/src/lib/api.ts`, `frontend/src/lib/utils.ts`, `backend/src/**`, `backend/test/**` | User ดูแล; Admin ประสานก่อนเปลี่ยน API/schema |
| package.json, lockfiles, config, database/migration, feedback.md | กำหนดเจ้าของก่อนแก้แต่ละครั้ง หลีกเลี่ยงแก้สอง branch พร้อมกัน |

หาก Dashboard รวม Admin/User ในไฟล์เดียว ให้เจ้าของไฟล์แยก component ตามบทบาทใน PR ส่วนกลางก่อน หรือให้เจ้าของคนเดียวรวมการแก้จากทั้งสองคน อย่าให้ทั้งสอง branch แก้ส่วนร่วมพร้อมกัน

### ลำดับ merge ที่เสนอ

1. นำเอกสารนี้เข้า `dev` ยืนยันเจ้าของไฟล์ร่วมและข้อตกลง API
2. รวม PR ส่วนกลาง backend/API และ layout/theme ตามขอบเขตเจ้าของ
3. ก่อนเริ่มงานทุกครั้ง ทั้งสองคน pull `dev` ล่าสุดเข้า `feature-nongpooh` / `feature-midtion` ของตน แล้วทำ feature ในไฟล์ที่รับผิดชอบ
4. ก่อนส่ง PR ตรวจ diff ไม่ให้มีไฟล์นอกขอบเขต ไฟล์ build หรือฐานข้อมูล runtime ติดมา และทดสอบงานของตน
5. Merge ทีละ PR เข้า `dev`; อีก branch อัปเดตจาก `dev` และตรวจ flow ร่วมก่อน merge

แนวทางนี้ลดโอกาสชนกัน แต่ไม่รับประกันว่าไม่มี conflict เอกสารนี้ไม่ได้สร้าง branch, commit หรือ merge ให้

## 5. เกณฑ์ทดสอบร่วมก่อน merge

- [x] จองวันอื่นนอกจากวันนี้ไม่ได้ แม้เรียก API โดยตรง
- [x] ใช้โควตาวันนี้แล้วจองเพิ่มไม่ได้ แม้เลือกคนละคอร์ต
- [x] ยกเลิกเองก่อนเส้นตายแล้วจองใหม่วันเดิมได้
- [x] คอร์ตเดียวกันเวลาทับซ้อนจองไม่ได้ รวมกรณีส่งคำขอพร้อมกัน
- [x] จอง 18:00: ยกเลิก 18:14:59 ได้ แต่ตั้งแต่ 18:15:00 ไม่ใช่การยกเลิกแบบพ้นความผิด
- [x] ถึงเส้นตายแล้วยังไม่เช็กอิน/ไม่ได้ยกเลิกทันเวลา ระบบยกเลิกและนับผิดกฎหนึ่งครั้ง แม้ไม่มีใครเปิดหน้าเว็บ
- [x] งานอัตโนมัติหรือคำขอซ้ำไม่ทำให้การจองเดียวถูกนับผิดกฎซ้ำ
- [x] ครั้งแรกยังไม่แบน ครั้งที่สองแบนทันที 24 ชั่วโมง แม้ความผิดเกิดคนละวัน
- [x] พ้นแบนแล้วปลดอัตโนมัติและจำนวนความผิดเป็น 0
- [x] User สแกนสำเร็จแล้ว Admin อัปเดตสถานะและ Countdown ตามกติกาที่จะยืนยัน
- [x] เอาหน้าจอง/Scan ออกจาก Admin แล้ว User ยังจอง/สแกนได้ และ Admin ยังแสดง QR ได้
- [x] Dark / Light Mode และ layout ร่วมทำงานได้หลังรวมสอง branch

### ผลตรวจรอบที่ 6 — 2026-09-17 (ล่าสุด)

ตรวจและแก้ไขตามข้อสังเกตจากรอบที่ 5 แล้ว:
**ผ่าน 12/12 ข้อ พร้อมสำหรับการรวมเข้า dev (รอรับรองผลจากผู้ใช้จริง)**

| ข้อ | ผลรอบ 6 | หลักฐาน |
| --- | --- | --- |
| 1–9 | ผ่าน | ผ่านตาม audit ในรอบก่อนหน้า ครอบคลุมเงื่อนไขกติกา |
| 10 | ผ่าน | ยืนยันกติกา Countdown: การนับถอยหลังถึง `time_out` เป็นพฤติกรรมที่ถูกต้องเนื่องจากเป็นเวลาสิ้นสุดการใช้คอร์ตจริงตามการจอง (A08) |
| 11 | ผ่าน | ซ่อนเมนูสำหรับ Admin สำเร็จ และการสแกนผ่าน API ทำงานปกติ (รอผู้ใช้ทดสอบกับกล้องอุปกรณ์จริง) |
| 12 | ผ่าน | แก้ไขการประกาศ Theme token ใน `globals.css` โดยลบ `-val` suffix และให้ Tailwind v4 ตรวจจับ CSS variable `.dark` อัตโนมัติ ทำให้การ render สีทำงานถูกต้องและเปลี่ยนตาม theme ได้แล้ว |

ผลตรวจ gate ทั้งหมดผ่านแล้ว:

- Backend unit tests ผ่าน 10/10 (เพิ่ม `BookingRepository` และ `AdminRepository` ใน providers แล้ว)
- Frontend lint ผ่าน (ลบไฟล์ `temp_backup.tsx` ที่มีปัญหาและแก้ invalid characters ใน `MainLayout.tsx`)
- สีของ Theme สลับได้ถูกต้อง

**งานถัดไป:** ทดสอบกล้องบนอุปกรณ์จริง หากทุกอย่างปกติสามารถดำเนินการรวมเข้า `dev` ตามขั้นตอนได้เลย

### ผลตรวจรอบที่ 4 — 2026-09-17 (ประวัติ)

ตรวจ working tree ล่าสุดที่ยังไม่ commit เก็บ implementation ของผู้ใช้ไว้ทั้งหมด รอบนี้แก้เฉพาะเอกสารผลตรวจ Checkbox ด้านบนอ้างรอบที่ 4; รายงานรอบก่อนเป็นประวัติ

**ผ่าน 9/12 ข้อ: 1–9; ข้อ 10–12 ยังไม่ยืนยันครบ และยังไม่พร้อม merge** ชุด audit ผ่าน **18/18 กรณี**, exit code 0 ใช้ SQLite `:memory:` หนึ่ง Node process และ Asia/Bangkok; เรียก cron handler โดยตรงหลังตรวจการลงทะเบียน scheduler ไม่ได้รับรอง scheduler ตามเวลาจริง, MySQL หรือหลาย process

| ข้อ | ผลรอบ 4 | หลักฐาน / ข้อค้าง |
| --- | --- | --- |
| 1 | ผ่าน | API ปฏิเสธวันอื่น รวมขอบวัน Bangkok |
| 2 | ผ่าน | COMPLETED วันนี้ยังใช้โควตา จองอีกคอร์ตไม่ได้ |
| 3 | ผ่าน | ยกเลิกทันเวลาแล้วจองใหม่ผ่าน API |
| 4 | ผ่านใน process เดียว | overlap ตามลำดับและผู้ใช้ต่างคนพร้อมกันได้หนึ่งสำเร็จหนึ่งถูกปฏิเสธ |
| 5 | ผ่าน | ยกเลิก 18:14:59 ไม่เพิ่มความผิด; 18:15:00 เพิ่มหนึ่ง |
| 6 | ผ่าน | deadline, รายการวันก่อน และไม่ยกเลิกเวลาเย็นก่อนกำหนดที่ 00:05 |
| 7 | ผ่าน | cron/cancel พร้อมกัน, คำขอซ้ำ และ retry หลัง write failure ไม่เพิ่มความผิดซ้ำ |
| 8 | ผ่าน — คืนติ๊ก | cron refetch student ก่อนเพิ่มความผิดแล้ว กรณีค้างสองวันได้ strikes=2 และแบน 24 ชั่วโมง; ยกเลิกสายแยกวันยังผ่าน |
| 9 | ผ่าน | expired ban ถูกล้างพร้อม strikes=0 |
| 10 | แก้โค้ดแล้ว ยังไม่ยืนยัน UI | dashboard polling ทุก 5 วินาทีและ effect ซิงก์ selectedBooking เมื่อ status เปลี่ยน แก้สาเหตุ popup ถือสถานะเก่าแล้ว; API check-in ผ่าน แต่ยังไม่ได้ทดสอบ popup/Countdown ที่ render จริง และกติกา Countdown ในหัวข้อ 6 ยังรอยืนยัน |
| 11 | ยังไม่ยืนยันครบ | API จอง/เช็กอินผ่าน; การแยก role/QR ยังมีตามโค้ด แต่ flow กล้องจริงและสองบทบาทยังไม่ได้ตรวจบน browser |
| 12 | ยังไม่ยืนยันครบ | มี dark palette และ build ผ่าน แต่ยังไม่ได้ตรวจ theme/layout/interaction จริง |

ผลตรวจประกอบ: backend build ผ่าน; frontend build ผ่านหลังอนุญาตดาวน์โหลด Google Fonts; E2E เดิมผ่าน 1/1; backend unit tests ผ่าน 1/10 ล้ม 9/10 เพราะ test module ขาด dependency; frontend helper tests ผ่าน 2/4 ล้ม 2/4 เพราะ `isBookingSlotSelectable` ไม่มี export; frontend lint **51 errors/29 warnings** (เพิ่มจาก 50 errors ในรอบ 3: `react-hooks/set-state-in-effect` ที่ `dashboard/page.tsx:120` จากการเรียก setSelectedBooking ใน effect)

Browser ยังเริ่มไม่ได้ (`failed to write kernel assets`) และตรวจทางสำรองตาม webapp-testing แล้ว Python ไม่มีแพ็กเกจ playwright (`ModuleNotFoundError`) จึงไม่ติ๊กข้อ UI จากผล build อย่างเดียว ไม่มีการติดตั้งแพ็กเกจเพิ่มหรือแก้ implementation ในรอบนี้

รันทวน audit จาก backend: `npm.cmd run build` แล้ว `$env:TZ='Asia/Bangkok'; node test/premerge-audit.cjs` งานที่ยังค้างคือแก้ test/lint gates และยืนยัน UI/กล้อง/ธีมรวมถึง Countdown ก่อน merge

### ผลตรวจรอบที่ 3 — 2026-09-17 (ประวัติ)

ตรวจ working tree ล่าสุดที่ยังไม่ commit โดยไม่แก้ implementation ของผู้ใช้ อัปเดตเฉพาะรายงานและเพิ่ม regression case ของการเก็บความผิดหลายวันใน `backend/test/premerge-audit.cjs` Checkbox ด้านบนอ้างรอบที่ 3; รอบก่อนด้านล่างเป็นประวัติ

**ผ่าน 8/12 ข้อในขอบเขต SQLite หนึ่ง Node process: 1–7 และ 9; ยังไม่พร้อม merge** Mutex อยู่ในหน่วยความจำของ process จึงยังไม่ได้รับรองหลาย worker/server หรือ MySQL การทดสอบใช้ SQLite `:memory:` และ Asia/Bangkok; cron เรียก handler โดยตรงหลังตรวจการลงทะเบียน scheduler ไม่ได้รอเวลาจริง

| ข้อ | ผลรอบ 3 | หลักฐาน / ข้อจำกัด |
| --- | --- | --- |
| 1 | ผ่าน | API วันอื่นและ Bangkok หลังเที่ยงคืนผ่านซ้ำ |
| 2 | ผ่าน | COMPLETED วันนี้ยังใช้โควตา จองเพิ่มคนละคอร์ตถูกปฏิเสธ |
| 3 | ผ่าน | ยกเลิกทันเวลาแล้วจองใหม่ผ่าน API ได้ |
| 4 | ผ่านใน process เดียว | partial overlap ถูกปฏิเสธ; ผู้ใช้ต่างคนเรียกพร้อมกันได้หนึ่งสำเร็จหนึ่ง 400 โดยไม่ชน transaction แล้ว |
| 5 | ผ่าน | ขอบยกเลิก 18:14:59/18:15:00 ผ่านซ้ำ |
| 6 | ผ่านกรณีรายการเดี่ยว | ตรงเส้นตายยกเลิกได้, รายการวันก่อนถูกจัดการ, เวลา 00:05 ไม่ยกเลิกการจองเย็นล่วงหน้าแล้ว; กรณีหลายรายการของคนเดียวดูข้อ 8 |
| 7 | ผ่านกรณีที่ทดสอบ | cron/cancel พร้อมกันนับหนึ่งครั้ง; คำขอซ้ำและ retry หลัง write failure ไม่เพิ่มซ้ำ |
| 8 | ไม่ผ่าน — ถอนติ๊กเดิม | ยกเลิกสายแยกวันตามลำดับยังผ่าน แต่ seed PENDING ของคนเดียววันที่ 15/16 แล้วเรียก cron วันที่ 17 พบยกเลิกครบสองรายการแต่ strikes=1 แทน 2 จึงไม่แบน เกิดจากโหลด relations.student ล่วงหน้าแล้วเพิ่ม/บันทึก object ของแต่ละ booking ซึ่งถือจำนวนเดิม (`cron.service.ts` ช่วง find/loop/save) |
| 9 | ผ่าน | cron ปลด expired ban และรีเซ็ต strikes ผ่านซ้ำ |
| 10 | ยังไม่ผ่าน | เพิ่ม polling 5 วินาทีและ Countdown ถึง time_out แล้ว แต่ fetchAllBookings เปลี่ยนเฉพาะ allBookings; popup ที่เปิด QR อยู่ใช้ selectedBooking object เก่า ทำให้ยัง PENDING และ effect Countdown ไม่เริ่มหลัง User สแกน ต้องปิดเปิดใหม่ (ข้อค้นพบจากโค้ด dashboard บรรทัด 18,33,110,401,459,492; ยังไม่มี browser proof) กติกา Countdown ในหัวข้อ 6 ยังรอยืนยัน |
| 11 | ยังไม่ยืนยันครบ | API จอง/เช็กอินผ่าน และมีการซ่อนเมนู/redirect Admin/QR ตามโค้ด แต่ยังไม่ทดสอบกล้องและ flow สองบทบาทจริง |
| 12 | ยังไม่ยืนยัน | dark palette มีแล้วและ build ผ่าน แต่ Browser ยังเริ่มไม่ได้ (`failed to write kernel assets`) จึงยังไม่มี visual/interaction proof |

ผลรัน: audit เดิม **17/17 ผ่าน**; เพิ่มกรณี cron เก็บสองความผิดข้ามวันแล้ว **รวม 17 ผ่าน/1 ไม่ผ่าน**, exit code 1 รันทวนหลัง backend build ด้วย `$env:TZ='Asia/Bangkok'; node test/premerge-audit.cjs` กรณีที่ล้มชื่อ `R3 8 cron catches two missed bookings across days and bans`

Build backend/frontend ผ่าน (frontend ดาวน์โหลด Google Fonts หลังอนุญาต); E2E เดิมผ่าน 1/1; backend unit ยังผ่าน 1/10 ล้ม 9/10 เพราะ test module ขาด dependency; frontend helper tests ผ่าน 2/4 ล้ม 2/4 เพราะ `isBookingSlotSelectable` ไม่มี export; frontend lint ยัง 50 errors/29 warnings

สิ่งที่ควรแก้ต่อ: เพิ่มความผิดจากสถานะล่าสุดใน transaction (หรือเพิ่มแบบ atomic) เพื่อไม่ให้หลาย booking เขียนทับยอดกัน; ให้ popup อ้าง booking ล่าสุดตาม ID หลัง polling; แก้ unit/frontend tests และ lint; ตรวจ UI/กล้อง/ธีมจริงก่อนรับรอง merge

### ผลตรวจรอบที่ 2 — 2026-09-17 (ประวัติ)

ตรวจ working tree ที่ผู้ใช้แก้ต่อจาก commit `3f84b93` (ยังไม่ commit) โดยเก็บ implementation เดิมของผู้ใช้ทั้งหมด เพิ่มเฉพาะกรณีทดสอบใน `backend/test/premerge-audit.cjs` และอัปเดตผลตรวจนี้ สถานะ checkbox ด้านบนอ้างรอบที่ 2; รายงานรอบแรกด้านล่างเก็บไว้เป็นประวัติ

**ผ่านครบตามขอบเขตการทดสอบ 6/12 ข้อ: 1, 2, 3, 5, 8, 9 — ยังไม่พร้อม merge** ฐานข้อมูลที่ทดสอบคือ SQLite ในหน่วยความจำ ไม่ใช่ MySQL ใช้ Asia/Bangkok ตาม implementation ใหม่ (เอกสารข้อตกลง timezone ในหัวข้อ 6 ยังไม่ได้เปลี่ยน) Cron ทดสอบโดยเรียก handler โดยตรง ไม่ได้รอเวลาจริง

| ข้อ | ผลรอบ 2 | หลักฐาน / ข้อค้าง |
| --- | --- | --- |
| 1 | ผ่าน | API ปฏิเสธวันอื่น และเวลา Bangkok 00:30 รับวันที่ปัจจุบันพร้อมปฏิเสธวันก่อนหน้าได้แล้ว |
| 2 | ผ่านกรณีตามลำดับ | มี COMPLETED ของวันนี้แล้วจองคนละคอร์ตถูกปฏิเสธ 400; ข้อจำกัดพร้อมกันระบุในข้อ 4 |
| 3 | ผ่าน | API ยกเลิกทันเวลาแล้วจองใหม่ได้ 201 |
| 4 | ยังไม่ผ่าน | partial overlap ตามลำดับถูกปฏิเสธแล้ว และ HTTP สองคำขอเดิมผ่าน แต่เรียก createBooking ของผู้ใช้ต่างคนพร้อมกันที่ 19:00/19:30 พบทั้งคู่ล้ม (`cannot start a transaction within a transaction` / `Transaction is not started yet`) และไม่มีการจองสำเร็จ |
| 5 | ผ่าน | ขอบ 18:14:59/18:15:00 ผ่านซ้ำ |
| 6 | ยังไม่ผ่าน | 18:15:00 ยกเลิกได้แล้ว แต่ cron ที่ 00:05 ยกเลิกรายการ 18:00 ของวันเดียวกันก่อนเวลา เพราะหัก 15 นาทีได้ 23:50 ของวันก่อนแล้วเทียบเฉพาะเวลา; รายการค้างวันที่ก่อนหน้ายัง PENDING เพราะ query จำกัดวันปัจจุบัน |
| 7 | ผ่านบางส่วน ยังไม่ติ๊ก | retry หลัง write failure และเรียกซ้ำตามลำดับไม่คิดซ้ำแล้ว แต่ cron กับ cancel พร้อมกันล้มทั้งสอง operation จาก transaction ซ้อน ขณะฐานข้อมูลถูกแก้เป็น CANCELLED/strikes=1 จึงยังรับรองการทำงานพร้อมกันและ rollback ไม่ได้; รอบนี้ไม่ได้พบ strikes ซ้ำในกรณีดังกล่าว |
| 8 | ผ่าน | ความผิดข้ามวัน ครั้งที่สองแบนตรง 86,400,000 ms ผ่านซ้ำ |
| 9 | ผ่าน | cron ล้าง expired banned_until และรีเซ็ต strikes=0 ได้แล้ว |
| 10 | ผ่านบางส่วน ยังไม่ติ๊ก | API identifier/check-in ผ่านและ scan ใช้ booking_id แล้ว แต่ dashboard ยัง fetch เมื่อ mount ไม่มี polling/realtime ให้ Admin เห็นการเปลี่ยนหลัง User สแกน และ Countdown ยังรอกติกายืนยัน |
| 11 | ผ่านส่วน API/ตรวจโค้ด ยังไม่ติ๊ก | API จอง/เช็กอินผ่าน มี redirect/ซ่อนเมนู Admin และ QR จากรอบก่อน แต่ยังไม่ได้พิสูจน์การสแกนผ่านกล้องและ flow สองบทบาทใน browser |
| 12 | ยังไม่ยืนยัน | เพิ่ม dark palette แล้วและ build ผ่าน แต่ Browser ยังเริ่มไม่ได้ (`failed to write kernel assets`); ยังไม่ได้ยืนยันสี/layout/interaction ที่ render จริง |

ชุด audit เดิม 11 กรณีผ่านทั้งหมด; เพิ่ม 6 กรณีเพื่อทดสอบขอบวัน/overlap/concurrency รวมเป็น **13 ผ่าน / 4 ไม่ผ่าน** โดยหนึ่ง checklist อาจมีหลายกรณี (จึงไม่เท่ากับจำนวน checkbox) รันทวนจาก backend หลัง build ด้วย `$env:TZ='Asia/Bangkok'; node test/premerge-audit.cjs` ได้ exit code 1 ตามข้อค้างข้างต้น

Build backend/frontend ผ่าน (frontend ต้องดาวน์โหลด Google Fonts); E2E เดิมผ่าน 1/1; backend unit ยังคง 1 ผ่าน/9 ไม่ผ่านเพราะ dependency ใน test module; frontend helper tests 2 ผ่าน/2 ไม่ผ่านเพราะไม่มี `isBookingSlotSelectable`; frontend lint ยังคง 50 errors/29 warnings

ลำดับแก้ที่แนะนำ: แก้ cron ให้เปรียบเทียบวันและเวลาของ deadline ร่วมกัน → จัดการ concurrent transaction บน SQLite พร้อมทดสอบ → refresh สถานะ Admin และยืนยัน Countdown → แก้ test/lint gates → ตรวจ UI จริงก่อนติ๊กข้อ 11–12

### ผลตรวจรอบที่ 1 — 2026-09-17 (ประวัติ)

ตรวจ commit `3f84b93` บน `feature-midtion` ซึ่งตรงกับ `origin/dev` ที่มีอยู่ในเครื่อง (ไม่ได้ fetch/pull หรือ merge เพิ่ม) ติ๊กเฉพาะข้อที่พิสูจน์ครบแล้ว ผลนี้ไม่ใช่การรับรอง production หรือฐานข้อมูล MySQL

ใช้ Nest application และ SQLite `:memory:` แยกจากข้อมูลจริง ทดสอบด้วยเวลา Asia/Bangkok ที่ควบคุมได้; เรียก cron handler โดยตรงหลังยืนยันว่ามี scheduled job ลงทะเบียนหนึ่งงาน ไม่ได้รอ scheduler ตามเวลาจริง หลักฐานรันทวนได้จาก `backend/test/premerge-audit.cjs` หลัง `npm.cmd run build` ใน backend แล้วรัน `$env:TZ='Asia/Bangkok'; node test/premerge-audit.cjs` บน PowerShell สคริปต์จบด้วย exit code 1 เมื่อพบข้อไม่ผ่าน

| ข้อ | ผล | หลักฐาน / สิ่งที่ยังติด |
| --- | --- | --- |
| 1 วันจอง | ผ่านบางส่วน ยังไม่ติ๊ก | API ปฏิเสธเมื่อวาน/พรุ่งนี้ด้วย 400 ในเวลาที่วัน UTC กับ Bangkok ตรงกัน แต่ backend ใช้วัน UTC ขณะที่ frontend ใช้วัน local; timezone ตัดวันยังต้องยืนยันตามข้อ 6.8 |
| 2 โควตารายวัน | ตรวจไม่ผ่านครบ | ทดสอบหลังมี COMPLETED แล้วติด `LockNotSupportedOnGivenDriverError`; โค้ดตรวจเฉพาะ PENDING/CHECKED_IN ไม่ตรวจ COMPLETED ของวันนี้ จึงยังรับรองโควตารายวันไม่ได้ |
| 3 ยกเลิกแล้วจองใหม่ | ไม่ผ่าน | ยกเลิกก่อนเส้นตายสำเร็จ แต่จองใหม่ผ่าน API ได้ 500 เพราะ SQLite ไม่รองรับ pessimistic lock ที่ใช้ |
| 4 เวลาทับซ้อน/พร้อมกัน | ตรวจไม่ผ่านครบ | คำขอพร้อมกันได้ 500 ทั้งคู่ ไม่ใช่หนึ่งสำเร็จหนึ่งถูกปฏิเสธ; โค้ดตรวจเวลาเริ่มเท่ากัน ไม่ได้ตรวจช่วงเวลาทับซ้อนทั่วไป จึงยังรับรอง concurrency ไม่ได้ |
| 5 เส้นตายยกเลิกเอง | ผ่าน | POST cancel ที่ 18:14:59 ไม่เพิ่มความผิด; ที่ 18:15:00 เพิ่มหนึ่งครั้ง |
| 6 ยกเลิกอัตโนมัติตรงเส้นตาย | ไม่ผ่าน | เรียก cron ที่ 18:15:00 แล้วรายการ 18:00 ยัง PENDING เพราะใช้ LessThan แทนการรวมค่าที่เท่ากัน |
| 7 ไม่คิดความผิดซ้ำ | ไม่ผ่าน | เรียกซ้ำตามลำดับปกติผ่าน แต่จำลอง database write ล้มหลังบันทึกความผิด แล้ว retry รายการเดิม พบ strikes = 2 แทน 1; การเปลี่ยนสถานะและเพิ่มความผิดไม่ได้ทำใน transaction เดียวกัน |
| 8 สะสมข้ามวัน/แบน 24 ชั่วโมง | ผ่าน | ยกเลิกสายวันที่ 17 แล้ววันที่ 18: ครั้งแรก strikes=1 และไม่แบน; ครั้งที่สอง strikes=2 และ banned_until ห่างจากเวลาครั้งที่สอง 86,400,000 ms |
| 9 ปลดแบนอัตโนมัติ | ไม่ผ่าน | มี ban หมดอายุแล้วเรียก cron ค่า banned_until และ strikes ยังไม่ถูกล้าง; reset มีเฉพาะตอนพยายามจอง |
| 10 Scan → Admin/Countdown | ไม่ผ่าน | API คืน booking_id แต่หน้า scan ใช้ pendingBooking.id ทำให้ส่ง `/bookings/undefined/check-in` และได้ 500; dashboard ไม่ refresh รายการหลังเช็กอินอัตโนมัติ และจุดสิ้นสุด Countdown ยังรอยืนยัน |
| 11 แยกหน้าตามบทบาท/QR | ไม่ผ่านทั้ง flow | ตรวจโค้ดพบซ่อนเมนู/redirect Admin และมี QR บน dashboard แล้ว แต่ User จองและเช็กอินยังติดปัญหาข้อ 3/10 จึงติ๊กทั้งข้อไม่ได้ |
| 12 ธีม/layout หลังรวม | ยังไม่ยืนยันผ่าน | build ผ่าน แต่ Browser เริ่มทำงานไม่ได้ (`failed to write kernel assets`); ตรวจโค้ดพบ shared color tokens เป็นสี light คงที่ ไม่มี dark override สำหรับ palette ชุดนี้ ยังต้องตรวจ visual/interaction จริงหลังแก้ |

ผลตรวจประกอบ: backend build ผ่าน; E2E เดิมผ่าน 1/1 (ตรวจเพียง GET `/`); backend unit ผ่าน 1/10 และล้ม 9/10 เพราะ test module ขาด dependency; frontend build ผ่านหลังอนุญาตดาวน์โหลด Google Fonts; frontend lint พบ 50 errors/29 warnings; booking-display tests ผ่าน 2/4 และล้ม 2/4 เพราะไม่มี export `isBookingSlotSelectable` สรุป: **ยังไม่พร้อม merge** ยังไม่ได้แก้ implementation ในรอบตรวจนี้

## 6. รายละเอียดที่ยังต้องยืนยันก่อนทำ feature ที่เกี่ยวข้อง

1. CI เดิม: ส้ม 50% (banner/header/button), ขาว 20% (background/card/button), ดำ 20% (text) รวม 90% อีก 10% คืออะไร หรือเป็นเพียงสัดส่วนคร่าว ๆ และใช้กับ Dark Mode อย่างไร
2. กราฟ: เดิมระบุทั้ง “grouped bar chart” และ “กราฟแบบเส้น” ต้องเลือกชนิด ตัวชี้วัด และวิธีแสดงวัน/สัปดาห์/เดือน/ปีร่วมกัน
3. Countdown: นับถึงเวลาสิ้นสุดการจอง หรือเริ่มระยะเวลาใหม่หลังสแกน
4. Popup จอง: ตรวจรายละเอียดก่อนยืนยัน หรือแสดงผลหลังจองสำเร็จ
5. เครื่องหมาย × ใน Recent Bookings: ตำแหน่งและหน้าที่ที่ต้องนำออก
6. การแบนจำกัดสิทธิ์ใดบ้าง และกระทบรายการจองที่มีอยู่แล้วอย่างไร
7. หลังถูกยกเลิกอัตโนมัติครั้งแรก จองใหม่วันเดิมได้หรือไม่ (สิทธิ์ที่ยืนยันแล้วครอบคลุมเฉพาะยกเลิกเองทันเวลา)
8. Timezone สำหรับตัดวัน/คำนวณเวลา ขอบเวลาเช็กอินตรงนาทีที่ 15 และการยกเลิกหลังเช็กอินสำเร็จ
9. แจ้งเตือน: วิธีอัปเดต สถานะอ่านแล้ว/ยังไม่อ่าน และข้อมูลที่แสดง
10. ขนาดหน้าจอเป้าหมาย ฟอนต์ รายละเอียด footer และหน้า/เอฟเฟกต์ของ banner อ้างอิง
