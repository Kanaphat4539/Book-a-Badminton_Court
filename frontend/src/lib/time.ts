// Pure, framework-free helpers for the booking calendar. Kept out of the page
// component so they can be unit-tested without rendering React.

/** Generate `count` hourly slots as "HH:00" strings, starting at `startHour`. */
export function generateHourlySlots(startHour: number, count: number): string[] {
  return Array.from({ length: count }, (_, i) =>
    `${(startHour + i).toString().padStart(2, '0')}:00`,
  );
}

/**
 * Whether a given "HH:00" slot on `selectedDate` (YYYY-MM-DD) is already in the
 * past relative to `now`. Only today's slots can be in the past.
 */
export function isSlotInPast(selectedDate: string, timeStr: string, now: Date = new Date()): boolean {
  if (!selectedDate) return false;
  const todayStr = now.toISOString().split('T')[0];
  if (selectedDate !== todayStr) return false;

  const slotHour = parseInt(timeStr.split(':')[0], 10);
  return now.getHours() > slotHour;
}
