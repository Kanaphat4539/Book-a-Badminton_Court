export type SelectCourtLocale = 'th' | 'en';
export type SelectCourtCopyKey =
  | 'selectedTime' | 'unknownBooker' | 'courtAlt' | 'changeTime' | 'chooseCourt' | 'booked' | 'ready' | 'indoor'
  | 'studentBenefit' | 'dailyFree' | 'unavailable' | 'bookCourt' | 'reminder'
  | 'confirmTitle' | 'confirmDescription' | 'booker' | 'importantRules' | 'backToChoose'
  | 'confirmBooking' | 'booking' | 'loading' | 'todayPolicyShort' | 'loadError'
  | 'missingParams' | 'bookingFailed' | 'slotExpired' | 'bookingSuccess' | 'refreshFailed'
  | 'availableCourts' | 'totalCourts' | 'hallName' | 'studentQuota' | 'reminderBody'
  | 'reminderMinutes' | 'reminderTail' | 'dateLabel' | 'monthLabel' | 'courtLabel' | 'timeLabel'
  | 'ruleCheckIn' | 'ruleNoShow' | 'ruleShoes' | 'indoorLocation' | 'northLocation';
export function selectCourtText(locale: SelectCourtLocale, key: SelectCourtCopyKey, ...args: (string | number)[]): string;
export const selectCourtCopy: Record<SelectCourtLocale, Record<string, string | ((...args: (string | number)[]) => string)>>;
