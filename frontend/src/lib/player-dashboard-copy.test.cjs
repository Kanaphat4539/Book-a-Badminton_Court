const test = require('node:test');
const assert = require('node:assert/strict');
const { playerDashboardCopy } = require('./player-dashboard-copy.cjs');

test('player dashboard copy has identical Thai and English key sets', () => {
  const th = Object.keys(playerDashboardCopy.th).sort();
  const en = Object.keys(playerDashboardCopy.en).sort();
  assert.deepEqual(en, th, 'Thai and English dictionaries must expose the same keys');
  assert.ok(th.length >= 45, `expected the whole player view to be covered, got ${th.length} keys`);
});

test('every player dashboard key is translated and non-empty', () => {
  for (const key of Object.keys(playerDashboardCopy.th)) {
    const thai = playerDashboardCopy.th[key];
    const english = playerDashboardCopy.en[key];
    assert.equal(typeof thai, 'string', `Thai copy missing for ${key}`);
    assert.equal(typeof english, 'string', `English copy missing for ${key}`);
    assert.ok(thai.trim().length > 0, `empty Thai copy for ${key}`);
    assert.ok(english.trim().length > 0, `empty English copy for ${key}`);
    assert.notEqual(thai, english, `untranslated player copy for ${key}`);
  }
});

test('placeholder tokens survive translation so the page can interpolate them', () => {
  for (const key of ['bannerTitle', 'courtPrefix', 'timeRemaining', 'historySubtitle']) {
    const tokens = (value) => (value.match(/\{\w+\}/g) || []).sort();
    assert.deepEqual(tokens(playerDashboardCopy.th[key]), tokens(playerDashboardCopy.en[key]), `placeholder mismatch for ${key}`);
    assert.ok(tokens(playerDashboardCopy.th[key]).length > 0, `expected a placeholder in ${key}`);
  }
});

test('player-facing wording stays in both languages', () => {
  assert.equal(playerDashboardCopy.th.upcomingTitle, 'รายการจองถัดไป');
  assert.equal(playerDashboardCopy.en.upcomingTitle, 'Upcoming Booking');
  assert.equal(playerDashboardCopy.th.bookCourtTitle, 'จองสนาม');
  assert.equal(playerDashboardCopy.en.bookCourtTitle, 'Book Court');
  assert.equal(playerDashboardCopy.th.historyEmpty, 'ไม่พบประวัติการจองในหมวดนี้');
  assert.equal(playerDashboardCopy.en.cancelDialogConfirm, 'Confirm cancel');
});
