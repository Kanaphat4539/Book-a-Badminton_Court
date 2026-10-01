const assert = require('node:assert/strict');
const test = require('node:test');

const {
  createBookingConfirmationDetails,
  createTodayBookingDate,
  isBookingSlotSelectable,
} = require('./booking-display.ts');

test('creates exactly one booking date for the current Bangkok day', () => {
  const now = new Date('2026-09-16T23:30:00+07:00');

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

test('accepts only an allowed future slot on the current Bangkok day', () => {
  const beforeSlot = new Date('2026-09-16T17:59:59+07:00');

  assert.equal(isBookingSlotSelectable('2026-09-16', '18:00', beforeSlot), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '18:30', beforeSlot), false);
  assert.equal(isBookingSlotSelectable('2026-09-16', '25:00', beforeSlot), false);
  assert.equal(isBookingSlotSelectable('2026-09-17', '18:00', beforeSlot), false);
});

test('allows the remaining part of a current slot, but never an expired slot', () => {
  const atSlotStart = new Date('2026-09-16T18:00:00+07:00');

  assert.equal(isBookingSlotSelectable('2026-09-16', '18:00', atSlotStart), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '19:00', atSlotStart), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '15:00', new Date('2026-09-16T15:16:00+07:00')), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '13:00', new Date('2026-09-16T13:22:00+07:00')), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '15:00', new Date('2026-09-16T15:59:59+07:00')), true);
  assert.equal(isBookingSlotSelectable('2026-09-16', '15:00', new Date('2026-09-16T16:00:00+07:00')), false);
});

test('uses Bangkok booking times even when the device timezone is UTC', () => {
  const originalTimezone = process.env.TZ;
  process.env.TZ = 'UTC';
  try {
    assert.equal(isBookingSlotSelectable('2026-09-16', '15:00', new Date('2026-09-16T09:00:00Z')), false);
    assert.equal(createTodayBookingDate(new Date('2026-09-16T18:00:00Z')).date, '2026-09-17');
  } finally {
    if (originalTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = originalTimezone;
  }
});
