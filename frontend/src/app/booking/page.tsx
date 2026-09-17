'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import { createTodayBookingDate, type BookingDate } from '@/lib/booking-display';

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
    if (!selectedDate) return false;
    const now = new Date();
    const todayStr = createTodayBookingDate(now).date;
    if (selectedDate !== todayStr) return false;

    const slotHour = parseInt(timeStr.split(':')[0], 10);
    const currentHour = now.getHours();
    return currentHour > slotHour;
  };

  const handleNext = () => {
    if (!selectedTime) {
      toast.error('กรุณาเลือกรอบเวลาก่อนทำรายการ');
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
                <h3 className="font-bold text-on-surface">2. การจองและการใช้งาน</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>นักศึกษาได้โควตา 1 ชั่วโมง/วัน/บัญชี</li>
                  <li>กรุณามาถึงสนามก่อนเวลาจอง 10-15 นาที เพื่อทำการสแกน QR Code เช็คอิน</li>
                  <li>หากไม่ทำการเช็คอินภายใน 15 นาที ระบบจะยกเลิกการจองอัตโนมัติ</li>
                </ul>
              </div>
              <div className="space-y-2">
                <h3 className="font-bold text-on-surface">3. บทลงโทษ (Blacklist)</h3>
                <ul className="list-disc pl-5 space-y-1">
                  <li>หากจองแล้วไม่มาใช้งาน (No-show) เกิน 2 ครั้ง จะถูกระงับสิทธิ์การจอง 7 วัน</li>
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
          <section className="relative overflow-hidden bg-gradient-to-r from-[#F26522] to-yellow-500 shadow-[0_8px_24px_rgba(242,101,34,0.3)]">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0"></div>
            <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/20 rounded-full blur-3xl pointer-events-none z-0"></div>
            
            <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex flex-col min-w-0">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white w-fit mb-3 backdrop-blur-md border border-white/30 shadow-inner">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse shrink-0 shadow-[0_0_8px_#4ade80]"></span>
                  <span className="font-label-sm text-[10px] md:text-label-sm uppercase tracking-widest font-black">เปิดให้บริการปกติ</span>
                </div>
                <h1 className="font-headline-sm text-3xl md:text-[40px] text-white font-extrabold truncate drop-shadow-md pb-2">จองคอร์ทแบดมินตัน</h1>
                <p className="font-body-sm text-[14px] md:text-[16px] text-white/90 flex items-center gap-1.5 mt-1 truncate">
                  <span className="material-symbols-outlined text-[18px] text-white shrink-0 drop-shadow-sm">stadium</span>
                  <span className="truncate font-medium">อาคารยิมเนเซียม 1 (Gymnasium 1) • วิทยาเขตลาดกระบัง</span>
                </p>
              </div>
              <div className="flex flex-col items-start md:items-end shrink-0">
                <div className="px-3 py-2 md:px-4 rounded-xl bg-white shadow-lg flex items-center gap-1">
                  <span className="material-symbols-outlined text-[18px] text-[#F26522]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                  <span className="font-label-sm text-[12px] md:text-label-sm text-[#F26522] font-black uppercase tracking-wider">โควตา นศ.</span>
                </div>
                <span className="font-label-sm text-[12px] md:text-label-sm text-white font-bold mt-2 bg-black/20 px-3 py-1 rounded backdrop-blur-sm">คงเหลือ 1 ชม./วัน</span>
              </div>
            </div>
          </section>

          <div className="mx-auto max-w-7xl px-4 md:px-10 w-full">
            {/* Calendar View (Monthly) */}
          <section className="mt-4 px-4 md:px-margin-screen lg:px-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <h2 className="font-headline-sm text-base md:text-headline-sm text-on-surface">ปฏิทินการจอง (Calendar)</h2>
              </div>
              <span className="rounded-full bg-surface-container-high px-3 py-1 font-label-md text-[11px] text-on-surface md:text-label-md">
                {new Date().toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })}
              </span>
            </div>
            
            <div className="bg-surface-container-lowest rounded-2xl p-4 shadow-sm ring-1 ring-outline-variant/30">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'].map(day => (
                  <div key={day} className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant font-bold">
                    {day}
                  </div>
                ))}
              </div>
              
              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1 sm:gap-2">
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth(), 1).getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                
                {Array.from({ length: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate() }).map((_, i) => {
                  const date = i + 1;
                  const today = new Date().getDate();
                  const isToday = date === today;
                  const isPast = date < today;
                  const isFuture = date > today;
                  
                  return (
                    <button
                      key={date}
                      disabled={!isToday}
                      className={`
                        flex flex-col items-center justify-center py-1.5 sm:py-2 rounded-xl transition-all
                        ${isToday ? 'bg-primary text-on-primary font-bold shadow-[0_4px_12px_rgba(255,94,30,0.3)] ring-2 ring-primary scale-105 z-10' : ''}
                        ${isPast ? 'text-on-surface-variant/30 bg-surface/50 cursor-not-allowed' : ''}
                        ${isFuture ? 'text-on-surface-variant/50 bg-surface-container-low cursor-not-allowed' : ''}
                      `}
                    >
                      <span className="text-[12px] sm:text-[14px]">{date}</span>
                      {isToday && <span className="text-[8px] sm:text-[10px] font-medium uppercase mt-0.5 opacity-90">วันนี้</span>}
                    </button>
                  );
                })}
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
                  <span className="font-body-sm text-body-sm text-on-surface-variant">สวมรองเท้าแบดมินตันพื้นยางดิบ (Non-marking) เท่านั้น</span>
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
