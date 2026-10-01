// Guards the reworked ADMIN analytics: the charts must be computed from real bookings
// (no synthetic series), and the export button must download a real XLSX workbook generated
// by the backend with the same filters the table applies.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const page = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const charts = readFileSync(new URL('../src/components/AdminAnalyticsCharts.tsx', import.meta.url), 'utf8');
const analytics = readFileSync(new URL('../src/lib/dashboard-analytics.cjs', import.meta.url), 'utf8');
const adminStart = page.indexOf("if (user.role === 'ADMIN') {");
const studentStart = page.indexOf('{/* User Banner */}');
const admin = page.slice(adminStart, studentStart);

test('the trend chart is built from real bookings, not from a synthetic pattern', () => {
  assert.match(page, /aggregateBookings\(allBookings, \{ period: statPeriod, court: chartCourtFilter \}\)/);
  assert.match(admin, /points=\{analytics\.series\}/);
  assert.match(admin, /axisLabels=\{trendLabels\}/);
  assert.match(admin, /peakIndex=\{peakIndex\}/);
  // The replaced implementation multiplied a hard-coded base series per court.
  for (const marker of ['baseData', 'factor = 0.32', 'cyberAreaGradient', 'chartPoints', 'createSmoothPath']) {
    assert.ok(!admin.includes(marker), `synthetic chart leftover in the admin branch: ${marker}`);
  }
});

test('every KPI card derives its number from the analytics result', () => {
  assert.match(admin, /formatNumber\(analytics\.total\)/);
  assert.match(admin, /analytics\.utilization\.percent/);
  assert.match(admin, /analytics\.utilization\.used/);
  assert.match(admin, /formatNumber\(analytics\.cancelled\)/);
  assert.match(admin, /cancellationPercent/);
  assert.match(admin, /peakLabel/);
  assert.match(admin, /\{deltaPercent !== null && \(/);
  assert.match(page, /c\.deltaVsPrevious/);
  // Previously hard-coded placeholder figures that were presented as live telemetry.
  for (const fake of ["'+18.4%'", '1428', '84.6', "'4.2'", '+210 from last week', "'18:00 - 21:00'"]) {
    assert.ok(!page.includes(fake), `hard-coded telemetry value still present: ${fake}`);
  }
});

test('the second breakdown row renders real per-court and per-status data', () => {
  assert.match(page, /const courtRows: BreakdownRow\[\] = analytics\.courts\.map/);
  assert.match(page, /const statusRows: BreakdownRow\[\] = \(\['PENDING', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'OTHER'\] as const\)\.map/);
  assert.match(admin, /<AdminUsageBars/);
  assert.match(admin, /<AdminStatusDonut/);
  assert.match(page, /label: localizedStatus\(key, locale\)/);
});

test('the export button downloads the backend XLSX workbook with the table filters', () => {
  assert.match(page, /api\.get\('\/bookings\/export\.xlsx', \{/);
  assert.match(page, /responseType: 'blob'/);
  for (const param of ['court: courtFilter', 'status: statusFilter', 'search: searchQuery.trim()', 'lang: locale', 'from: dateFrom', 'to: dateTo']) {
    assert.ok(page.includes(param), `export request is missing the filter: ${param}`);
  }
  assert.match(page, /const filename = match\?\.\[1\] \|\| `booking-logs-/);
  assert.match(page, /link\.download = filename/);
  assert.match(page, /URL\.revokeObjectURL\(blobUrl\)/);
  assert.match(page, /toast\.error\(safeDashboardError\(err, 'export', locale\)\)/);
  // The old client-side CSV download must be gone.
  assert.ok(!page.includes('data:text/csv'), 'the CSV data-URI export is still present');
  assert.ok(!page.includes('cybercourt-telemetry'), 'the old CSV filename is still present');
});

test('the export button reports progress and cannot be double-clicked', () => {
  assert.match(admin, /disabled=\{isExporting\}/);
  assert.match(admin, /aria-busy=\{isExporting\}/);
  assert.match(admin, /\{isExporting \? c\.exporting : c\.export\}/);
  assert.match(admin, /title=\{c\.exportNote\}/);
  assert.match(page, /if \(!filteredBookings\.length\) \{\s*\n\s*toast\.error\(actions\.exportEmpty\)/);
});

test('the table applies the same filter rules the export uses', () => {
  assert.match(page, /const filteredBookings = filterBookingLogs\(allBookings, \{/);
  for (const filter of ['court: courtFilter', 'status: statusFilter', 'search: searchQuery', 'dateFrom', 'dateTo']) {
    assert.ok(page.includes(filter), `table filter is missing: ${filter}`);
  }
  assert.match(admin, /aria-label=\{c\.dateFromLabel\}/);
  assert.match(admin, /aria-label=\{c\.dateToLabel\}/);
  assert.match(admin, /role="alert" className="text-xs font-medium text-rose-600/);
  assert.match(admin, /\{c\.dateRangeInvalid\}/);
});

test('the chart component never hard-codes copy and stays responsive', () => {
  const thai = charts.split(/\r?\n/).filter((line) => !/^\s*(\/\/|\{\/\*|\*|\/\*)/.test(line) && /[\u0E00-\u0E7F]/.test(line));
  assert.deepEqual(thai, [], `hard-coded Thai copy in the chart component: ${thai.slice(0, 3).join(' | ')}`);
  const withoutIcons = charts.replace(/<span[^>]*material-symbols-outlined[^>]*>\s*[A-Za-z_]+\s*<\/span>/g, '');
  const textNodes = [...withoutIcons.matchAll(/>\s*([A-Za-z][A-Za-z\s'’.,()\-]{3,})\s*</g)].map((match) => match[1].trim());
  assert.deepEqual(textNodes, [], `hard-coded visible copy in the chart component: ${textNodes.join(' | ')}`);
  // Copy arrives through props, coordinates come from the measured width, and axes use round ticks.
  for (const prop of ['seriesNames', 'peakBadge', 'unitLabel', 'emptyText', 'ariaLabel', 'loadingText']) {
    assert.ok(charts.includes(prop), `chart component prop missing: ${prop}`);
  }
  assert.match(charts, /ResizeObserver/);
  assert.match(charts, /niceTicks\(/);
  assert.match(charts, /role="img"/);
  assert.match(charts, /aria-label=\{ariaLabel\}/);
  assert.match(charts, /onMouseMove=\{\(event\) => trackHover/);
});

test('the analytics library keeps the browser out of the Bangkok calendar math', () => {
  assert.match(analytics, /timeZone: 'Asia\/Bangkok'/);
  assert.match(analytics, /const SLOTS_PER_DAY = OPERATING_END_HOUR - OPERATING_START_HOUR;/);
  assert.match(analytics, /previousTotal/);
  assert.ok(!/Math\.random/.test(analytics), 'analytics must not invent data');
});
