'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import { generateHourlySlots, isSlotInPast } from '@/lib/time';

export default function BookingPage() {
  const router = useRouter();

  // States
  const [dates, setDates] = useState<{ date: string, day: string, num: string, fullMonth: string }[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate next 7 days for horizontal calendar
  useEffect(() => {
    const today = new Date();
    const generatedDates = [];
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัส', 'ศุกร์', 'เสาร์'];
    
    // Generate only today for day-by-day booking policy, or next 7 days if you want
    for (let i = 0; i < 7; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      generatedDates.push({
        date: nextDate.toISOString().split('T')[0],
        day: thaiDays[nextDate.getDay()],
        num: nextDate.getDate().toString(),
        fullMonth: nextDate.toLocaleDateString('th-TH', { month: 'long', year: 'numeric' })
      });
    }
    setDates(generatedDates);
    setSelectedDate(generatedDates[0].date);
  }, []);

  // Time slots from 06:00 to 21:00
  const timeSlots = generateHourlySlots(6, 16);

  // Fetch availability when date changes
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    if (selectedDate) {
      fetchAvailability(selectedDate);
    }
  }, [selectedDate]);

  const fetchAvailability = async (dateStr: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/courts/availability?date=${dateStr}`);
      setCourts(response.data);
      setSelectedTime(''); // Reset time when date changes
    } catch (err) {
      toast.error('Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const isTimeFullyBooked = (time: string) => {
    if (!courts.length) return false;
    const formattedTime = time + ':00';
    // If all courts have this time booked with an active status, it's fully booked
    return courts.every(c => c.bookings?.some((b: any) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    ));
  };

  const isTimeInPast = (timeStr: string) => isSlotInPast(selectedDate, timeStr);

  const handleNext = () => {
    if (!selectedTime) {
      toast.error('กรุณาเลือกรอบเวลาก่อนทำรายการ');
      return;
    }
    router.push(`/booking/select-court?date=${selectedDate}&time=${selectedTime}`);
  };

  // Find the selected date object for the display
  const activeDateObj = dates.find(d => d.date === selectedDate);
  const displayMonth = activeDateObj ? activeDateObj.fullMonth : '';
  const displayDateStr = activeDateObj && selectedTime 
    ? `${activeDateObj.day} ${activeDateObj.num} ${displayMonth.split(' ')[0]} • ${selectedTime} - ${String(parseInt(selectedTime.split(':')[0]) + 1).padStart(2, '0')}:00 น.` 
    : '';
  
  // Calculate available courts for selected time
  const availableCourtsCount = selectedTime ? courts.filter(c => {
    const formattedTime = selectedTime + ':00';
    const isBooked = c.bookings?.some((b: any) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    );
    return !isBooked;
  }).length : 0;

  return (
    <MainLayout>
      <main className="flex flex-col relative w-full pb-6 bg-surface min-h-screen">
        <div className="flex flex-col w-full pb-8">
          {/* Campus Sports Arena Context Card */}
          <section className="px-4 md:px-margin-screen pt-4 pb-2">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-surface-container-low to-surface-container-high p-4 md:p-card-padding shadow-sm">
              <div className="absolute -right-6 -bottom-6 w-28 h-28 bg-primary-container/10 rounded-full blur-2xl pointer-events-none"></div>
              <div className="flex items-start justify-between relative z-10 gap-2">
                <div className="flex flex-col min-w-0">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary w-fit mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse shrink-0"></span>
                    <span className="font-label-sm text-[9px] md:text-label-sm uppercase tracking-wide truncate">เปิดให้บริการปกติ</span>
                  </div>
                  <h1 className="font-headline-sm text-lg md:text-headline-sm text-on-surface truncate">จองคอร์ทแบดมินตัน</h1>
                  <p className="font-body-sm text-[11px] md:text-body-sm text-on-surface-variant flex items-center gap-1 mt-0.5 truncate">
                    <span className="material-symbols-outlined text-[15px] text-primary shrink-0">stadium</span>
                    <span className="truncate">อาคารยิมเนเซียม 1 (Gymnasium 1) • วิทยาเขตลาดกระบัง</span>
                  </p>
                </div>
                <div className="flex flex-col items-end shrink-0">
                  <div className="px-2 py-1 md:px-2.5 rounded-xl bg-surface-container-lowest shadow-sm flex items-center gap-1">
                    <span className="material-symbols-outlined text-[14px] md:text-[16px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span className="font-label-sm text-[9px] md:text-label-sm text-on-surface font-semibold">โควตา นศ.</span>
                  </div>
                  <span className="font-label-sm text-[9px] md:text-label-sm text-secondary font-bold mt-1">คงเหลือ 1 ชม./วัน</span>
                </div>
              </div>
            </div>
          </section>

          {/* Interactive Date Horizon */}
          <section className="mt-4 px-4 md:px-margin-screen">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-primary text-[20px]">calendar_month</span>
                <h2 className="font-headline-sm text-base md:text-headline-sm text-on-surface">เลือกวันที่ (Date)</h2>
              </div>
              <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-high text-on-surface font-label-md text-[11px] md:text-label-md">
                <span>{displayMonth}</span>
                <span className="material-symbols-outlined text-[16px]">expand_more</span>
              </div>
            </div>
            {/* Date Pills Scrollable Container */}
            <div className="flex items-center gap-2.5 overflow-x-auto scrollbar-hide py-1 -mx-4 px-4 md:-mx-margin-screen md:px-margin-screen">
              {dates.map((d) => {
                const isActive = selectedDate === d.date;
                return (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDate(d.date)}
                    className={`date-chip flex flex-col items-center justify-center min-w-[56px] md:min-w-[62px] h-[72px] md:h-[78px] rounded-2xl shadow-sm transform active:scale-95 transition-all shrink-0 ${
                      isActive 
                        ? 'bg-gradient-to-b from-primary-container to-primary text-on-primary shadow-[0_8px_20px_-4px_rgba(255,94,30,0.4)]' 
                        : 'bg-surface-container-lowest text-on-surface hover:bg-surface-container-high'
                    }`}
                    type="button"
                  >
                    <span className={isActive ? 'font-label-sm text-[9px] md:text-label-sm tracking-wider uppercase opacity-90' : 'font-label-sm text-[9px] md:text-label-sm text-on-surface-variant uppercase'}>
                      {d.day}
                    </span>
                    <span className="font-headline-md text-[18px] md:text-headline-md font-bold mt-0.5">{d.num}</span>
                    <div className={`w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mt-1 ${isActive ? 'bg-on-primary' : 'bg-secondary'}`}></div>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Time Slots Matrix */}
          <section className="mt-6 px-4 md:px-margin-screen">
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
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 md:gap-slot-grid-gap">
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
            <div className="px-margin-screen mt-6 mb-2">
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
          <div className="px-margin-screen mt-2 mb-2">
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
      </main>
    </MainLayout>
  );
}
