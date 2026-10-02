// Guards the /dashboard branches: the ADMIN branch must render dev's admin UI with copy from
// the admin dictionary, and the STUDENT branch must render dev's player UI with copy from the
// player dictionary. Both branches are scanned as text, because a dictionary import can be
// present while a visible string is still hard-coded next to it.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/app/dashboard/page.tsx', import.meta.url), 'utf8');
const adminStart = source.indexOf("if (user.role === 'ADMIN') {");
// The student branch starts at its own banner comment, so the admin slice cannot bleed into it.
const studentStart = source.indexOf('{/* User Banner */}');
const admin = source.slice(adminStart, studentStart);
const student = source.slice(studentStart);

const isComment = (line) => /^\s*(\/\/|\{\/\*|\*|\/\*)/.test(line);
// Brand names are identical in both languages and are the only bare text nodes allowed.
const BRAND_TEXT_NODES = ['KMITL Badminton'];

test('the admin branch renders from the Thai/English dictionaries', () => {
  assert.ok(adminStart > 0, 'admin branch not found');
  assert.ok(studentStart > adminStart, 'student branch not found');
  assert.match(source, /import \{ useLocale \} from '@\/components\/locale-provider'/);
  assert.match(source, /import \{ adminDashboardCopy \} from '@\/lib\/admin-dashboard-copy\.cjs'/);
  assert.match(source, /const c = adminDashboardCopy\[locale\]/);
  const lookups = admin.match(/\bc\./g) ?? [];
  assert.ok(lookups.length >= 40, `expected the admin branch to render from the dictionary, found ${lookups.length} lookups`);
});

test('no hard-coded Thai text is left in the admin branch', () => {
  const offenders = admin
    .split(/\r?\n/)
    .filter((line) => !isComment(line) && /[\u0E00-\u0E7F]/.test(line));
  assert.deepEqual(offenders, [], `hard-coded Thai copy: ${offenders.slice(0, 3).join(' | ')}`);
});

test('no hard-coded visible English copy is left in the admin branch', () => {
  const phrases = [
    'Admin control center', 'Live system overview', 'Good morning, Admin.', 'Secure admin mode',
    'Timeframe Navigation', 'Manage Users', 'Court Utilization', 'Peak Congestion', 'Peak Window',
    'Live telemetry synchronized', 'Booking Telemetry', 'Too Early for Check-in', 'Cancel this Booking',
    'Finish Early', 'Live Session In Progress', 'No booking records found', 'All Bookings',
    'Reserved Slot:', 'Search user, ID or court', 'Verified Check-in Milestone', 'All Booked Slots',
    'This booking is ', 'Recorded at:', 'Records Listed', 'Booking Trends by', 'ALL COURTS',
    'Showing ', 'weekly telemetry logs',
  ];
  const offenders = phrases.filter((phrase) => admin.includes(phrase));
  assert.deepEqual(offenders, [], `hard-coded admin copy: ${offenders.join(' | ')}`);
});

test('admin actions (toasts, confirmations) are localized too', () => {
  assert.match(source, /import dashboardActionCopy from '@\/lib\/dashboard-action-copy\.cjs'/);
  assert.match(source, /const actions = dashboardActionCopy\(locale\)/);
  for (const call of ['finishSuccess', 'finishFailed', 'syncSuccess', 'syncFailed', 'exportEmpty', 'exportSuccess', 'cancelSuccess', 'cancelFailed', 'resetSuccess', 'resetFailed']) {
    assert.match(source, new RegExp('actions\\.' + call), `action copy not used: ${call}`);
  }
  assert.ok(!source.includes("toast.success('Booking finished successfully')"));
  assert.ok(!source.includes("toast.error('Failed to sync telemetry')"));
});

test('the admin QR keeps encoding a bare court number that the scan page can parse', () => {
  const scan = readFileSync(new URL('../src/app/scan/page.tsx', import.meta.url), 'utf8');
  assert.match(scan, /parseInt\(decodedText, 10\)/);
  assert.match(admin, /<QRCode[\s\S]{0,200}value=\{selectedBooking\.court\?\.toString\(\) \|\| 'court'\}/);
  assert.doesNotMatch(admin, /<QRCode[\s\S]{0,200}JSON\.stringify/);
});

test('the student branch renders from the player dictionary, not from literals', () => {
  assert.match(source, /import \{ playerDashboardCopy \} from '@\/lib\/player-dashboard-copy\.cjs'/);
  assert.match(source, /const p = playerDashboardCopy\[locale\]/);
  const lookups = student.match(/\bp\./g) ?? [];
  assert.ok(lookups.length >= 40, `expected the student branch to render from the dictionary, found ${lookups.length} lookups`);
  const thai = student.split(/\r?\n/).filter((line) => !isComment(line) && /[\u0E00-\u0E7F]/.test(line));
  assert.deepEqual(thai, [], `hard-coded Thai copy in the student branch: ${thai.slice(0, 3).join(' | ')}`);
  // Material Symbols render a ligature name as a glyph, so those tokens are not user-visible copy.
  const withoutIcons = student.replace(/<span[^>]*material-symbols-outlined[^>]*>\s*[A-Za-z_]+\s*<\/span>/g, '');
  const textNodes = [...withoutIcons.matchAll(/>\s*([A-Za-z][A-Za-z\s'’.,()\-]{3,})\s*</g)]
    .map((match) => match[1].trim())
    .filter((text) => !BRAND_TEXT_NODES.includes(text));
  assert.deepEqual(textNodes, [], `hard-coded visible English copy in the student branch: ${textNodes.join(' | ')}`);
});

test('the student branch localizes machine values instead of printing raw codes', () => {
  assert.match(source, /import \{[^}]*localizedStatus[^}]*\} from '@\/lib\/dashboard-analytics\.cjs'/);
  assert.match(student, /localizedStatus\(booking\.status, locale\)/);
  assert.match(student, /user\.role === 'ADMIN' \? p\.roleAdmin : p\.roleStudent/);
  assert.match(student, /fillCopy\(p\.timeRemaining, \{ time:/);
});

test('the student branch keeps the booking actions wired to the same handlers', () => {
  assert.match(student, /onClick=\{\(\) => setBookingToCancel\(pendingBooking\.booking_id\)\}/);
  assert.match(student, /onClick=\{handleCancelBooking\}/);
  assert.match(student, /router\.push\('\/scan'\)/);
});
