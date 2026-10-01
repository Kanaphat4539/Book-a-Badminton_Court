const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { selectCourtCopy } = require('./select-court-copy.cjs');

test('select-court page copy has complete Thai and English dictionaries', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/booking/select-court/page.tsx'), 'utf8');
  const keys = [...page.matchAll(/[\{]t[(]['\"]([A-Za-z0-9_]+)/g)].map((match) => match[1]);
  const required = [...new Set(keys)];
  assert.ok(required.length >= 20, `expected full page translation coverage, found ${required.length}`);
  for (const key of required) {
    assert.ok(['string', 'function'].includes(typeof selectCourtCopy.th[key]), `Thai missing ${key}`);
    assert.ok(['string', 'function'].includes(typeof selectCourtCopy.en[key]), `English missing ${key}`);
    assert.ok(selectCourtCopy.th[key].length > 0, `Thai empty ${key}`);
    assert.ok(selectCourtCopy.en[key].length > 0, `English empty ${key}`);
    assert.notEqual(selectCourtCopy.th[key], key);
    assert.notEqual(selectCourtCopy.en[key], key);
  }
});

test('localized court copy interpolates counts and remains locale-specific', () => {
  assert.equal(selectCourtCopy.th.availableCourts(2), '2 คอร์ทพร้อมใช้');
  assert.equal(selectCourtCopy.en.availableCourts(2), '2 courts available');
  assert.equal(selectCourtCopy.th.totalCourts(4), 'ระบบสำรองคอร์ท อาคารยิมเนเซียม 1 KMITL ทั้งหมด 4 คอร์ท สำหรับรอบที่คุณเลือก');
});
