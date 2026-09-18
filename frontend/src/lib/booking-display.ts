export type BookingDate = {
  date: string;
  day: string;
  num: string;
  month: string;
};

type BookingConfirmationInput = {
  date: string;
  time: string;
  courtName: string;
  bookerName: string;
};

export function createTodayBookingDate(_now: Date): BookingDate {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(_now);
  const calendarDate = new Date(`${date}T00:00:00Z`);
  const thaiDays = [
    'อาทิตย์',
    'จันทร์',
    'อังคาร',
    'พุธ',
    'พฤหัสบดี',
    'ศุกร์',
    'เสาร์',
  ];

  return {
    date,
    day: thaiDays[calendarDate.getUTCDay()],
    num: String(calendarDate.getUTCDate()),
    month: _now.toLocaleDateString('th-TH', { month: 'long', timeZone: 'Asia/Bangkok' }),
  };
}

export function createBookingConfirmationDetails(
  _input: BookingConfirmationInput,
) {
  const [year, month, day] = _input.date.split('-').map(Number);
  const bookingDate = new Date(year, month - 1, day);
  const [hour, minute] = _input.time.split(':').map(Number);
  const endHour = String(hour + 1).padStart(2, '0');

  return {
    date: String(day),
    month: bookingDate.toLocaleDateString('th-TH', { month: 'long' }),
    court: _input.courtName,
    time: `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')} - ${endHour}:${String(minute).padStart(2, '0')} น.`,
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

