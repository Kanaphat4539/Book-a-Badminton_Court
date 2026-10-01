const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { overviewCopy } = require('./booking-overview-copy.cjs');
const page = fs.readFileSync(path.join(__dirname, '../app/booking/page.tsx'), 'utf8');

test('booking overview has matching, nonempty Thai and English copy for every UI state', () => {
  assert.deepEqual(Object.keys(overviewCopy.th).sort(), Object.keys(overviewCopy.en).sort());
  for (const locale of ['th', 'en']) for (const [key, value] of Object.entries(overviewCopy[locale])) {
    if (key !== 'timeUnit' || locale === 'th') assert.ok(value.trim(), `${locale}.${key}`);
    assert.notEqual(value, key);
  }
});

test('all booking overview display copy, including rules and conditional status states, comes from its local dictionary', () => {
  for (const key of Object.keys(overviewCopy.th)) assert.ok(page.includes(`c.${key}`), `page does not use c.${key}`);
  assert.match(page, /overviewCopy\[locale\]/);
  assert.doesNotMatch(page, /[\u0E00-\u0E7F]/, 'Thai literals must not remain in the booking page source');
});
