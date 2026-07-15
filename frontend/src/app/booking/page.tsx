'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function BookingPage() {
  const router = useRouter();
  
  // States
  const [dates, setDates] = useState<{date: string, day: string, num: string}[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Generate next 7 days for horizontal calendar
  useEffect(() => {
    const today = new Date();
    const generatedDates = [];
    // Generate only today for day-by-day booking policy
    for (let i = 0; i < 1; i++) {
      const nextDate = new Date(today);
      nextDate.setDate(today.getDate() + i);
      generatedDates.push({
        date: nextDate.toISOString().split('T')[0],
        day: nextDate.toLocaleDateString('en-US', { weekday: 'short' }),
        num: nextDate.getDate().toString()
      });
    }
    setDates(generatedDates);
    setSelectedDate(generatedDates[0].date);
  }, []);

  // Time slots from 09:00 to 21:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    return `${(i + 9).toString().padStart(2, '0')}:00`;
  });

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
    // If all courts have this time booked, it's fully booked
    return courts.every(c => c.bookings?.some((b: any) => b.start_time === formattedTime));
  };

  const isCourtBookedForSelectedTime = (court: any) => {
    if (!selectedTime) return false;
    const formattedTime = selectedTime + ':00';
    return court.bookings?.some((b: any) => b.start_time === formattedTime);
  };

  const handleBook = async (courtId: number) => {
    if (!selectedTime) {
      toast.error('Please select a time slot first');
      return;
    }
    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        courtId,
        date: selectedDate,
        startTime: selectedTime + ':00'
      });
      toast.success('Court booked successfully!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book court');
    } finally {
      setBookingLoading(false);
      fetchAvailability(selectedDate);
    }
  };

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col pt-16 pb-24 selection:bg-primary selection:text-white font-sans">
      
      {/* TopAppBar */}
      <header className="fixed top-0 w-full z-50 bg-background flex justify-between items-center px-container-padding h-16">
        <div className="flex items-center gap-sm cursor-pointer" onClick={() => router.push('/')}>
          <img alt="Apex Badminton Logo" className="h-8 w-8 rounded-full object-cover" src="/logo.jpg" onError={(e) => (e.target as HTMLImageElement).src="https://lh3.googleusercontent.com/aida-public/AB6AXuA9ufthUuxh5dWIL4bluPC_-EgGRKNDVZo_9zS-_3AX985RaArbVg6VZMOcfSjMTJt6s7yiLK0t07ZHyOwYmpcVpbt0I1G8nM3aNkXMsv_pm8SWQq-inB4F3ICF5Gg3nI-5k6_gdZiccWTAalrDuP2h-yBwN83Yxqs8PdB8nCH49-gR6e_g5NaDZfS2DavqyNfskg6Id8enrw3M608HilHt2Tm0RKYSy0FC9alKOa0Crgdlx0YpTsUlrQ"} />
          <span className="font-display-sm text-[24px] font-bold text-primary tracking-tight">APEX BADMINTON</span>
        </div>
        <button className="hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200" onClick={() => router.push('/')}>
          <span className="material-symbols-outlined text-primary font-headline-md text-[24px]" style={{fontVariationSettings: "'FILL' 0"}}>home</span>
        </button>
      </header>

      <main className="flex-grow w-full max-w-3xl mx-auto px-container-padding flex flex-col gap-6">
        
        {/* Header Section */}
        <section className="mt-4">
          <h1 className="font-display-lg text-[32px] font-bold text-white mb-2">Reserve a Court</h1>
          <p className="font-body-lg text-[16px] text-on-surface-variant">Select your preferred date, time, and court to start playing.</p>
        </section>

        {/* Date Selector (Horizontal Calendar) */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-md text-[20px] font-semibold text-white">Date</h2>
            <span className="font-label-md text-[12px] font-semibold text-primary uppercase">
              {new Date(selectedDate || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide" style={{scrollbarWidth: 'none'}}>
            {dates.map((d, index) => {
              const isActive = selectedDate === d.date;
              return (
                <button 
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex flex-col items-center justify-center min-w-[64px] h-20 rounded-lg snap-center shrink-0 transition-colors border ${
                    isActive 
                      ? 'bg-primary-container text-white shadow-[0_0_15px_rgba(255,107,0,0.3)] border-transparent' 
                      : 'bg-surface-container hover:bg-surface-container-high border-outline-variant/30 text-on-surface-variant'
                  }`}
                >
                  <span className={`font-label-md text-[12px] uppercase mb-1 ${isActive ? 'text-white/90' : ''}`}>{d.day}</span>
                  <span className={`font-headline-md text-[20px] font-bold ${isActive ? 'text-white' : 'text-white'}`}>{d.num}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time Slots */}
        <section>
          <h2 className="font-headline-md text-[20px] font-semibold text-white mb-4">Time Slots</h2>
          {loading ? (
             <p className="text-on-surface-variant text-sm">Loading times...</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {timeSlots.map(time => {
                const isFullyBooked = isTimeFullyBooked(time);
                const isSelected = selectedTime === time;

                if (isFullyBooked) {
                  return (
                    <button key={time} disabled className="py-2 px-1 rounded-md bg-surface-container opacity-30 cursor-not-allowed flex items-center justify-center gap-1 relative overflow-hidden">
                      <span className="font-body-md text-[14px] text-white line-through">{time}</span>
                    </button>
                  );
                }

                return (
                  <button 
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-2 px-1 rounded-md flex items-center justify-center transition-colors ${
                      isSelected 
                        ? 'bg-primary-container text-white shadow-[0_0_10px_rgba(255,107,0,0.4)]'
                        : 'bg-surface-container border border-outline-variant/30 hover:border-primary text-white'
                    }`}
                  >
                    <span className={`font-body-md text-[14px] ${isSelected ? 'font-bold' : ''}`}>{time}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Court Selection */}
        <section>
          <h2 className="font-headline-md text-[20px] font-semibold text-white mb-4">Available Courts</h2>
          
          {!selectedTime && (
            <div className="p-4 bg-surface-container border border-outline-variant/30 rounded-xl text-center text-on-surface-variant">
              Please select a time slot first to view available courts.
            </div>
          )}

          {selectedTime && (
            <div className="flex flex-col gap-4">
              {courts.map((court, index) => {
                const isBooked = isCourtBookedForSelectedTime(court);
                const isProTier = index === 0; // Just making Court 1 the PRO TIER based on template

                if (isProTier) {
                  return (
                    <div key={court.id} className={`group relative rounded-xl overflow-hidden bg-surface-container border ${isBooked ? 'border-surface-container-high opacity-50' : 'border-surface-container-high hover:border-primary/50'} transition-all duration-300`}>
                      <div className="h-48 w-full relative">
                        <img className="object-cover w-full h-full" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlv85Ujefo4LbDgoUY4F4dsbrTyG2TghyekyI9vwKhgxG38nziYzECIjwK0fBMXAQpZBNOYY3SlOtWlI-JK2QAcs40vdjkShWG7_5tjvsZrMxmgwkEx-AVsJvFCaFTsBXLEukXNeGR1Yrp-Z8PWg7SgyyxB296wmCSsDgiieR-SYbNoZSWQZICGtyyehykB5Lb_eLQoQF4DT4mKmz4wE1yAUpqz3rQZfhlgKT44LlDuKpI-d4E0TbbpQ" alt="Premium Court" />
                        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>
                        <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded text-primary font-label-md text-[12px] font-bold border border-primary/20">
                            PRO TIER
                        </div>
                      </div>
                      <div className="p-4 relative flex justify-between items-end">
                        <div>
                          <h3 className="font-headline-md text-[20px] font-bold text-white mb-1">{court.name}</h3>
                          <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-[14px]">
                            <span className="material-symbols-outlined text-[16px]">sports_gymnastics</span>
                            <span>Wooden Sprung Floor</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-display-sm text-[24px] font-bold text-white mb-1">$45<span className="text-body-md text-[14px] font-normal text-on-surface-variant">/hr</span></div>
                          <button 
                            disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                            onClick={() => handleBook(court.id)}
                            className={`px-4 py-2 rounded-md font-button text-[16px] font-semibold transition-colors active:scale-95 ${
                              isBooked 
                                ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                                : 'bg-primary-container text-white hover:bg-primary-container/90 shadow-[0_4px_14px_0_rgba(255,107,0,0.39)]'
                            }`}
                          >
                              {isBooked ? 'Unavailable' : 'Book Now'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div key={court.id} className={`group relative rounded-xl overflow-hidden bg-surface-container border ${isBooked ? 'border-surface-container-high opacity-50' : 'border-surface-container-high hover:border-primary/50'} transition-all duration-300 flex`}>
                    <div className="w-1/3 relative">
                      <img className="object-cover w-full h-full" src={index % 2 === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDZxYRA_Mll_KqyTaSJjBkB7TOcBRT9FkZjqOs8kxnj9dy5YOCEzgfc1e1eQ8pxNWfR2OA_dcljj9z68srM3Z12pWAZzDxc0IJAsDwyrE0VlK-MTqlDQ3-KldTJ9qpLJ11HgHNNavMQ67mINC3SL12rIsf0oDAOru5Hxa32xfyp1-8B0cbdiZph--nGQqZaguxMbSuT40NwPL_ygf1Ox1p7zcBIlL7geO6skgsQh0DwKpaiPw4E5LDO0w" : "https://lh3.googleusercontent.com/aida-public/AB6AXuClklh1l82ImMLEWFHMinGs1JgKfVQ5h7G4MXQ1UceGCrh7o20G0wW869g41CZ62XgSWTgNOCbzD0TD6TyvcNGsgu-qhXsxtJYj1eJDX_9Qvxkd9Ko_ora5MEw7cNz6oGGhE7ieiUkZI_k9MyTa0mZjAZqmOtvTAq0vaprYIHEA9r5BQWKk3wzlU8yzgRZ1CEaDtCL-UrJsBfYFey7l7W73YmgRvTIUCD5xQV4UnyMV0A_1cdWaGfEqgQ"} alt="Standard Court" />
                    </div>
                    <div className="w-2/3 p-4 flex justify-between items-center bg-surface-container">
                      <div>
                        <h3 className="font-headline-md text-[20px] font-bold text-white mb-1">{court.name}</h3>
                        <div className="flex items-center gap-2 text-on-surface-variant font-body-md text-[14px]">
                          <span className="material-symbols-outlined text-[16px]">layers</span>
                          <span>Synthetic Mat</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="font-headline-md text-[20px] font-bold text-white">$30<span className="text-body-md text-[14px] font-normal text-on-surface-variant">/hr</span></div>
                        <button 
                          disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                          onClick={() => handleBook(court.id)}
                          className={`px-4 py-2 rounded-md font-button text-[16px] font-semibold transition-colors active:scale-95 ${
                            isBooked
                              ? 'bg-surface-container-highest text-on-surface-variant cursor-not-allowed'
                              : 'bg-surface-container-highest border border-outline-variant text-white hover:border-primary hover:text-primary'
                          }`}
                        >
                            {isBooked ? 'Unavailable' : 'Select'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>
      
      {/* BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-surface-container/90 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.5)] border-t border-[#2A2A2A]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>sports_tennis</span>
          <span className="font-label-md text-[12px] font-semibold">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>event_note</span>
          <span className="font-label-md text-[12px] font-semibold">Bookings</span>
        </button>
        <button onClick={() => router.push('/scan')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>qr_code_scanner</span>
          <span className="font-label-md text-[12px] font-semibold">Scan</span>
        </button>
      </nav>
    </div>
  );
}
