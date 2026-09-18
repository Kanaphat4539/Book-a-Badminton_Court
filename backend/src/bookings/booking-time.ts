type BookingTime = {
  booking_date: string;
  time_in: string;
  time_out: string;
  created_at?: Date | null;
};

export function getBookingTimes(booking: BookingTime) {
  const start = new Date(`${booking.booking_date}T${booking.time_in}+07:00`).getTime();
  const end = new Date(`${booking.booking_date}T${booking.time_out}+07:00`).getTime();
  // Legacy rows have no creation timestamp: retain their original grace period.
  const created = booking.created_at ? new Date(booking.created_at).getTime() : start;
  return { start, end, deadline: Math.max(start, created) + 15 * 60 * 1000 };
}
