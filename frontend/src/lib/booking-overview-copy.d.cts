export type BookingOverviewLocale = 'th' | 'en';
export type BookingOverviewKey = keyof typeof import('./booking-overview-copy.cjs').overviewCopy.th;
export const overviewCopy: Record<BookingOverviewLocale, Record<BookingOverviewKey, string>>;
