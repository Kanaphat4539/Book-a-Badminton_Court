'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import SportBanner from '@/components/SportBanner';
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
  const router = useRouter();

  // States
  const [showRulesModal, setShowRulesModal] = useState(true);
  const [bookingDate] = useState<BookingDate>(() => createTodayBookingDate(new Date()));
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const selectedDate = bookingDate.date;

    // Calendar is static — shows the current month only (booking is on today)

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
        if (!ignoreResponse) toast.error('Failed to load courts');
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
      toast.error('กรุณาเลือกรอบเวลาก่อนทำรายการ');
      return;
    }
    if (isTimeInPast(selectedTime)) {
      toast.error('รอบนี้หมดเวลาแล้ว กรุณาเลือกรอบใหม่');
      return;
    }
    router.push(`/booking/select-court?date=${selectedDate}&time=${selectedTime}`);
  };

  const displayDateStr = bookingDate && selectedTime
    ? `${bookingDate.day} ${bookingDate.num} ${bookingDate.month} • ${selectedTime} - ${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00 น.`
    : '';
  
  // Calculate available courts for selected time
  const availableCourtsCount = selectedTime ? courts.filter(c => {
    const formattedTime = selectedTime + ':00';
    const isBooked = c.bookings?.some((b) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    );
    return !isBooked;
  }).length : 0;

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
                กฎและกติกาการใช้สนาม
              </h2>
              <button 
                onClick={handleCloseRules}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-surface-container hover:bg-surface-container-highest text-on-surface-variant transition-colors"
                title="ปิดหน้าต่างเพื่อดำเนินการจอง"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1 font-body-md text-on-surface-variant text-sm md:text-base space-y-4">
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">1. การแต่งกาย</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>ต้องสวมรองเท้าแบดมินตันพื้นยางดิบ (Non-marking) เท่านั้น</li>
                  <li>สวมใส่ชุดกีฬาที่เหมาะสมสำหรับการออกกำลังกาย</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">2. การจองและเช็คอิน</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>โควตา 1 ครั้ง/วัน แบบวันต่อวัน (ไม่มีจองข้ามวัน)</li>
                  <li>สแกน QR Code หน้าสนามเพื่อเช็คอิน</li>
                  <li>หากยกเลิกทันเวลา (ก่อน 15 นาทีของเวลาที่จอง) จะสามารถจองใหม่ในวันเดิมได้</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">3. กฎและบทลงโทษ</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>มาสายเกิน 15 นาที ระบบจะยกเลิกอัตโนมัติและนับความผิด 1 ครั้ง</li>
                  <li>ยกเลิกด้วยตนเองหลังเวลาผ่านไป 15 นาที จะถือว่าผิดกฎ 1 ครั้ง</li>
                  <li>หากสะสมความผิดครบ 2 ครั้ง ระบบจะระงับการจอง (แบน) 24 ชั่วโมง</li>
                </ul>
              </div>
              <p className="text-primary text-xs mt-4 p-3 bg-primary-container/30 rounded-xl">
                * กรุณากดเครื่องหมายกากบาท (X) ด้านบนขวาเพื่อยอมรับเงื่อนไขและดำเนินการจอง
              </p>
            </div>
          </div>
        </div>
      )}

      <main className="flex flex-col relative w-full bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-8">
          {/* Campus Sports Arena Context Card (Edge-to-edge banner) */}
                    <SportBanner
                      eyebrow="เปิดให้บริการปกติ"
                      title="จองคอร์ทแบดมินตัน"
                      subtitle={
                        <>
                          <span className="material-symbols-outlined text-[18px] text-white shrink-0 drop-shadow-sm">stadium</span>
                          <span className="truncate font-medium">อาคารยิมเนเซียม 1 (Gymnasium 1) • วิทยาเขตลาดกระบัง</span>
                        </>
                      }
                      right={
                        <div className="flex flex-col items-start gap-2">
                          <div className="px-4 py-2.5 rounded-xl bg-white shadow-lg flex items-center gap-2">
                            <span className="material-symbols-outlined text-[18px] text-[#F26522]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <span className="font-label-sm text-[12px] md:text-label-sm text-[#F26522] font-black uppercase tracking-wider">โควตา นศ.</span>
                          </div>
                          <span className="font-label-sm text-[12px] md:text-label-sm text-white font-bold bg-black/25 px-3 py-1 rounded-lg backdrop-blur-sm">คงเหลือ 1 ชม./วัน</span>
                        </div>
                      }
                    />

          <div className="mx-auto max-w-7xl px-4 md:px-10 w-full">
            {/* Calendar View (Monthly) */}
                      <section className="mt-4 px-4 md:px-margin-screen lg:px-8">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 mb-3">
                          <div className="flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                            <h2 className="font-headline-sm text-base md:text-headline-sm text-on-surface">ปฏิทินการจอง <span className="font-body-sm text-[13px] text-on-surface-variant font-medium">(Calendar)</span></h2>
                          </div>
                          <span className="ml-auto rounded-full bg-surface-container-high px-2.5 py-1 font-label-sm text-[10px] text-on-surface md:font-label-md md:text-label-sm">
                            เฉพาะวันนี้เท่านั้นที่จองได้
                          </span>
                        </div>

                        {/* Modern calendar card */}
                        <div className="rounded-2xl overflow-hidden bg-surface-container-lowest shadow-[0_14px_40px_-18px_rgba(171,53,0,0.35)] ring-1 ring-black/5 dark:ring-white/10">

                          {/* Gradient month header (static — current month only) */}
                          <div className="relative bg-gradient-to-br from-[#D2470A] via-primary to-[#7C2600]">
                            <div className="absolute inset-0 [background:radial-gradient(circle_at_top_right,rgba(255,255,255,0.22),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(0,0,0,0.18),transparent_45%)] pointer-events-none"></div>
                            <div className="relative flex flex-col items-center text-center select-none px-4 py-4 sm:py-5">
                              <span className="text-[22px] sm:text-[34px] font-extrabold text-white leading-none drop-shadow-sm tracking-tight">
                                {new Date().toLocaleDateString('th-TH', { month: 'long' })}
                              </span>
                              <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[11px] font-bold text-white/90 uppercase tracking-widest backdrop-blur-sm">
                                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                                {new Date().toLocaleDateString('th-TH', { year: 'numeric' })}
                              </span>
                            </div>
                          </div>

                          {/* Day headers */}
                          <div className="pt-3 sm:pt-4 pb-1.5 px-2.5 sm:px-4">
                            <div className="grid grid-cols-7 text-center">
                              {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map((day, i) => (
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
                              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                                <div key={`empty-${i}`} aria-hidden="true" />
                              ))}

                              {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                                const day = i + 1;
                                const cellDate = new Date(new Date().getFullYear(), new Date().getMonth(), day);
                                const dow = cellDate.getDay();
                                const isWeekend = dow === 0 || dow === 6;
                                const isPast = cellDate.getTime() < new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).getTime();
                                const isToday =
                                  day === new Date().getDate() &&
                                  new Date().getMonth() === cellDate.getMonth() &&
                                  new Date().getFullYear() === cellDate.getFullYear();

                                if (isToday) {
                                  return (
                                    <button
                                      key={day}
                                      type="button"
                                      aria-label={`วันที่ ${day} วันนี้`}
                                      className="relative flex flex-col items-center justify-center rounded-xl sm:rounded-2xl py-2 sm:py-3 bg-gradient-to-b from-primary to-[#8A2B00] text-white shadow-[0_8px_20px_-6px_rgba(171,53,0,0.65)] ring-2 ring-primary/40 scale-[1.04] z-10 cursor-pointer transition-transform hover:scale-[1.07]"
                                    >
                                      <span className="text-[15px] sm:text-[17px] font-extrabold leading-none select-none">{day}</span>
                                      <span className="mt-1 text-[8px] sm:text-[10px] font-bold text-white/95 uppercase tracking-wide select-none">
                                        วันนี้ {cellDate.toLocaleDateString('th-TH', { weekday: 'short' })}
                                      </span>
                                    </button>
                                  );
                                }

                                return (
                                  <button
                                    key={day}
                                    type="button"
                                    disabled
                                    aria-label={`วันที่ ${day}`}
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
                        </div>
                      </section>

          {/* Time Slots Matrix */}
          <section className="mt-6 px-4 md:px-margin-screen lg:px-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">schedule</span>
                <h2 className="font-headline-sm text-base md:text-headline-sm text-on-surface">ช่วงเวลา (Time Slots)</h2>
              </div>
              <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant">รอบละ 60 นาที</span>
            </div>
            
            {/* Status Legend */}
            <div className="flex items-center justify-start gap-3 md:gap-4 mb-3.5 py-1.5 px-3 rounded-xl bg-surface-container-low overflow-x-auto scrollbar-hide">
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm md:rounded-md bg-surface-container-lowest shadow-sm"></div>
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant">ว่าง</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm md:rounded-md bg-primary-container shadow-sm"></div>
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant">เลือกอยู่</span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-sm md:rounded-md bg-surface-container-high opacity-60"></div>
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant">จองแล้ว</span>
              </div>
            </div>

            {/* Responsive Grid */}
            {loading ? (
              <p className="text-on-surface-variant text-sm py-4">Loading times...</p>
            ) : (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:gap-slot-grid-gap lg:grid-cols-5 xl:grid-cols-6">
                {timeSlots.map(time => {
                  const isFullyBooked = isTimeFullyBooked(time);
                  const isPast = isTimeInPast(time);
                  const isSelected = selectedTime === time;

                  if (isFullyBooked || isPast) {
                    return (
                      <div key={time} className="flex items-center justify-center py-2 md:py-2.5 rounded-xl bg-surface-container-high/60 text-on-surface-variant/40 line-through cursor-not-allowed select-none">
                        <span className="font-label-md text-[11px] md:text-label-md">{time}</span>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`flex items-center justify-center py-2 md:py-2.5 rounded-xl shadow-sm transition-colors ${
                        isSelected
                          ? 'bg-primary-container text-on-primary shadow-[0_4px_16px_rgba(255,94,30,0.35)] scale-[1.02] ring-2 ring-primary'
                          : 'bg-surface-container-lowest text-primary hover:bg-primary-fixed'
                      }`}
                      type="button"
                    >
                      <span className={`font-label-md text-[11px] md:text-label-md ${isSelected ? 'font-extrabold' : 'font-bold'}`}>{time}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Available Courts Cards Section */}
          {selectedTime && (
            <div className="px-4 md:px-margin-screen lg:px-8 mt-6 mb-2">
              <div className="rounded-3xl bg-surface-container-lowest p-card-padding shadow-md flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">รอบและเวลาที่เลือก</span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="material-symbols-outlined text-[18px] text-primary">event_available</span>
                      <span className="font-headline-sm text-headline-sm text-on-surface font-bold">{displayDateStr}</span>
                    </div>
                  </div>
                  <div className="px-2.5 py-1 rounded-full bg-secondary/10 text-secondary flex items-center gap-1 shrink-0">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>
                    <span className="font-label-sm text-label-sm font-bold">{availableCourtsCount} คอร์ทว่าง</span>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={handleNext}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-label-lg text-label-lg shadow-[0_6px_20px_rgba(255,94,30,0.35)] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>ดำเนินการเลือกสนาม (ถัดไป)</span>
                  <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* Delightful Information Banner & Reminder */}
          <div className="px-4 md:px-margin-screen lg:px-8 mt-2 mb-2">
            <div className="rounded-2xl bg-gradient-to-r from-surface-container-low via-surface-container to-surface-container-low p-3.5 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[22px]">info</span>
                </div>
                <div className="flex flex-col">
                  <span className="font-label-md text-label-md text-on-surface font-semibold">กติกาการใช้บริการ</span>
                  <span className="font-body-sm text-[12px] md:text-body-sm text-on-surface-variant">โควตา 1 สิทธิ์/วัน • เช็คอินหน้าสนามด้วย QR • ยกเลิกสาย/ขาด ครบ 2 ครั้ง แบน 24 ชม.</span>
                </div>
              </div>
              <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
            </div>
          </div>
          </div>
        </div>
      </main>
    </MainLayout>
  );
}
