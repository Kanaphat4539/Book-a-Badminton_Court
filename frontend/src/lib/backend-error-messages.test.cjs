const test = require('node:test');
const assert = require('node:assert/strict');
const { localizeBackendError } = require('./backend-error-messages.cjs');
const { messages } = require('./locale-messages.cjs');

test('known admin API errors map to localized copy without exposing backend text', () => {
  assert.equal(localizeBackendError('Student not found', 'th', 'failedLoadUsers'), messages.th.backendStudentNotFound);
  assert.equal(localizeBackendError(['Account already exists'], 'en', 'failedCreateAdmin'), messages.en.backendAccountExists);
});

test('unknown, malformed, and untrusted backend errors use the localized safe fallback', () => {
  for (const input of ['<script>alert(1)</script>', { detail: 'secret' }, null]) {
    assert.equal(localizeBackendError(input, 'th', 'failedBan'), messages.th.backendTryAgain);
    assert.equal(localizeBackendError(input, 'en', 'failedBan'), messages.en.backendTryAgain);
  }
});

test('reset and ban confirmation copy is localized and keeps the username token', () => {
  for (const locale of ['th', 'en']) {
    assert.match(messages[locale].confirmResetQuota, /@\{username\}/);
    assert.match(messages[locale].confirmBan, /@\{username\}/);
    assert.ok(messages[locale].confirmResetQuota.trim());
    assert.ok(messages[locale].confirmBan.trim());
  }
});

test('known scan/check-in API errors map to localized copy', () => {
  assert.equal(localizeBackendError('Booking not found', 'th', 'checkinFailed'), messages.th.backendBookingNotFound);
  assert.equal(localizeBackendError('The check-in period has ended.', 'en', 'checkinFailed'), messages.en.backendCheckinEnded);
});
