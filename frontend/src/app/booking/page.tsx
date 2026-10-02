'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import { useLocale } from '@/components/locale-provider';
import SportBanner from '@/components/SportBanner';
import { overviewCopy } from '@/lib/booking-overview-copy.cjs';
import { createTodayBookingDate, isBookingSlotSelectable, type BookingDate } from '@/lib/booking-display';

type CourtBooking = {
  start_time: string;
  status: string;
};

type Court = {
  id: number;
  name: string;
  description: string;
  status: string;
  availability?: unknown[];
  bookings?: CourtBooking[];
};

export default function BookingPage() {
  const { locale } = useLocale();
  const c = overviewCopy[locale];
  const router = useRouter();

  // States
  const [showRulesModal, setShowRulesModal] = useState(true);
  // Recomputed on language change so the weekday/month names follow the selected locale.
  const bookingDate = useMemo<BookingDate>(() => createTodayBookingDate(new Date(), locale), [locale]);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedDate = bookingDate.date;

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role === 'ADMIN') {
          router.push('/dashboard');
        }
      } catch (e) {}
    }
  }, [router]);

  const handleCloseRules = () => {
    setShowRulesModal(false);
  };

  // Time slots from 08:00 to 23:00 (15 slots, each 1 hour)
  const timeSlots = Array.from({ length: 15 }, (_, i) => {
    return `${(i + 8).toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    let ignoreResponse = false;

    void api.get<Court[]>(`/courts/availability?date=${selectedDate}`)
      .then((response) => {
        if (ignoreResponse) return;

        const sortedCourts = response.data.toSorted((a, b) =>
          a.name.localeCompare(b.name, undefined, { numeric: true })
        );
        setCourts(sortedCourts);
      })
      .catch(() => {
        if (!ignoreResponse) toast.error(c.loadError);
      })
      .finally(() => {
        if (!ignoreResponse) setLoading(false);
      });

    return () => {
      ignoreResponse = true;
    };
  }, [router, selectedDate]);

  const isTimeFullyBooked = (time: string) => {
    if (!courts.length) return false;
    const formattedTime = time + ':00';
    // If all courts have this time booked with an active status, it's fully booked
    return courts.every(c => c.bookings?.some((b) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    ));
  };

  const isTimeInPast = (timeStr: string) => {
    return !isBookingSlotSelectable(selectedDate, timeStr, new Date());
  };

  const handleNext = () => {
    if (!selectedTime) {
      toast.error(c.selectTimeError);
      return;
    }
    if (isTimeInPast(selectedTime)) {
      toast.error(c.slotExpired);
      return;
    }
    router.push(`/booking/select-court?date=${selectedDate}&time=${selectedTime}`);
  };

  const displayDateStr = bookingDate && selectedTime
    ? `${bookingDate.day} ${bookingDate.num} ${bookingDate.month} • ${selectedTime} - ${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00${locale === 'th' ? c.timeUnit : ''}`
    : '';

  // Calculate available courts for selected time
  const availableCourtsCount = selectedTime ? courts.filter(c => {
    const formattedTime = selectedTime + ':00';
    const isBooked = c.bookings?.some((b) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    );
    return !isBooked;
  }).length : 0;

  // Calendar helper functions
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();
  const currentDay = new Date().getDate();
  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfWeek = getFirstDayOfMonth(currentYear, currentMonth);

  // Thai month names
  const thaiMonths = [
    '', '', '', '', '', '', '', '', '', '', '', ''
  ];

  // Buddhist year
  const buddhistYear = currentYear + (locale === 'th' ? 543 : 0);

  // Format time slot display
  const formatTimeSlot = (time: string) => {
    const hour = parseInt(time.split(':')[0]);
    const nextHour = hour + 1;
    return `${time} - ${nextHour.toString().padStart(2, '0')}:00`;
  };

  // Get available courts count for a time slot
  const getAvailableCourtsForTime = (time: string) => {
    return courts.filter(c => {
      const formattedTime = time + ':00';
      const isBooked = c.bookings?.some((b) =>
        b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
      );
      return !isBooked;
    }).length;
  };

  return (
    <MainLayout width="full">
      {/* Rules Modal */}
      {showRulesModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-surface relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant/30 bg-surface-container-lowest">
              <h2 className="font-headline-sm text-on-surface text-lg md:text-xl font-bold flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-[24px]">gavel</span>
                {c.rulesTitle}
              </h2>
              <button
                onClick={handleCloseRules}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                title={c.closeRules}
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 font-body-md text-on-surface-variant text-sm md:text-base space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">1. {c.attire}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{c.shoes}</li>
                  <li>{c.sportswear}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">2. {c.bookingCheckin}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{c.quotaRule}</li>
                  <li>{c.qrCheckin}</li>
                  <li>{c.cancelRule}</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">3. {c.penalties}</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>{c.lateRule}</li>
                  <li>{c.cancelLateRule}</li>
                  <li>{c.banRule}</li>
                </ul>
              </div>
              <p className="text-primary text-xs mt-4 p-3 bg-primary-container/30 rounded-xl">
                {c.acceptRules}
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col relative w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-8">
          {/* Campus Sports Arena Context Card (Edge-to-edge banner) */}
          <SportBanner
            eyebrow={c.operational}
                        title={c.bookTitle}
            subtitle={
              <>
                <span className="material-symbols-outlined text-[18px] text-white shrink-0 drop-shadow-sm">stadium</span>
                <span className="truncate font-medium">{c.venue}</span>
              </>
            }
            right={
              <div className="flex flex-col items-start gap-2">
                <div className="px-4 py-2.5 rounded-xl bg-white shadow-lg flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px] text-[#F26522]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-label-sm text-[12px] md:text-label-sm text-[#F26522] font-black uppercase tracking-wider">{c.studentQuota}</span>
                </div>
                <span className="font-label-sm text-[12px] md:text-label-sm text-white font-bold bg-black/25 px-3 py-1 rounded-lg backdrop-blur-sm">{c.remaining}</span>
              </div>
            }
          />

          <div className="mx-auto max-w-7xl px-4 md:px-10 w-full">
            {/* Two-column layout: Calendar (left) + Booking Details (right) */}
            <div className="mt-4 lg:grid lg:grid-cols-12 lg:gap-6">
              {/* LEFT COLUMN: Calendar */}
              <div className="lg:col-span-7">
                <section className="px-4 md:px-margin-screen lg:px-8">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
                    <div className="flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                      <h2 className="font-headline-sm text-base md:text-headline-sm text-on-surface">
                        {c.calendar} <span className="font-body-sm text-[13px] text-on-surface-variant font-medium">({c.calendarEnglish})</span>
                      </h2>
                    </div>
                    <span className="ml-auto rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] text-on-surface md:font-label-md md:text-label-sm">
                      {c.todayOnly}
                    </span>
                  </div>

                  {/* Modern Calendar Card */}
                  <div className="rounded-2xl overflow-hidden bg-surface-container-lowest shadow-[0_14px_40px_-18px_rgba(171,53,0,0.35)] ring-1 ring-black/5 dark:ring-white/10">
                    {/* Gradient month header */}
                    <div className="relative bg-gradient-to-br from-[#D2470A] via-primary to-[#7C2600]">
                      <div className="absolute inset-0 [background:radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_45%)] pointer-events-none"></div>
                      <div className="relative flex flex-col items-center text-center select-none px-4 py-4 sm:py-5">
                        <span className="text-[22px] sm:text-[34px] font-extrabold text-white leading-none drop-shadow-sm tracking-tight">
                          {new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { month: 'long', timeZone: 'Asia/Bangkok' }).format(new Date(currentYear, currentMonth, 1))}
                        </span>
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold text-white/90 uppercase tracking-widest backdrop-blur-sm">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                          {c.yearPrefix} {buddhistYear}
                        </span>
                      </div>
                    </div>

                    {/* Day headers */}
                    <div className="pt-3 sm:pt-4 pb-1.5 px-2.5 sm:px-4">
                      <div className="grid grid-cols-7 text-center">
                        {Array.from({ length: 7 }, (_, i) => new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(Date.UTC(2024, 0, 7 + i)))).map((day, i) => (
                          <div key={day} className={`font-label-md text-[12px] sm:text-[13px] font-bold ${i === 0 || i === 6 ? 'text-primary' : 'text-on-surface-variant'}`}>
                            {day}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Day grid */}
                    <div className="px-2.5 sm:px-4 pb-4 sm:pb-5">
                      <div className="grid grid-cols-7 gap-0.5 sm:gap-1.5">
                        {/* Leading blanks aligned to weekday start */}
                        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                          <div key={`empty-${i}`} aria-hidden="true" />
                        ))}

                        {Array.from({ length: daysInMonth }).map((_, i) => {
                          const day = i + 1;
                          const cellDate = new Date(currentYear, currentMonth, day);
                          const dow = cellDate.getDay();
                          const isWeekend = dow === 0 || dow === 6;
                          const isPast = cellDate.getTime() < new Date(currentYear, currentMonth, currentDay).getTime();
                          const isToday = day === currentDay;

                          if (isToday) {
                            return (
                              <button
                                key={day}
                                type="button"
                                aria-label={`${c.todayAria} ${day} ${c.today}`}
                                className="relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl py-2 sm:py-3 bg-gradient-to-b from-primary to-[#8A2B00] text-white shadow-[0_8px_20px_-6px_rgba(171,53,0,0.65)] ring-2 ring-primary/40 scale-[1.04] z-10 cursor-pointer transition-transform hover:scale-[1.07]"
                              >
                                <span className="text-[15px] sm:text-[17px] font-extrabold leading-none select-none">{day}</span>
                                <span className="mt-1 text-[8px] sm:text-[10px] font-bold text-white/95 uppercase tracking-wide select-none">
                                  {c.today} {new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', { weekday: 'long' }).format(cellDate)}
                                </span>
                              </button>
                            );
                          }

                          return (
                            <button
                              key={day}
                              type="button"
                              disabled
                              aria-label={`${c.todayAria} ${day}`}
                              className={`relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl py-2 sm:py-3 select-none cursor-not-allowed transition-colors ${
                                isPast
                                  ? 'bg-surface-container-low text-on-surface-variant'
                                  : 'bg-surface-container-lowest text-on-surface ring-1 ring-outline-variant/40 hover:bg-surface-container-low'
                              }`}
                            >
                              <span className="text-[14px] sm:text-[15px] font-semibold leading-none">{day}</span>
                              {isWeekend && !isPast && <span className="mt-1 w-1 h-1 rounded-full bg-primary/40"></span>}
                              {isWeekend && isPast && <span className="mt-1 w-1 h-1 rounded-full bg-outline/50"></span>}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Calendar Legend */}
                    <div className="px-4 py-3 border-t border-outline-variant/30 bg-surface-container-low/50 flex flex-wrap items-center justify-center gap-3 md:gap-4 text-xs md:text-sm">
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-gradient-to-b from-primary to-[#8A2B00] shadow-sm"></div>
                        <span className="font-label-sm text-on-surface-variant">{c.selectedDay}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-surface-container-high opacity-60"></div>
                        <span className="font-label-sm text-on-surface-variant">{c.unselectable}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                        <span className="font-label-sm text-on-surface-variant">{c.weekend}</span>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* RIGHT COLUMN: Booking Details & Time Slots */}
              <div className="lg:col-span-5 lg:sticky lg:top-24 lg:self-start">
                <section className="mt-4 lg:mt-0 px-4 md:px-margin-screen lg:px-8">
                  <div className="rounded-2xl overflow-hidden bg-surface-container-lowest shadow-[0_14px_40px_-18px_rgba(171,53,0,0.35)] ring-1 ring-black/5 dark:ring-white/10">
                    {/* Selected Session Header */}
                    <div className="bg-gradient-to-r from-primary-container to-primary px-6 py-4">
                      <div className="flex items-center gap-2 text-white font-bold text-sm md:text-base">
                        <span className="material-symbols-outlined text-[20px]">event_note</span>
                        {c.selectedRound}
                      </div>
                    </div>

                    {/* Date Card */}
                    <div className="p-5 border-b border-outline-variant/30">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                            <span className="material-symbols-outlined text-primary text-[28px]">calendar_today</span>
                          </div>
                          <div>
                            <div className="font-headline-sm text-on-surface text-base md:text-lg font-bold">
                              {new Intl.DateTimeFormat(locale === 'th' ? 'th-TH-u-ca-buddhist' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(new Date(`${selectedDate}T12:00:00+07:00`))}
                            </div>
                            <div className="text-on-surface-variant text-sm mt-0.5">
                              {c.slotsAvailable.replace('{count}', String(timeSlots.length))}
                            </div>
                          </div>
                        </div>
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary text-2xl font-extrabold">
                          {bookingDate.num}
                        </div>
                      </div>
                    </div>

                    {/* Time Slots */}
                    <div className="p-5">
                      <h3 className="font-headline-sm text-on-surface text-sm md:text-base font-bold mb-3 flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-primary text-[18px]">schedule</span>
                        {c.chooseTime}
                      </h3>

                      {loading ? (
                        <div className="space-y-2">
                          {Array.from({ length: 4 }).map((_, i) => (
                            <div key={i} className="h-12 rounded-xl bg-surface-container-high animate-pulse"></div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                          {timeSlots.map(time => {
                            const isFullyBooked = isTimeFullyBooked(time);
                            const isPast = isTimeInPast(time);
                            const isSelected = selectedTime === time;
                            const availableCount = getAvailableCourtsForTime(time);

                            if (isFullyBooked || isPast) {
                              return (
                                <div key={time} className="flex items-center justify-between py-2.5 px-3 rounded-xl bg-surface-container-high/60 text-on-surface-variant/40 line-through cursor-not-allowed select-none">
                                  <span className="font-label-md text-sm md:text-base">{formatTimeSlot(time)}</span>
                                  <span className="font-label-sm text-xs text-on-surface-variant/60">{c.full}</span>
                                </div>
                              );
                            }

                            return (
                              <button
                                key={time}
                                onClick={() => setSelectedTime(time)}
                                className={`w-full flex items-center justify-between py-2.5 px-3 rounded-xl shadow-sm transition-all ${
                                  isSelected
                                    ? 'bg-primary-container text-on-primary shadow-[0_4px_16px_rgba(255,94,30,0.35)] ring-2 ring-primary'
                                    : 'bg-surface-container-lowest text-on-surface hover:bg-primary-fixed/30 hover:border-primary/30 border border-outline-variant/30'
                                }`}
                                type="button"
                              >
                                <span className={`font-label-md text-sm md:text-base ${isSelected ? 'font-extrabold' : 'font-medium'}`}>
                                  {formatTimeSlot(time)}
                                </span>
                                <span className="flex items-center gap-1.5 shrink-0">
                                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                                  <span className="font-label-sm text-xs md:text-sm font-medium">
                                    {availableCount > 0 ? c.available.replace('{count}', String(availableCount)) : c.fullyBooked}
                                  </span>
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Booking Summary */}
                    <div className="px-5 pb-5 pt-0 border-t border-outline-variant/30">
                      <div className="space-y-3 pt-4">
                        <div className="flex items-center justify-between py-2">
                          <span className="font-body-sm text-on-surface-variant">{c.serviceType}</span>
                          <span className="font-label-md text-on-surface font-semibold">{c.badminton}</span>
                        </div>
                        <div className="flex items-center justify-between py-2">
                          <span className="font-body-sm text-on-surface-variant">{c.duration}</span>
                          <span className="font-label-md text-on-surface font-semibold">{c.durationValue}</span>
                        </div>
                      </div>

                      {/* Proceed Button */}
                      <button
                        type="button"
                        onClick={handleNext}
                        disabled={!selectedTime}
                        className="w-full mt-4 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_20px_rgba(255,94,30,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
                      >
                        <span>{c.continue}</span>
                        <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                      </button>

                      {/* Note */}
                      <p className="text-center text-[11px] text-on-surface-variant/70 mt-3">
                        {c.holdNote}
                      </p>

                      {/* Info Box */}
                      <div className="mt-4 p-3.5 rounded-xl bg-warning-container/30 border border-warning/20 flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-warning text-[20px]">info</span>
                        </div>
                        <div className="flex-1 text-[12px] text-warning-container leading-relaxed">
                          <div className="font-bold text-warning-container mb-1">{c.conditions}</div>
                          {c.conditionsText}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}