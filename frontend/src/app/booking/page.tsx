'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function BookingPage() {
  const router = useRouter();

  // States
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [dates, setDates] = useState<{ date: string, day: string, num: string }[]>([]);
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

  // Time slots from 06:00 to 23:00
  const timeSlots = Array.from({ length: 18 }, (_, i) => {
    return `${(i + 6).toString().padStart(2, '0')}:00`;
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
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book court');
    } finally {
      setBookingLoading(false);
      fetchAvailability(selectedDate);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-[#2a1300] dark:via-[#140900] dark:to-[#2a1300] text-on-surface dark:text-orange-50 antialiased min-h-screen flex flex-col pt-24 pb-24 selection:bg-primary selection:text-white font-sans relative overflow-hidden transition-colors duration-300">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
        <div className="absolute top-[30%] right-[-10%] w-[400px] h-[400px] bg-yellow-200/50 dark:bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
        <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
      </div>

      {/* TopAppBar */}
      <div className="fixed top-0 w-full z-50 shadow-sm">
        <header className="bg-[#F26522] dark:bg-[#C24500] flex justify-between items-center px-container-padding h-16 text-white shadow-sm transition-colors duration-300">
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
            <img alt="KMITL Badminton Logo" className="h-10 w-10 rounded-full bg-white p-0.5 object-cover shadow-sm" src="/kmitl-logo.png" />
            <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
          </div>
          <div className="flex items-center gap-1">

            <button className="w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={() => router.push('/dashboard')}>
              <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>home</span>
            </button>
            <button className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
          </div>
        </header>
        <div className="bg-[#545454] dark:bg-[#1a0a00] h-8 flex items-center px-container-padding text-white font-body-md text-[12px] md:text-[14px] transition-colors duration-300">
          สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
        </div>
      </div>

      <main className="flex-grow w-full max-w-3xl mx-auto px-container-padding flex flex-col gap-8 relative z-10">

        {/* Header Section */}
        <section className="px-container-padding mt-6 mb-2">
          <h1 className="font-display-lg text-[32px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 drop-shadow-sm tracking-tight transition-colors duration-300">Reserve a Court</h1>
          <p className="font-body-lg text-[15px] text-gray-600 dark:text-orange-200/70 font-medium transition-colors duration-300 leading-relaxed">
            Select your preferred date, time, and court to start playing.
          </p>
        </section>

        {/* Date Selector (Horizontal Calendar) */}
        <section>
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-headline-md text-[22px] font-extrabold text-gray-900 dark:text-orange-50 transition-colors duration-300">Date</h2>
            <span className="font-label-md text-[13px] font-bold text-primary uppercase bg-white/80 dark:bg-[#1a0a00]/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm border border-white dark:border-[#ff6b00]/30 transition-colors duration-300">
              {new Date(selectedDate || Date.now()).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 snap-x scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
            {dates.map((d, index) => {
              const isActive = selectedDate === d.date;
              return (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex flex-col items-center justify-center min-w-[75px] h-24 rounded-2xl snap-center shrink-0 transition-all duration-300 border backdrop-blur-sm ${isActive
                    ? 'bg-gradient-to-br from-primary to-[#E55B13] text-white border-transparent shadow-[0_4px_8px_rgba(255,107,0,0.15)] transform -translate-y-0.5'
                    : 'bg-white/70 dark:bg-[#2a1300]/60 border-white dark:border-[#ff6b00]/20 text-gray-700 dark:text-orange-200 hover:bg-white dark:hover:bg-[#3a1b00] hover:shadow-sm'
                    }`}
                >
                  <span className={`font-label-md text-[13px] uppercase mb-1 font-bold ${isActive ? 'text-white/90' : 'text-gray-500 dark:text-orange-300/60'}`}>{d.day}</span>
                  <span className={`font-headline-md text-[24px] font-black ${isActive ? 'text-white' : 'text-gray-900 dark:text-orange-50'}`}>{d.num}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* Time Slots */}
        <section>
          <h2 className="font-headline-md text-[22px] font-extrabold mb-4 text-gray-900 dark:text-orange-50 transition-colors duration-300">Time Slots</h2>
          {loading ? (
            <p className="text-on-surface-variant text-sm">Loading times...</p>
          ) : (
            <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
              {timeSlots.map(time => {
                const isFullyBooked = isTimeFullyBooked(time);
                const isSelected = selectedTime === time;

                if (isFullyBooked) {
                  return (
                    <button key={time} disabled className="py-3 px-2 rounded-xl bg-gray-200/50 dark:bg-[#3a1b00]/50 border border-gray-300/50 dark:border-[#ff6b00]/20 opacity-60 cursor-not-allowed flex items-center justify-center gap-1 relative overflow-hidden transition-colors duration-300">
                      <span className="font-body-md text-[15px] font-semibold text-gray-500 dark:text-orange-300/50 line-through transition-colors duration-300">{time}</span>
                    </button>
                  );
                }

                return (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-3 px-2 rounded-xl flex items-center justify-center transition-all duration-300 font-medium text-[15px] border backdrop-blur-sm ${isSelected
                      ? 'bg-gradient-to-br from-primary to-[#E55B13] text-white shadow-[0_6px_16px_rgba(255,107,0,0.4)] border-transparent transform -translate-y-0.5'
                      : 'bg-white/60 dark:bg-[#1a0a00]/60 border-white dark:border-[#ff6b00]/30 text-gray-700 dark:text-orange-200 hover:bg-white/90 dark:hover:bg-[#2a1300] hover:shadow-md hover:border-primary/30 dark:hover:border-primary/50'
                      }`}
                  >
                    <span className={`font-body-md text-[15px] ${isSelected ? 'font-bold' : 'font-semibold'}`}>{time}</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* Court Selection */}
        <section>
          <h2 className="font-headline-md text-[20px] font-semibold mb-4 text-gray-900 dark:text-orange-50 transition-colors duration-300">Available Courts</h2>

          {!selectedTime && (
            <div className="p-4 bg-white/50 dark:bg-[#2a1300]/50 border border-gray-200/50 dark:border-[#ff6b00]/20 rounded-xl text-center text-gray-500 dark:text-orange-200/70 transition-colors duration-300">
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
                    <div key={court.id} className={`group relative rounded-3xl overflow-hidden bg-white/70 dark:bg-[#1a0a00]/70 backdrop-blur-xl border-2 ${isBooked ? 'border-gray-200 dark:border-[#2a1300] opacity-60' : 'border-white dark:border-[#ff6b00]/30 hover:border-primary/40 dark:hover:border-primary/60 shadow-[0_12px_32px_rgba(0,0,0,0.08)] hover:shadow-[0_16px_48px_rgba(255,107,0,0.12)]'} transition-all duration-500 transform ${!isBooked && 'hover:-translate-y-1'}`}>
                      <div className="h-56 w-full relative">
                        <img className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlv85Ujefo4LbDgoUY4F4dsbrTyG2TghyekyI9vwKhgxG38nziYzECIjwK0fBMXAQpZBNOYY3SlOtWlI-JK2QAcs40vdjkShWG7_5tjvsZrMxmgwkEx-AVsJvFCaFTsBXLEukXNeGR1Yrp-Z8PWg7SgyyxB296wmCSsDgiieR-SYbNoZSWQZICGtyyehykB5Lb_eLQoQF4DT4mKmz4wE1yAUpqz3rQZfhlgKT44LlDuKpI-d4E0TbbpQ" alt="Premium Court" />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/20 to-transparent"></div>
                        <div className="absolute top-4 right-4 bg-white/90 dark:bg-[#140900]/90 backdrop-blur-md px-3 py-1.5 rounded-full text-primary font-label-md text-[13px] font-extrabold border border-white dark:border-[#ff6b00]/40 shadow-lg tracking-wider transition-colors duration-300">
                          PRO TIER
                        </div>
                      </div>
                      <div className="p-6 relative flex justify-between items-end bg-white/40 dark:bg-[#140900]/40 transition-colors duration-300">
                        <div>
                          <h3 className="font-headline-md text-[24px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 drop-shadow-sm transition-colors duration-300">{court.name}</h3>
                          <div className="flex items-center gap-2 text-gray-600 dark:text-orange-200/70 font-body-md text-[15px] font-medium transition-colors duration-300">
                            <span className="material-symbols-outlined text-[18px]">sports_gymnastics</span>
                            <span>Wooden Sprung Floor</span>
                          </div>
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          <div className="flex flex-col items-end gap-0.5">
                            <div className="font-display-sm text-[28px] font-black text-emerald-600 dark:text-emerald-400 transition-colors duration-300 uppercase tracking-tight">Free</div>
                            <div className="text-[11px] font-bold text-gray-500 dark:text-orange-300/80 bg-gray-100 dark:bg-[#3a1b00]/80 px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#ff6b00]/20">1 hr / day max</div>
                          </div>
                          <button
                            disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                            onClick={() => handleBook(court.id)}
                            className={`px-6 py-2.5 rounded-xl font-button text-[16px] font-bold transition-all duration-300 active:scale-95 ${isBooked
                              ? 'bg-gray-200 dark:bg-[#3a1b00] text-gray-500 dark:text-orange-300/50 cursor-not-allowed'
                              : 'bg-gradient-to-r from-primary to-[#E55B13] text-white hover:shadow-[0_8px_20px_rgba(255,107,0,0.4)] hover:-translate-y-0.5'
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
                  <div key={court.id} className={`group relative rounded-3xl overflow-hidden bg-white/70 dark:bg-[#1a0a00]/70 backdrop-blur-xl border-2 ${isBooked ? 'border-gray-200 dark:border-[#2a1300] opacity-60' : 'border-white dark:border-[#ff6b00]/30 hover:border-primary/30 dark:hover:border-primary/50 shadow-[0_8px_24px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.1)]'} transition-all duration-500 flex flex-col sm:flex-row transform ${!isBooked && 'hover:-translate-y-1'}`}>
                    <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden">
                      <img className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-105" src={index % 2 === 0 ? "https://lh3.googleusercontent.com/aida-public/AB6AXuDZxYRA_Mll_KqyTaSJjBkB7TOcBRT9FkZjqOs8kxnj9dy5YOCEzgfc1e1eQ8pxNWfR2OA_dcljj9z68srM3Z12pWAZzDxc0IJAsDwyrE0VlK-MTqlDQ3-KldTJ9qpLJ11HgHNNavMQ67mINC3SL12rIsf0oDAOru5Hxa32xfyp1-8B0cbdiZph--nGQqZaguxMbSuT40NwPL_ygf1Ox1p7zcBIlL7geO6skgsQh0DwKpaiPw4E5LDO0w" : "https://lh3.googleusercontent.com/aida-public/AB6AXuClklh1l82ImMLEWFHMinGs1JgKfVQ5h7G4MXQ1UceGCrh7o20G0wW869g41CZ62XgSWTgNOCbzD0TD6TyvcNGsgu-qhXsxtJYj1eJDX_9Qvxkd9Ko_ora5MEw7cNz6oGGhE7ieiUkZI_k9MyTa0mZjAZqmOtvTAq0vaprYIHEA9r5BQWKk3wzlU8yzgRZ1CEaDtCL-UrJsBfYFey7l7W73YmgRvTIUCD5xQV4UnyMV0A_1cdWaGfEqgQ"} alt="Standard Court" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 to-transparent sm:hidden"></div>
                    </div>
                    <div className="w-full sm:w-3/5 p-6 flex flex-row justify-between items-center bg-white/40 dark:bg-[#140900]/40 transition-colors duration-300">
                      <div>
                        <h3 className="font-headline-md text-[22px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 transition-colors duration-300">{court.name}</h3>
                        <div className="flex items-center gap-2 text-gray-600 dark:text-orange-200/70 font-body-md text-[14px] font-medium transition-colors duration-300">
                          <span className="material-symbols-outlined text-[18px]">layers</span>
                          <span>Synthetic Mat</span>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="font-headline-md text-[24px] font-black text-emerald-600 dark:text-emerald-400 transition-colors duration-300 uppercase tracking-tight">Free</div>
                          <div className="text-[11px] font-bold text-gray-500 dark:text-orange-300/80 bg-gray-100 dark:bg-[#3a1b00]/80 px-2 py-0.5 rounded-md border border-gray-200 dark:border-[#ff6b00]/20">1 hr / day max</div>
                        </div>
                        <button
                          disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                          onClick={() => handleBook(court.id)}
                          className={`px-6 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all duration-300 active:scale-95 ${isBooked
                            ? 'bg-gray-200 dark:bg-[#3a1b00] text-gray-500 dark:text-orange-300/50 cursor-not-allowed'
                            : 'bg-white dark:bg-[#2a1300] border-2 border-primary text-primary hover:bg-primary hover:text-white hover:shadow-[0_4px_12px_rgba(255,107,0,0.3)]'
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
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-white/90 dark:bg-[#140900]/95 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-[#ff6b00]/20 transition-colors duration-300">
        <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>sports_tennis</span>
          <span className="font-label-md text-[12px] font-semibold tracking-wide">Home</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>event_note</span>
          <span className="font-label-md text-[12px] font-semibold tracking-wide">Bookings</span>
        </button>
        <button onClick={() => router.push('/scan')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>qr_code_scanner</span>
          <span className="font-label-md text-[12px] font-semibold tracking-wide">Scan</span>
        </button>
        <button onClick={() => router.push('/news')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>article</span>
          <span className="font-label-md text-[12px] font-semibold tracking-wide">News</span>
        </button>
      </nav>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[280px] bg-white dark:bg-[#140900] h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-display-sm text-[20px] font-bold dark:text-orange-50 text-gray-900">KMITL PCC Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <button onClick={() => { setIsSidebarOpen(false); router.push('/dashboard'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Home</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/booking'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Book Courts</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/scan'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Scan QR</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/news'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">News <span className="w-2 h-2 rounded-full bg-green-500 inline-block ml-1"></span></button>
              </div>
              
              <div>
                <h3 className="font-bold text-[18px] text-gray-900 dark:text-orange-50 mb-3">Settings</h3>
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-gray-200 dark:border-gray-800">
                  <div className="flex items-center justify-between text-[15px] text-gray-600 dark:text-gray-400 hover:text-primary">
                    <span>Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
