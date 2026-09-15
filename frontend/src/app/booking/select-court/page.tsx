'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';

function SelectCourtContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [displayDateStr, setDisplayDateStr] = useState<string>('');

  useEffect(() => {
    if (!dateParam || !timeParam) {
      router.push('/booking');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Format the date string for display
    const dateObj = new Date(dateParam);
    const thaiDays = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
    const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
    const formattedStr = `${thaiDays[dateObj.getDay()]} ${dateObj.getDate()} ${thaiMonths[dateObj.getMonth()]} • ${timeParam} - ${String(parseInt(timeParam.split(':')[0]) + 1).padStart(2, '0')}:00 น.`;
    setDisplayDateStr(formattedStr);

    fetchAvailability(dateParam);
  }, [dateParam, timeParam, router]);

  const fetchAvailability = async (dateStr: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/courts/availability?date=${dateStr}`);
      setCourts(response.data);
    } catch (err) {
      toast.error('Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const isCourtBookedForSelectedTime = (court: any) => {
    if (!timeParam) return false;
    const formattedTime = timeParam + ':00';
    return court.bookings?.some((b: any) =>
      b.start_time === formattedTime && (b.status === 'PENDING' || b.status === 'CHECKED_IN')
    );
  };

  const handleBook = async (courtId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (!timeParam || !dateParam) {
      toast.error('Missing date or time parameters');
      return;
    }

    const btn = e.currentTarget;
    const originalContent = btn.innerHTML;

    setBookingLoading(true);
    // UI Tactile Feedback
    btn.innerHTML = '<span class="material-symbols-outlined text-[18px] animate-spin">sync</span><span>กำลังบันทึก...</span>';
    
    try {
      await api.post('/bookings', {
        courtId,
        date: dateParam,
        startTime: timeParam + ':00'
      });
      
      // Success feedback on button
      btn.classList.remove('bg-surface-container-high', 'text-on-surface', 'bg-primary-container', 'text-on-primary');
      btn.classList.add('bg-secondary', 'text-on-secondary');
      btn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check_circle</span><span>จองสำเร็จแล้ว</span>';
      
      toast.success('Court booked successfully!');
      
      // Delay redirect slightly so user sees the success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
      
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book court');
      btn.innerHTML = originalContent;
      setBookingLoading(false);
      fetchAvailability(dateParam); // refresh in case it got booked
    }
  };

  const availableCourtsCount = timeParam ? courts.filter(c => !isCourtBookedForSelectedTime(c)).length : 0;
  const totalCourts = courts.length;

  return (
    <MainLayout>
      <main className="flex flex-col relative w-full pb-6 bg-surface min-h-screen">
        <div className="flex flex-col w-full px-4 md:px-margin-screen gap-4 md:gap-gutter-lg pb-6 mt-4">
          
          {/* Booking Session Context Bar */}
          <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 md:px-card-padding py-2 md:py-gutter-sm shadow-sm gap-2">
            <div className="flex items-center gap-2 md:gap-gutter-sm min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant font-medium truncate">รอบเวลาที่คุณเลือก</span>
                <span className="font-label-lg text-[12px] md:text-label-lg text-on-surface font-bold truncate">{displayDateStr}</span>
              </div>
            </div>
            <button onClick={() => router.push('/booking')} className="flex items-center justify-center gap-1 px-3 py-1.5 md:px-gutter-sm md:py-1 rounded-full bg-surface-container text-primary font-label-md text-[11px] md:text-label-md shrink-0 hover:bg-surface-container-high active:scale-95 transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
              <span className="hidden sm:inline">เปลี่ยนเวลา</span>
            </button>
          </div>

          {/* Page Title & Micro Filter */}
          <div className="flex flex-col gap-2 md:gap-gutter-sm">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="font-headline-md text-lg md:text-headline-md text-on-surface tracking-tight truncate">เลือกสนามที่ว่าง</h1>
              <span className="font-label-sm text-[10px] md:text-label-sm text-secondary font-bold bg-secondary-container/30 px-2 py-0.5 rounded-full shrink-0">{availableCourtsCount} คอร์ทพร้อมใช้</span>
            </div>
            <p className="font-body-sm text-[11px] md:text-body-sm text-on-surface-variant">ระบบสำรองคอร์ท อาคารยิมเนเซียม 1 KMITL ทั้งหมด {totalCourts} คอร์ท สำหรับรอบที่คุณเลือก</p>
            
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-hide -mx-4 px-4 md:-mx-margin-screen md:px-margin-screen">
              <button className="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-label-md text-[11px] md:text-label-md shadow-sm shrink-0 flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px]">sports_tennis</span>
                <span>อาคารยิมเนเซียม 1 (ทั้งหมด {totalCourts} คอร์ท)</span>
              </button>
              <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[11px] md:text-label-md shrink-0 flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>โควตานักศึกษา KMITL ฟรีทุกคอร์ท</span>
              </span>
            </div>
          </div>

          {/* Courts List */}
          <div className="flex flex-col gap-4 md:gap-gutter-md">
            {loading ? (
              <p className="text-on-surface-variant text-sm py-4 text-center">Loading courts...</p>
            ) : courts.map((court, index) => {
              const isBooked = isCourtBookedForSelectedTime(court);
              
              // Map mock images based on index
              const courtImages = [
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLmI6WJ6HB7dipoImcI-yYTXW-pTMMJPHjtXgcmMe9wvsgU2-xjBg_wPPPeZCcalvIExmqUwlv6AWtgDrqlkpGH8DPejWjmANIiQmtwaymgJpRVaO3ot2_qJogEGlATnn98Hmv03bhA6vOw7yrteDkYf34SM9vknS5WbX2CJ8r_2JoMn0JhvvopneUB7bM-_929oCXGhLhTjC-dgIou98mcCQpG4ZlivUgLhAJIUP09EpoLEd3LcO",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCBYUbU_WdVKEifnxDG32AtMOD8jd6gHx6Mr9D2k1QDOnaH_dogMdf14FnilKm5690ke0x2zx1RkDRo_4Z4WjXFAsDVTSE7DjEcsIFAld9-ztK5qN3kwQBKdRcJLeJ4BPcJDqPMOS8fEkA7zGhqvGT4uqM5UoBQY4hNXgkXBU6sC8quyjAgOf0h203Z2imr-oKgKWSdTX8xzmHo7Cm4O77i_KyiwBtSDzwaFKXwIjpKA_2fQCwIkYmk",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q"
              ];
              const imageSrc = courtImages[index % courtImages.length];

              const locations = [
                "KMITL Sports Hall • Main",
                "KMITL Sports Hall • West",
                "อาคารยิมเนเซียม 1 • East",
                "อาคารยิมเนเซียม 1 • North"
              ];
              const locationText = locations[index % locations.length];

              return (
                <div key={court.id} className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md ${isBooked ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  <div className="relative h-36 md:h-44 w-full">
                    <img className="w-full h-full object-cover" src={imageSrc} alt={`Court ${court.name}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-on-background/60 via-transparent to-transparent"></div>
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-1.5 items-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[9px] md:text-label-sm font-bold shadow-sm backdrop-blur-md ${isBooked ? 'bg-surface-container-high/95 text-on-surface-variant' : 'bg-secondary-container/95 text-on-secondary-container'}`}>
                        {!isBooked && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>}
                        {isBooked ? 'จองแล้ว' : 'พร้อมใช้งาน'}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container-lowest/90 text-on-surface-variant font-label-sm text-[9px] md:text-label-sm backdrop-blur-md">
                        ในร่ม (Indoor)
                      </span>
                    </div>
                    <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3 flex items-end justify-between text-on-primary">
                      <div>
                        <span className="font-label-sm text-[10px] md:text-label-sm opacity-90 block truncate max-w-[180px]">{locationText}</span>
                        <h2 className="font-headline-sm text-base md:text-headline-sm text-on-primary font-bold drop-shadow-sm truncate">{court.name}</h2>
                      </div>
                      <div className="bg-secondary-fixed/95 text-on-secondary-fixed px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg font-label-md text-[10px] md:text-label-md font-bold text-center backdrop-blur-sm shadow-sm shrink-0">
                        FREE
                      </div>
                    </div>
                  </div>
                  <div className="p-3 md:p-card-padding flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-lowest">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[11px] md:text-label-sm text-secondary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        สิทธิ์นักศึกษา KMITL
                      </span>
                      <span className="font-body-sm text-[10px] md:text-body-sm text-on-surface-variant">โควตานักศึกษาฟรี 1 ชม./วัน</span>
                    </div>
                    <button 
                      disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                      onClick={(e) => handleBook(court.id, e)}
                      className={`court-select-btn w-full sm:w-auto justify-center px-4 py-2.5 rounded-lg font-label-lg text-[13px] md:text-label-lg shadow-md active:scale-95 transition-all shrink-0 flex items-center gap-1.5 ${isBooked ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed shadow-none' : (index === 0 ? 'bg-primary-container text-on-primary hover:bg-primary' : 'bg-surface-container-high text-on-surface hover:bg-primary-container hover:text-on-primary')}`} 
                      type="button"
                    >
                      <span>{isBooked ? 'คอร์ทไม่ว่าง' : 'ยืนยันจองคอร์ทนี้'}</span>
                      {!isBooked && <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_forward</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delightful Information Banner & Reminder */}
          <div className="flex items-start gap-3 bg-surface-container-high rounded-xl p-3 md:p-card-padding mt-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-label-md text-[11px] md:text-label-md text-on-surface font-bold">ข้อควรทราบก่อนลงสนาม</span>
              <p className="font-body-sm text-[10px] md:text-body-sm text-on-surface-variant">
                กรุณาเช็คอินที่จุดสแกนหน้าคอร์ทก่อนเวลา <span className="font-semibold text-primary">10 นาที</span> พร้อมแสดงบัตรนักศึกษาหรือ QR Code ประจำการจองเพื่อเปิดระบบไฟสนาม
              </p>
            </div>
          </div>

        </div>
      </main>


    </MainLayout>
  );
}

export default function SelectCourtPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SelectCourtContent />
    </Suspense>
  );
}
