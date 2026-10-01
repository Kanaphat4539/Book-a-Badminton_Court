const test = require('node:test');
const assert = require('node:assert/strict');
const { bookingMessages, bookingErrorMessage, formatBookingDate } = require('./booking-page-messages.cjs');

test('booking page dictionaries have complete matching translated keys', () => {
  assert.deepEqual(Object.keys(bookingMessages.th).sort(), Object.keys(bookingMessages.en).sort());
  for (const locale of ['th', 'en']) for (const [key, value] of Object.entries(bookingMessages[locale])) {
    assert.ok(value.trim(), `${locale}.${key}`);
    assert.notEqual(value, key);
  }
});
test('known backend errors map to friendly localized messages and unknown errors are safe', () => {
  const cases = [
    ['Day-by-day policy: You can only book courts for today.', 'todayPolicy'],
    ['You already have an active booking. Please complete or cancel it first.', 'quotaUsed'],
    ['This court is already booked at this time.', 'courtConflict'],
    ['Your account is currently banned from booking courts.', 'banned'],
    ['This booking round has already ended.', 'slotEnded'],
  ];
  for (const [message, key] of cases) for (const locale of ['th', 'en']) {
    assert.equal(bookingErrorMessage(message, locale), bookingMessages[locale][key]);
  }
  assert.equal(bookingErrorMessage('unrecognized internal details', 'en'), bookingMessages.en.bookingFailed);
});
test('booking date and time display are localized without changing machine date format', () => {
  assert.match(formatBookingDate('2026-10-01', '18:00', 'th'), /2569/);
  assert.match(formatBookingDate('2026-10-01', '18:00', 'en'), /October/);
  assert.equal(formatBookingDate('2026-10-01', '18:00', 'en', true), '2026-10-01');
});
