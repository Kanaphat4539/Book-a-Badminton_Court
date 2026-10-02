/**
 * Pure booking-analytics helpers for the ADMIN view of /dashboard.
 *
 * Everything here is derived from real booking rows returned by GET /bookings.
 * `booking_date` is the Bangkok calendar date the booking belongs to, so every
 * bucket boundary is computed in Bangkok wall-clock time, never in the browser's
 * local timezone. No synthetic or placeholder series exists in this module:
 * an empty period produces zero counts and the caller renders an empty state.
 *
 * Machine values (status codes, court numbers, date keys) stay language-neutral;
 * only display helpers (localizedStatus/format*) translate.
 */
const OPERATING_START_HOUR = 8;
const OPERATING_END_HOUR = 22;
/** One-hour slots per court per operating day (08:00-22:00). */
const SLOTS_PER_DAY = OPERATING_END_HOUR - OPERATING_START_HOUR;
const ALL_COURTS = [1, 2, 3, 4];
const DAY_MS = 86400000;
const BANGKOK_YMD = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Bangkok',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** Bangkok calendar date (YYYY-MM-DD) of an instant. */
function bangkokDate(now = new Date()) {
  return BANGKOK_YMD.format(now);
}

function dateKeyOfUtc(utcMs) {
  return new Date(utcMs).toISOString().slice(0, 10);
}

function utcMsOfDay(key) {
  const [year, month, day] = String(key).split('-').map(Number);
  return Date.UTC(year, month - 1, day);
}

function addDays(key, delta) {
  return dateKeyOfUtc(utcMsOfDay(key) + delta * DAY_MS);
}

function dayCount(startKey, endKey) {
  return Math.round((utcMsOfDay(endKey) - utcMsOfDay(startKey)) / DAY_MS) + 1;
}

