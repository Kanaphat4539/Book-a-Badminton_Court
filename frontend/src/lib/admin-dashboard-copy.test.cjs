const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { adminDashboardCopy } = require('./admin-dashboard-copy.cjs');

test('admin dashboard copy has identical Thai and English key sets', () => {
  const th = Object.keys(adminDashboardCopy.th).sort();
  const en = Object.keys(adminDashboardCopy.en).sort();
  assert.deepEqual(en, th, 'Thai and English dictionaries must expose the same keys');
  assert.ok(th.length >= 60, `expected the full admin view to be covered, got ${th.length} keys`);
});

test('every admin dashboard key is translated, not copied across languages', () => {
  for (const key of Object.keys(adminDashboardCopy.th)) {
    const thai = adminDashboardCopy.th[key];
    const english = adminDashboardCopy.en[key];
    assert.equal(typeof thai, 'string', `Thai copy missing for ${key}`);
    assert.equal(typeof english, 'string', `English copy missing for ${key}`);
    assert.ok(thai.trim().length > 0, `empty Thai copy for ${key}`);
    assert.ok(english.trim().length > 0, `empty English copy for ${key}`);
    assert.notEqual(thai, english, `untranslated admin copy for ${key}`);
  }
});

test('status, filter, and court labels stay usable in both languages', () => {
  assert.equal(adminDashboardCopy.th.statusPending, 'รอเช็คอิน');
  assert.equal(adminDashboardCopy.en.statusPending, 'PENDING');
  assert.equal(adminDashboardCopy.th.filterCancelled, 'ยกเลิก');
  assert.equal(adminDashboardCopy.en.filterCancelled, 'CANCELLED');
  assert.equal(adminDashboardCopy.th.court, 'สนาม');
  assert.equal(adminDashboardCopy.en.court, 'Court');
  assert.equal(adminDashboardCopy.th.goScanQr, 'ไปสแกน QR');
  assert.equal(adminDashboardCopy.en.finishEarly, 'Finish Early');
});

test('admin dashboard page wires timeframe labels and card dates through localization', () => {
  const page = fs.readFileSync(path.join(__dirname, '../app/dashboard/page.tsx'), 'utf8');
  assert.ok(page.includes('{periodLabels[period]}'), 'timeframe navigation buttons must use localized period labels');
  assert.ok(page.includes('{formatDate(booking.booking_date)}'), 'admin booking card must localize booking_date');
  assert.ok(page.includes('{c.todayAt}${lastSyncTimeStr}'), 'last calculation sync time must not concatenate todayAt with full date');
});
