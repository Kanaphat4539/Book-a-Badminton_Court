const knownErrors = {
  'Student not found': 'backendStudentNotFound',
  'Account already exists': 'backendAccountExists',
  'ยังมีโควตาร์อยู่': 'backendQuotaStillAvailable', // older backends
  'Booking not found': 'backendBookingNotFound',
  'Booking not found or mismatch with this court.': 'backendBookingNotFound',
  'The check-in period has ended.': 'backendCheckinEnded',
  'You cannot check in more than 15 minutes before the booking time starts.': 'backendTooEarlyCheckin',
  'Your account is currently banned from booking courts.': 'backendAccountBanned',
  'Daily booking quota already used.': 'backendQuotaUsed',
  'Student still has quota available.': 'backendQuotaStillAvailable',
  'You already have an active booking. Please complete or cancel it first.': 'backendActiveBooking',
  'This court is already booked at this time.': 'backendCourtTaken',
  'Day-by-day policy: You can only book courts for today.': 'backendTodayOnly',
  'This booking round has already ended.': 'backendRoundEnded',
  'Booking hours are 08:00 to 23:00.': 'backendBookingHours',
  'Invalid booking start time.': 'backendInvalidStartTime',
  'Invalid credentials': 'backendInvalidCredentials',
  'Username already exists': 'backendUsernameTaken',
  'Email must be a @kmitl.ac.th address': 'backendKmitlEmailOnly',
};

// Messages that carry a dynamic tail (a status or an id) are matched by pattern.
const knownPatterns = [
  [/^Cannot (cancel|check in|finish)\. Status is currently /, 'backendStatusChanged'],
  [/^Court ID .+ not found$/, 'backendCourtNotFound'],
  // Older backends sent this one in Thai.
  [/^ใช้โควตาประจำวันแล้ว/, 'backendQuotaUsed'],
];

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS helper is shared with node:test.
const { messages } = require('./locale-messages.cjs');

function knownKey(error) {
  const raw = Array.isArray(error) ? error[0] : error;
  if (typeof raw !== 'string') return undefined;
  return knownErrors[raw] ?? knownPatterns.find(([pattern]) => pattern.test(raw))?.[1];
}

// Localized text for a known backend error, or undefined so the caller can use its own fallback.
// Unknown backend text is never shown as-is: it may be in the wrong language or leak internals.
function localizeKnownBackendError(error, locale) {
  const key = knownKey(error);
  return key ? messages[locale]?.[key] : undefined;
}

function localizeBackendError(error, locale) {
  return localizeKnownBackendError(error, locale) ?? messages[locale]?.backendTryAgain ?? messages.en.backendTryAgain;
}

module.exports = { localizeBackendError, localizeKnownBackendError };