/** Rejects null, wrong shapes and impossible calendar dates such as 2026-02-31. */
function isValidDayKey(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function hourOfRow(row) {
  const value = typeof row?.time_in === 'string' ? row.time_in : '';
  if (!/^\d{2}:\d{2}/.test(value)) return null;
  const hour = Number(value.slice(0, 2));
  return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null;
}

/**
 * Buckets the trend chart covers for a period, clipped at today so the chart
 * never shows fabricated future slots.
 */
function bucketKeysFor(period, todayKey) {
  const year = todayKey.slice(0, 4);
  if (period === 'Day') {
    return {
      granularity: 'hour',
      start: todayKey,
      keys: Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')),
    };
  }
  if (period === 'Week') {
    const weekdayOffset = (new Date(utcMsOfDay(todayKey)).getUTCDay() + 6) % 7; // Monday = 0
    const start = addDays(todayKey, -weekdayOffset);
    return { granularity: 'day', start, keys: Array.from({ length: weekdayOffset + 1 }, (_, i) => addDays(start, i)) };
  }
  if (period === 'Month') {
    const start = `${todayKey.slice(0, 7)}-01`;
    return { granularity: 'day', start, keys: Array.from({ length: dayCount(start, todayKey) }, (_, i) => addDays(start, i)) };
  }
  const start = `${year}-01-01`;
  const months = Number(todayKey.slice(5, 7));
  return { granularity: 'month', start, keys: Array.from({ length: months }, (_, i) => String(i + 1).padStart(2, '0')) };
}

function bucketKeyOf(row, granularity) {
  if (granularity === 'hour') {
    const hour = hourOfRow(row);
    return hour === null ? null : String(hour).padStart(2, '0');
  }
  if (granularity === 'month') return row.booking_date.slice(5, 7);
  return row.booking_date;
}

function isCountedStatus(status) {
  return status === 'PENDING' || status === 'CHECKED_IN' || status === 'CANCELLED' || status === 'COMPLETED';
}

function isCheckedInStatus(status) {
  return status === 'CHECKED_IN' || status === 'COMPLETED';
}

function inCourtScope(row, court) {
  return court === 'ALL' || String(row.court) === String(court);
}

/**
 * Aggregates real bookings into the chart series plus the KPI numbers shown above it.
 * `previousTotal` is the same-length window right before the current one, so the KPI
 * delta is a real comparison and is `null` when the previous window holds no bookings.
 */
function aggregateBookings(bookings, options = {}) {
  const period = ['Day', 'Week', 'Month', 'Year'].includes(options.period) ? options.period : 'Week';
  const court = options.court === undefined || options.court === null ? 'ALL' : String(options.court);
  const now = options.now instanceof Date ? options.now : new Date();
  const todayKey = bangkokDate(now);
  const { granularity, start, keys } = bucketKeysFor(period, todayKey);
  const source = Array.isArray(bookings) ? bookings : [];

  const counts = new Map(keys.map((key) => [key, { key, total: 0, checkins: 0, cancelled: 0 }]));
  const courtCounts = new Map(ALL_COURTS.map((number) => [number, 0]));

  const valid = [];
  for (const row of source) {
    if (!row || !isValidDayKey(row.booking_date)) continue;
    if (row.booking_date < start || row.booking_date > todayKey) continue;
    if (!inCourtScope(row, court)) continue;
    valid.push(row);
  }

  const elapsedDays = dayCount(start, todayKey);
  const previousEnd = addDays(start, -1);
  const previousStart = addDays(previousEnd, -(elapsedDays - 1));
  let previousTotal = null;
  for (const row of source) {
    if (!row || !isValidDayKey(row.booking_date)) continue;
    if (row.booking_date < previousStart || row.booking_date > previousEnd) continue;
    if (!inCourtScope(row, court)) continue;
    previousTotal = (previousTotal ?? 0) + 1;
  }

  for (const row of valid) {
    const bucket = counts.get(bucketKeyOf(row, granularity));
    if (bucket) {
      bucket.total += 1;
      if (isCheckedInStatus(row.status)) bucket.checkins += 1;
      if (row.status === 'CANCELLED') bucket.cancelled += 1;
    }
    const courtNumber = Number(row.court);
    if (courtCounts.has(courtNumber)) courtCounts.set(courtNumber, courtCounts.get(courtNumber) + 1);
  }

  const series = keys.map((key) => counts.get(key));
  const peak = series.reduce((best, point) => (point.total > (best?.total ?? 0) ? point : best), null);
  const total = valid.length;
  const cancelled = valid.filter((row) => row.status === 'CANCELLED').length;
  const bookedSlotCount = valid.filter((row) => row.status !== 'CANCELLED').length;
  const courtsInScope = court !== 'ALL' && ALL_COURTS.includes(Number(court)) ? 1 : ALL_COURTS.length;
  const offered = elapsedDays * courtsInScope * SLOTS_PER_DAY;

  return {
    period,
    granularity,
    court,
    start,
    end: todayKey,
    days: elapsedDays,
    labels: keys,
    series,
    total,
    cancelled,
    completed: valid.filter((row) => row.status === 'COMPLETED').length,
    pending: valid.filter((row) => row.status === 'PENDING').length,
    checkedIn: valid.filter((row) => row.status === 'CHECKED_IN').length,
    checkins: valid.filter((row) => isCheckedInStatus(row.status)).length,
    unknownStatus: valid.filter((row) => !isCountedStatus(row.status) && !isCheckedInStatus(row.status)).length,
    previousTotal,
    delta: previousTotal === null ? null : total - previousTotal,
    peak: total > 0 && peak ? peak : null,
    courts: ALL_COURTS.map((number) => ({ court: number, count: courtCounts.get(number) })),
    utilization: {
      used: bookedSlotCount,
      offered,
      percent: offered > 0 ? Math.min(100, Math.round((bookedSlotCount / offered) * 100)) : 0,
    },
  };
}

/** Status split whose parts always add up to the analytics total (unknown codes land in OTHER). */
function statusDistribution(analytics = {}) {
  const total = Number(analytics.total) || 0;
  const known = {
    PENDING: Number(analytics.pending) || 0,
    CHECKED_IN: Number(analytics.checkedIn) || 0,
    CANCELLED: Number(analytics.cancelled) || 0,
    COMPLETED: Number(analytics.completed) || 0,
  };
  const classified = Object.values(known).reduce((sum, count) => sum + count, 0);
  return { ...known, OTHER: Math.max(0, total - classified) };
}

/** Axis ticks that land on round numbers and never cut off the tallest bar. */
function niceTicks(maxValue, targetTicks = 4) {
  const safe = Number.isFinite(maxValue) && maxValue > 0 ? maxValue : 1;
  const rough = safe / Math.max(1, targetTicks);
  const step = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000, 5000]
    .find((candidate) => candidate >= rough) ?? Math.ceil(rough);
  const top = Math.max(step, Math.ceil(safe / step) * step);
  const ticks = [];
  for (let value = 0; value <= top + 1e-9; value += step) ticks.push(value);
  return { max: top, step, ticks };
}

/**
 * Mirrors the backend export filter (inclusive booking_date bounds, same status and
 * search rules) so the table and the exported workbook can never disagree.
 */
