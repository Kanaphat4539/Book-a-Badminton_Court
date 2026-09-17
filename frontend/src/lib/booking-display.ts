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
  const year = _now.getFullYear();
  const month = String(_now.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(_now.getDate()).padStart(2, '0');
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
    date: `${year}-${month}-${dayOfMonth}`,
    day: thaiDays[_now.getDay()],
    num: String(_now.getDate()),
    month: _now.toLocaleDateString('th-TH', { month: 'long' }),
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
  if (!time.endsWith(':00')) return false;
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const dayOfMonth = String(now.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${dayOfMonth}`;
  
  if (date !== todayStr) return false;
  
  const [hour, minute] = time.split(':').map(Number);
  if (hour > 23 || hour < 0) return false;
  
  const slotDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, minute, 0);
  
  return now.getTime() < slotDate.getTime();
}

