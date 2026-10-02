export type BookingDate = {
  date: string;
  day: string;
  num: string;
  month: string;
};

export type DisplayLocale = 'th' | 'en';

type BookingConfirmationInput = {
  date: string;
  time: string;
  courtName: string;
  bookerName: string;
};

const localeTag = (locale: DisplayLocale) => (locale === 'th' ? 'th-TH' : 'en-US');

/** Short Thai weekday as the UI has always shown it ('พุธ', not 'วันพุธ'). */
function weekdayLabel(dateKey: string, locale: DisplayLocale): string {
  const label = new Intl.DateTimeFormat(localeTag(locale), { weekday: 'long', timeZone: 'Asia/Bangkok' })
    .format(new Date(`${dateKey}T12:00:00+07:00`));
  return locale === 'th' ? label.replace(/^วัน/, '') : label;
}

function monthLabel(dateKey: string, locale: DisplayLocale): string {
  return new Intl.DateTimeFormat(localeTag(locale), { month: 'long', timeZone: 'Asia/Bangkok' })
    .format(new Date(`${dateKey}T12:00:00+07:00`));
}

export function createTodayBookingDate(_now: Date, locale: DisplayLocale = 'th'): BookingDate {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(_now);
  const calendarDate = new Date(`${date}T00:00:00Z`);

  return {
    date,
    day: weekdayLabel(date, locale),
    num: String(calendarDate.getUTCDate()),
    month: monthLabel(date, locale),
  };
}

export function createBookingConfirmationDetails(
  _input: BookingConfirmationInput,
  locale: DisplayLocale = 'th',
) {
  const [year, month, day] = _input.date.split('-').map(Number);
  const [hour, minute] = _input.time.split(':').map(Number);
  const endHour = String(hour + 1).padStart(2, '0');
  const clock = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} - ${endHour}:${String(minute).padStart(2, '0')}`;

  return {
    date: String(day),
    month: monthLabel(`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, locale),
    court: _input.courtName,
    time: locale === 'th' ? `${clock} น.` : clock,
    booker: _input.bookerName,
  };
}

export function isBookingSlotSelectable(
  date: string,
  time: string,
  now: Date
): boolean {
  if (!/^\d{2}:00$/.test(time)) return false;
  const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(now);
  
  if (date !== todayStr) return false;
  
  const hour = Number(time.split(':')[0]);
  if (hour > 22 || hour < 8) return false;
  
  const slotDate = new Date(`${date}T${time}:00+07:00`);
  
  // An ongoing round remains bookable until its original end, not its start.
  return now.getTime() < slotDate.getTime() + 60 * 60 * 1000;
}