function filterBookingLogs(bookings, filters = {}, now = new Date()) {
  const query = typeof filters.search === 'string' ? filters.search.trim().toLocaleLowerCase() : '';
  const current = (now instanceof Date ? now : new Date()).getTime();
  return (Array.isArray(bookings) ? bookings : []).filter((row) => {
    if (filters.dateFrom && row.booking_date < filters.dateFrom) return false;
    if (filters.dateTo && row.booking_date > filters.dateTo) return false;
    if (filters.court && filters.court !== 'ALL' && String(row.court) !== String(filters.court)) return false;
    if (filters.status === 'ACTIVE' && !['PENDING', 'CHECKED_IN'].includes(row.status)) return false;
    if (filters.status === 'READY_CHECK_IN') {
      const start = new Date(`${row.booking_date}T${row.time_in || '00:00:00'}+07:00`).getTime();
      const end = new Date(`${row.booking_date}T${row.time_out || '00:00:00'}+07:00`).getTime();
      const created = row.created_at ? new Date(row.created_at).getTime() : start;
      // Same late-created grace window the backend applies before allowing a check-in.
      const deadline = Math.max(start, created) + 15 * 60 * 1000;
      if (row.status !== 'PENDING' || current < start || current > deadline || current >= end) return false;
    } else if (filters.status && filters.status !== 'ALL' && filters.status !== 'ACTIVE' && row.status !== filters.status) {
      return false;
    }
    if (query) {
      const searchable = [
        row.booking_id,
        row.court,
        row.booking_date,
        row.student?.first_name,
        row.student?.last_name,
        row.student?.username,
      ].join(' ').toLocaleLowerCase();
      if (!searchable.includes(query)) return false;
    }
    return true;
  });
}

const STATUS_COPY = {
  th: { PENDING: 'รอเช็คอิน', CHECKED_IN: 'กำลังใช้งาน', CANCELLED: 'ยกเลิกแล้ว', COMPLETED: 'เสร็จสิ้น', OTHER: 'สถานะอื่น' },
  en: { PENDING: 'Awaiting check-in', CHECKED_IN: 'In progress', CANCELLED: 'Cancelled', COMPLETED: 'Completed', OTHER: 'Other status' },
};

function localizedStatus(status, locale) {
  const table = STATUS_COPY[locale === 'th' ? 'th' : 'en'];
  return table[status] ?? table.OTHER;
}

const STATUS_COLORS = {
  PENDING: '#f59e0b',
  CHECKED_IN: '#10b981',
  CANCELLED: '#f43f5e',
  COMPLETED: '#0ea5e9',
  OTHER: '#64748b',
};

function formatDashboardDate(value, locale, options = {}) {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  // dateStyle/timeStyle cannot be combined with explicit field options.
  const defaults = options.dateStyle || options.timeStyle ? {} : { day: 'numeric', month: 'short' };
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    timeZone: 'Asia/Bangkok',
    ...defaults,
    ...options,
  }).format(date);
}

function formatDashboardDateTime(value, locale) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    timeZone: 'Asia/Bangkok',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

/** Short month name for the Year granularity axis. */
function formatDashboardMonth(value, locale) {
  const date = new Date(`${value}T00:00:00+07:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
    timeZone: 'Asia/Bangkok',
    month: 'short',
  }).format(date);
}

/** Chart axis label for a bucket key, in the selected language. */
function formatBucketLabel(key, granularity, locale, year = String(new Date().getFullYear())) {
  if (granularity === 'hour') return `${key}:00`;
  if (granularity === 'month') return formatDashboardMonth(`${year}-${key}-01`, locale);
  return formatDashboardDate(key, locale);
}

/** Errors are mapped to safe local copy so raw server messages never reach the admin UI. */
function safeDashboardError(_error, kind, locale) {
  const messages = {
    export: { th: 'ส่งออกไม่สำเร็จ กรุณาลองใหม่', en: 'Export failed. Please try again.' },
    sync: { th: 'อัปเดตข้อมูลไม่สำเร็จ กรุณาลองใหม่', en: 'Unable to refresh data. Please try again.' },
    finish: { th: 'ไม่สามารถปิดรายการจองได้ กรุณาลองใหม่', en: 'Unable to finish the booking. Please try again.' },
    cancel: { th: 'ยกเลิกการจองไม่สำเร็จ กรุณาลองใหม่', en: 'Unable to cancel the booking. Please try again.' },
    reset: { th: 'รีเซ็ตข้อมูลไม่สำเร็จ กรุณาลองใหม่', en: 'Unable to reset data. Please try again.' },
  };
  const table = messages[kind] ?? messages.sync;
  return table[locale === 'th' ? 'th' : 'en'];
}

module.exports = {
  OPERATING_START_HOUR,
  OPERATING_END_HOUR,
  SLOTS_PER_DAY,
  ALL_COURTS,
  STATUS_COLORS,
  bangkokDate,
  addDays,
  isValidDayKey,
  aggregateBookings,
  statusDistribution,
  niceTicks,
  filterBookingLogs,
  localizedStatus,
  formatDashboardDate,
  formatDashboardDateTime,
  formatDashboardMonth,
  formatBucketLabel,
  safeDashboardError,
};
