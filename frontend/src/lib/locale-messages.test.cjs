const test = require('node:test');
const assert = require('node:assert/strict');
const { messages, formatLocaleDate } = require('./locale-messages.cjs');

test('Thai and English dictionaries have identical, complete UI keys', () => {
  assert.deepEqual(Object.keys(messages.th).sort(), Object.keys(messages.en).sort());
  assert.ok(Object.keys(messages.th).length >= 40);
  for (const locale of ['th', 'en']) {
    for (const [key, value] of Object.entries(messages[locale])) {
      assert.equal(typeof value, 'string', `${locale}.${key} must be a string`);
      assert.ok(value.trim(), `${locale}.${key} must not be empty`);
      assert.notEqual(value, key, `${locale}.${key} must be translated`);
    }
  }
});

test('date formatting uses Thai Buddhist-calendar locale and English Gregorian locale', () => {
  const date = new Date('2026-10-01T12:00:00.000Z');
  assert.match(formatLocaleDate(date, 'th'), /2569/);
  assert.match(formatLocaleDate(date, 'en'), /2026/);
});

test('invalid dates are handled without throwing', () => {
  assert.equal(formatLocaleDate(new Date('invalid'), 'th'), '—');
});
