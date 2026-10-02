const { describe, test } = require('node:test');
const assert = require('node:assert/strict');
const {
  aggregateBookings,
  bangkokDate,
  niceTicks,
  statusDistribution,
  filterBookingLogs,
  localizedStatus,
  formatDashboardDate,
  formatDashboardDateTime,
  formatBucketLabel,
  safeDashboardError,
} = require('./dashboard-analytics.cjs');

// 2026-10-01 is a Thursday, so the ISO week starts Monday 2026-09-28.
const NOW = new Date('2026-10-01T12:00:00+07:00');
const row = (overrides) => ({
  booking_id: 1,
  court: 1,
  booking_date: '2026-10-01',
  time_in: '09:00:00',
  time_out: '10:00:00',
  status: 'PENDING',
  student: { first_name: 'Ada', last_name: 'Lovelace', username: 'ada' },
  ...overrides,
});

describe('dashboard analytics aggregation', () => {
  const rows = [
    row({ booking_id: 1, time_in: '09:30:00', status: 'PENDING', court: 1 }),
    row({ booking_id: 2, time_in: '09:00:00', status: 'CANCELLED', court: 2 }),
    row({ booking_id: 3, booking_date: '2026-09-30', time_in: '13:00:00', status: 'COMPLETED', court: 1 }),
    row({ booking_id: 4, booking_date: '2026-10-02', time_in: '10:00:00', status: 'CHECKED_IN' }),
    row({ booking_id: 5, booking_date: 'not-a-date', time_in: '11:00:00' }),
    row({ booking_id: 6, booking_date: '2026-02-31', time_in: '12:00:00' }),
  ];

  test('Day buckets every Bangkok hour and drops other days plus impossible dates', () => {
    const result = aggregateBookings(rows, { period: 'Day', now: NOW });
    assert.equal(result.granularity, 'hour');
    assert.equal(result.series.length, 24);
    assert.equal(result.total, 2);
    assert.equal(result.cancelled, 1);
    assert.deepEqual(result.series[9], { key: '09', total: 2, checkins: 0, cancelled: 1 });
    assert.equal(result.series[0].total, 0);
  });

  test('Week starts on Monday and stops at today', () => {
    const result = aggregateBookings(rows, { period: 'Week', now: NOW });
    assert.deepEqual(result.labels, ['2026-09-28', '2026-09-29', '2026-09-30', '2026-10-01']);
    assert.equal(result.total, 3);
    assert.deepEqual(result.series.map((point) => point.total), [0, 0, 1, 2]);
    assert.equal(result.series[3].checkins, 0);
    assert.equal(result.days, 4);
  });

  test('Month starts on the 1st and never shows future days', () => {
    const result = aggregateBookings(rows, { period: 'Month', now: NOW });
    assert.deepEqual(result.labels, ['2026-10-01']);
    assert.equal(result.total, 2);
    assert.equal(result.start, '2026-10-01');
    assert.equal(result.end, '2026-10-01');
  });

  test('Year buckets real months up to the current month', () => {
    const result = aggregateBookings(rows, { period: 'Year', now: NOW });
    assert.equal(result.granularity, 'month');
    assert.deepEqual(result.labels, ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10']);
    assert.equal(result.total, 3);
    assert.equal(result.series[9].total, 2);
    assert.equal(result.series[8].total, 1);
  });

  test('court filter narrows the series and the offered-slot denominator', () => {
    const all = aggregateBookings(rows, { period: 'Week', court: 'ALL', now: NOW });
    const one = aggregateBookings(rows, { period: 'Week', court: '1', now: NOW });
    assert.equal(all.total, 3);
    assert.equal(one.total, 2);
    assert.equal(all.utilization.offered, 4 * 4 * 14);
    assert.equal(one.utilization.offered, 1 * 4 * 14);
  });

  test('peak identifies the busiest bucket and stays null without data', () => {
    const result = aggregateBookings(rows, { period: 'Week', now: NOW });
    assert.deepEqual(result.peak, { key: '2026-10-01', total: 2, checkins: 0, cancelled: 1 });
    assert.equal(aggregateBookings([], { period: 'Week', now: NOW }).peak, null);
    assert.equal(aggregateBookings(null, { period: 'Week', now: NOW }).total, 0);
  });

  test('delta compares against the real previous window of the same length', () => {
    const thisWeekOnly = aggregateBookings(rows, { period: 'Week', now: NOW });
    assert.equal(thisWeekOnly.total, 3);
    assert.equal(thisWeekOnly.previousTotal, null, 'no booking inside 2026-09-24..2026-09-27');
    assert.equal(thisWeekOnly.delta, null);
    const withHistory = [...rows, row({ booking_id: 7, booking_date: '2026-09-25', status: 'COMPLETED' })];
    const result = aggregateBookings(withHistory, { period: 'Week', now: NOW });
    assert.equal(result.total, 3);
    assert.equal(result.previousTotal, 1);
    assert.equal(result.delta, 2);
    const empty = aggregateBookings([], { period: 'Week', now: NOW });
    assert.equal(empty.previousTotal, null);
    assert.equal(empty.delta, null);
  });

  test('utilization counts non-cancelled slots against elapsed capacity', () => {
    const result = aggregateBookings(rows, { period: 'Week', now: NOW });
    assert.equal(result.utilization.used, 2);
    assert.equal(result.utilization.offered, 224);
    assert.equal(result.utilization.percent, 1);
    const full = aggregateBookings([row({ status: 'COMPLETED' })], { period: 'Day', court: '1', now: NOW });
    assert.equal(full.utilization.offered, 14);
    assert.equal(full.utilization.percent, 7);
  });

  test('court distribution counts every valid row per court', () => {
    const result = aggregateBookings(rows, { period: 'Month', now: NOW });
    assert.deepEqual(result.courts, [
      { court: 1, count: 1 },
      { court: 2, count: 1 },
      { court: 3, count: 0 },
      { court: 4, count: 0 },
    ]);
  });
});

describe('dashboard analytics helpers', () => {
  test('status distribution keeps the analytics total as denominator', () => {
    assert.deepEqual(statusDistribution({ total: 10, pending: 2, checkedIn: 3, cancelled: 1, completed: 2 }), {
      PENDING: 2, CHECKED_IN: 3, CANCELLED: 1, COMPLETED: 2, OTHER: 2,
    });
    assert.deepEqual(statusDistribution(), { PENDING: 0, CHECKED_IN: 0, CANCELLED: 0, COMPLETED: 0, OTHER: 0 });
  });

  test('nice ticks always cover the data with round steps', () => {
    assert.deepEqual(niceTicks(0).ticks, [0, 1]);
    assert.deepEqual(niceTicks(3), { max: 3, step: 1, ticks: [0, 1, 2, 3] });
    assert.deepEqual(niceTicks(68), { max: 80, step: 20, ticks: [0, 20, 40, 60, 80] });
    for (const value of [1, 7, 13, 42, 99, 101, 640, 1428]) {
      const { max, ticks } = niceTicks(value);
      assert.ok(max >= value, `max ${max} must cover ${value}`);
      assert.ok(ticks.length >= 2 && ticks.length <= 7, `tick count ${ticks.length} for ${value}`);
      assert.equal(ticks[0], 0);
      assert.equal(ticks.at(-1), max);
    }
  });

  test('log filters mirror the export rules, including the late-created grace window', () => {
    const logs = [
      row({ booking_id: 1, time_in: '10:00:00', time_out: '11:00:00', created_at: '2026-10-01T02:55:00Z', status: 'PENDING' }),
      row({ booking_id: 2, time_in: '10:00:00', time_out: '11:00:00', created_at: '2026-10-01T03:05:00Z', status: 'PENDING' }),
      row({ booking_id: 3, time_in: '10:00:00', time_out: '11:00:00', created_at: null, status: 'PENDING' }),
      row({ booking_id: 4, booking_date: '2026-09-30', status: 'COMPLETED', court: 2 }),
    ];
    const ready = { court: 'ALL', status: 'READY_CHECK_IN', search: '' };
    assert.deepEqual(filterBookingLogs(logs, ready, new Date('2026-10-01T03:16:00Z')).map((r) => r.booking_id), [2]);
    assert.deepEqual(filterBookingLogs(logs, ready, new Date('2026-10-01T03:21:00Z')).map((r) => r.booking_id), []);
    const ranged = { court: '2', status: 'COMPLETED', search: 'ada', dateFrom: '2026-09-30', dateTo: '2026-09-30' };
    assert.deepEqual(filterBookingLogs(logs, ranged).map((r) => r.booking_id), [4]);
    assert.deepEqual(filterBookingLogs(logs, { court: 'ALL', status: 'ACTIVE', search: 'lovelace' }).map((r) => r.booking_id), [1, 2, 3]);
    assert.deepEqual(filterBookingLogs(logs, { court: 'ALL', status: 'ALL', search: 'court 9' }), []);
    assert.deepEqual(filterBookingLogs(null, ranged), []);
  });

  test('localizes statuses and never leaks an unknown machine code', () => {
    assert.equal(localizedStatus('PENDING', 'th'), 'รอเช็คอิน');
    assert.equal(localizedStatus('CHECKED_IN', 'en'), 'In progress');
    assert.equal(localizedStatus('BROKEN_CODE', 'en'), 'Other status');
    assert.equal(localizedStatus('BROKEN_CODE', 'th'), 'สถานะอื่น');
  });

  test('formats dates, timestamps and bucket labels per locale at Bangkok time', () => {
    assert.match(formatDashboardDate('2026-10-01', 'th', { dateStyle: 'long' }), /2569/);
    assert.match(formatDashboardDate('2026-10-01', 'en', { dateStyle: 'long' }), /2026/);
    assert.equal(formatDashboardDate('invalid', 'en'), 'invalid');
    assert.notEqual(formatDashboardDateTime('2026-10-01T00:00:00Z', 'th'), formatDashboardDateTime('2026-10-01T00:00:00Z', 'en'));
    assert.equal(formatBucketLabel('09', 'hour', 'en'), '09:00');
    assert.notEqual(formatBucketLabel('2026-10-01', 'day', 'th'), formatBucketLabel('2026-10-01', 'day', 'en'));
    assert.notEqual(formatBucketLabel('10', 'month', 'th'), formatBucketLabel('10', 'month', 'en'));
  });

  test('maps unsafe server errors to safe localized messages', () => {
    assert.equal(safeDashboardError({ message: 'SQL secret' }, 'export', 'th'), 'ส่งออกไม่สำเร็จ กรุณาลองใหม่');
    assert.equal(safeDashboardError(new Error('secret'), 'export', 'en'), 'Export failed. Please try again.');
    assert.equal(safeDashboardError(null, 'unknown-kind', 'en'), 'Unable to refresh data. Please try again.');
  });

  test('Bangkok day key ignores the browser timezone', () => {
    assert.equal(bangkokDate(new Date('2026-09-30T18:30:00Z')), '2026-10-01');
    assert.equal(bangkokDate(new Date('2026-10-01T16:59:00Z')), '2026-10-01');
  });
});
