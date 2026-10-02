const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const copy = require('./dashboard-action-copy.cjs');

test('early finish confirmation and success toast are localized', () => {
  assert.deepEqual(copy('en').finishConfirm, 'Are you sure you want to finish this booking early?');
  assert.deepEqual(copy('th').finishConfirm, 'คุณแน่ใจหรือไม่ว่าต้องการจบการจองนี้ก่อนเวลา?');
  assert.equal(copy('en').finishSuccess, 'Booking finished successfully');
  assert.equal(copy('th').finishSuccess, 'จบการจองสำเร็จ');
});

test('database reset warnings and toast are localized at both confirmation steps', () => {
  assert.equal(copy('en').resetWarning, 'WARNING: Are you sure you want to reset the database? This will delete ALL bookings!');
  assert.equal(copy('th').resetWarning, 'คำเตือน: คุณแน่ใจหรือไม่ว่าต้องการรีเซ็ตฐานข้อมูล? การจองทั้งหมดจะถูกลบ!');
  assert.equal(copy('en').resetConfirm, 'Are you ABSOLUTELY sure? This action cannot be undone.');
  assert.equal(copy('th').resetConfirm, 'คุณแน่ใจอย่างยิ่งหรือไม่? การดำเนินการนี้ไม่สามารถยกเลิกได้');
  assert.equal(copy('en').resetSuccess, 'Database reset successfully');
  assert.equal(copy('th').resetSuccess, 'รีเซ็ตฐานข้อมูลสำเร็จ');
});

test('dashboard uses localized action copy instead of hardcoded confirmation and toast text', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/dashboard/page.tsx'), 'utf8');
  for (const literal of ['Are you sure you want to finish this booking early?', 'WARNING: Are you sure you want to reset the database?', 'Are you ABSOLUTELY sure?', 'Booking finished successfully', 'Database reset successfully']) {
    assert.equal(page.includes(literal), false, `found unlocalized literal: ${literal}`);
  }
});

test('dashboard action copy keeps Thai and English key parity', () => {
  assert.deepEqual(Object.keys(copy('en')).sort(), Object.keys(copy('th')).sort());
  for (const key of Object.keys(copy('th'))) {
    assert.ok(copy('th')[key].trim().length > 0, `empty Thai action copy: ${key}`);
    assert.ok(copy('en')[key].trim().length > 0, `empty English action copy: ${key}`);
    assert.notEqual(copy('th')[key], copy('en')[key], `untranslated action copy: ${key}`);
  }
});
