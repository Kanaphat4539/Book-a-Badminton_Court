export type BookingLocale = 'th' | 'en';
export type BookingMessageKey = keyof typeof import('./booking-page-messages.cjs').bookingMessages.th;
export const bookingMessages: Record<BookingLocale, Record<BookingMessageKey, string>>;
export function bookingErrorMessage(message: string | undefined, locale: BookingLocale): string;
export function formatBookingDate(date: string, time: string, locale: BookingLocale, machine?: boolean): string;
