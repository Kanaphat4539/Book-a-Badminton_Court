const knownErrors = {
  'Student not found': 'backendStudentNotFound',
  'Account already exists': 'backendAccountExists',
  'ยังมีโควตาร์อยู่': 'backendQuotaStillAvailable',
  'Booking not found': 'backendBookingNotFound',
  'Booking not found or mismatch with this court.': 'backendBookingNotFound',
  'The check-in period has ended.': 'backendCheckinEnded',
  'You cannot check in more than 15 minutes before the booking time starts.': 'backendTooEarlyCheckin',
  'Your account is currently banned from booking courts.': 'backendAccountBanned',
};

// eslint-disable-next-line @typescript-eslint/no-require-imports -- CommonJS helper is shared with node:test.
const { messages } = require('./locale-messages.cjs');

function localizeBackendError(error, locale) {
  const raw = Array.isArray(error) ? error[0] : error;
  const key = typeof raw === 'string' ? knownErrors[raw] : undefined;
  return messages[locale]?.[key] ?? messages[locale]?.backendTryAgain ?? messages.en.backendTryAgain;
}

module.exports = { localizeBackendError };
