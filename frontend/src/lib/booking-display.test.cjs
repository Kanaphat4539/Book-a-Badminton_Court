const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createBookingConfirmationDetails,
  createTodayBookingDate,
  isBookingSlotSelectable,
} = require('./booking-display.ts');

test('creates exactly one booking date for the current local day', () => {
  const now = new Date(2026, 8, 16, 23, 30);

  assert.deepEqual(createTodayBookingDate(now), {
    date: '2026-09-16',
    day: 'พุธ',
    num: '16',
    month: 'กันยายน',
  });
});

test('builds the confirmation details shown before a booking is submitted', () => {
  assert.deepEqual(
    createBookingConfirmationDetails({
      date: '2026-09-16',
      time: '18:00',
      courtName: 'Court 2',
      bookerName: 'MIDTION User',
    }),
    {
      date: '16',
      month: 'กันยายน',
      court: 'Court 2',
      time: '18:00 - 19:00 น.',
      booker: 'MIDTION User',
    },
  );
});

test('accepts only an allowed future slot on the current local day', () => {
  const beforeSlot = new Date(2026, 8, 16, 17, 59, 59);

  assert.equal(isBookingSlotSelectable('2026-09-16', '18:00', beforeSlot), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '18:30', beforeSlot), false);
  assert.equal(isBookingSlotSelectable('2026-09-16', '25:00', beforeSlot), false);
  assert.equal(isBookingSlotSelectable('2026-09-17', '18:00', beforeSlot), false);
});

test('rejects a slot as soon as its start time has arrived', () => {
  const atSlotStart = new Date(2026, 8, 16, 18, 0, 0);

  assert.equal(isBookingSlotSelectable('2026-09-16', '18:00', atSlotStart), false);
  assert.equal(isBookingSlotSelectable('2026-09-16', '19:00', atSlotStart), true);
});
