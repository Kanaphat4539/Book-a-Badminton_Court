'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import MainLayout from '@/components/MainLayout';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number, name: string, username: string, role: string } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [bookingTimeRemaining, setBookingTimeRemaining] = useState<string>('--:--');
  const [mounted, setMounted] = useState(false);

  // Countdown timer for admin selected booking
  useEffect(() => {
    if (!selectedBooking || selectedBooking.status !== 'CHECKED_IN') return;

    const updateTimer = () => {
      const now = new Date();
      // Calculate 1 hour from start_time based on booking date
      // format is like booking_date "2026-07-17", start_time "23:00:00"
      const startTimeStr = `${selectedBooking.booking_date}T${selectedBooking.start_time}`;
      const startTime = new Date(startTimeStr);
      const endTime = new Date(startTime.getTime() + 60 * 60000); // 1 hour

      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setBookingTimeRemaining('00:00:00');
        return;
      }

      const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const m = Math.floor((diff / 1000 / 60) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setBookingTimeRemaining(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedBooking]);

  const handleFinishBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to finish this booking early?')) return;
    try {
      await api.post(`/bookings/${bookingId}/finish`);
      toast.success('Booking finished successfully');
      setSelectedBooking(null);
      fetchAllBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to finish booking');
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!token || !userStr) {
      router.push('/login');
      return;
    }

    const parsedUser = JSON.parse(userStr);
    setUser(parsedUser);

    if (parsedUser.role === 'ADMIN') {
      fetchAllBookings();
    } else {
      fetchBookings();
    }
  }, [router]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/me');
      setBookings(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setAllBookings(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await api.post(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled successfully');
      fetchBookings();
      if (user?.role === 'ADMIN') {
        fetchAllBookings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking');
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm('WARNING: Are you sure you want to reset the database? This will delete ALL bookings!')) return;
    if (!confirm('Are you ABSOLUTELY sure? This action cannot be undone.')) return;
    try {
      await api.post('/bookings/reset');
      toast.success('Database reset successfully');
      fetchAllBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to reset database');
    }
  };

  // Find active checked-in booking
  const activeBooking = bookings.find(b => b.status === 'CHECKED_IN');
  const pendingBooking = bookings.find(b => b.status === 'PENDING');

  useEffect(() => {
    let interval: any;
    if (activeBooking && user?.role !== 'ADMIN') {
      interval = setInterval(() => {
        const now = new Date();
        const endDateStr = `${activeBooking.booking_date}T${activeBooking.end_time}`;
        const endDate = new Date(endDateStr);
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('00:00');
          clearInterval(interval);
          fetchBookings();
        } else {
          const m = Math.floor(diff / 60000);
          const s = Math.floor((diff % 60000) / 1000);
          setTimeLeft(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBooking, user]);

  if (!mounted) return null;
  if (!user) return null;

  if (user.role === 'ADMIN') {
    return (
      <MainLayout>
        <div className="max-w-5xl mx-auto space-y-6 w-full px-4 md:px-margin-screen mt-4 relative z-10">
          <div className="flex justify-between items-center bg-surface-container-low p-6 rounded-3xl shadow-sm transition-colors duration-300">
            <div>
              <h1 className="font-headline-lg text-[28px] font-bold text-on-surface transition-colors duration-300">Admin Dashboard</h1>
              <p className="font-body-md text-[15px] text-on-surface-variant font-medium transition-colors duration-300">Manage courts and view all bookings</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                onClick={() => router.push('/admin/users')}
              >
                <span className="material-symbols-outlined text-[18px]">group</span>
                Manage Users
              </button>
            </div>
          </div>

          <section>
            <h2 className="font-headline-md text-[22px] font-extrabold mb-4 text-gray-900 dark:text-orange-50 transition-colors duration-300">All Bookings</h2>
            <div className="space-y-4">
              {allBookings.length === 0 && <p className="text-gray-500 dark:text-orange-200/70 font-medium text-[15px] bg-white/50 dark:bg-[#2a1300]/40 p-6 rounded-2xl text-center transition-colors duration-300">No bookings found.</p>}
              {allBookings.map(booking => (
                <div 
                  key={booking.id} 
                  className="bg-white/70 dark:bg-[#2a1300]/60 backdrop-blur-xl p-5 rounded-2xl flex justify-between items-center border border-white/60 dark:border-[#ff6b00]/20 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300 cursor-pointer"
                  onClick={() => setSelectedBooking(booking)}
                >
                  <div>
                    <p className="font-headline-md text-[18px] font-bold text-gray-900 dark:text-orange-50 transition-colors duration-300">{booking.user?.name} <span className="text-gray-500 dark:text-orange-300/60 font-semibold text-[14px]">(@{booking.user?.username})</span></p>
                    <p className="text-[15px] text-gray-600 dark:text-orange-200/70 mt-1 font-medium transition-colors duration-300">{booking.court?.name} • {booking.booking_date}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[16px] font-extrabold text-primary">{booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}</p>
                    <span className={`text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider ${booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700 border border-red-200' :
                        booking.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700 border border-blue-200' :
                          'bg-orange-100 text-orange-700 border border-orange-200'
                      }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Admin Booking Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={() => setSelectedBooking(null)}></div>
            <div className="relative bg-white dark:bg-[#1a0a00] w-full max-w-md rounded-3xl p-6 md:p-8 shadow-2xl border border-white/20 dark:border-[#ff6b00]/30 animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedBooking(null)} 
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
              
              <div className="text-center mb-6">
                <h3 className="font-display-sm text-[24px] font-bold text-gray-900 dark:text-orange-50 mb-1">Booking Details</h3>
                <p className="text-gray-500 dark:text-orange-200/70">{selectedBooking.user?.name} (@{selectedBooking.user?.username})</p>
                <p className="text-primary font-bold mt-1">{selectedBooking.court?.name} • {selectedBooking.start_time.slice(0,5)} - {selectedBooking.end_time.slice(0,5)}</p>
              </div>

              {selectedBooking.status === 'PENDING' && (() => {
                const now = new Date();
                const bookingDateTime = new Date(`${selectedBooking.booking_date}T${selectedBooking.start_time}`);
                const isEarly = now < bookingDateTime;

                return (
                  <div className="flex flex-col items-center gap-6 mt-4">
                    {isEarly ? (
                      <div className="bg-orange-50 dark:bg-[#3a1b00]/40 p-6 rounded-2xl border border-orange-100 dark:border-orange-900/50 w-full text-center">
                        <span className="material-symbols-outlined text-[48px] text-orange-400 mb-2">schedule</span>
                        <p className="text-sm font-bold text-orange-800 dark:text-orange-300">Too Early for Check-in</p>
                        <p className="text-xs text-orange-600 dark:text-orange-400 mt-2">
                          QR Code will be available when the booking time starts.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                          <QRCode 
                            value={selectedBooking.court?.id?.toString() || 'court'} 
                            size={200}
                            level="H"
                          />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-orange-200/80 text-center px-4">
                          Ask the user to scan this QR code with their app to check in and start their session.
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}

              {selectedBooking.status === 'CHECKED_IN' && (
                <div className="flex flex-col items-center gap-6 mt-4">
                  <div className="text-center p-6 bg-orange-50 dark:bg-[#3a1b00]/40 rounded-2xl border border-orange-100 dark:border-orange-900/50 w-full">
                    <p className="text-sm font-bold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-2">Time Remaining</p>
                    <p className="text-5xl font-mono font-bold text-gray-900 dark:text-white">{bookingTimeRemaining}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleFinishBooking(selectedBooking.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-3.5 rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined">stop_circle</span>
                    Finish Early
                  </button>
                </div>
              )}

              {(selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'CANCELLED') && (
                <div className="flex flex-col items-center gap-4 mt-6 p-6 bg-gray-50 dark:bg-[#2a1300]/50 rounded-2xl">
                  <span className="material-symbols-outlined text-[48px] text-gray-400 dark:text-gray-500">
                    {selectedBooking.status === 'COMPLETED' ? 'check_circle' : 'cancel'}
                  </span>
                  <p className="text-lg font-bold text-gray-700 dark:text-gray-300">
                    This booking is {selectedBooking.status.toLowerCase()}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="flex flex-col w-full pb-10">
        
        {/* Sporty Dynamic Ambient Backdrop */}
        <div className="relative w-full px-4 md:px-margin-screen pt-6 pb-6 mb-4 overflow-hidden rounded-b-[2.5rem] shadow-sm">
          <div className="absolute inset-0 bg-gradient-to-br from-[#F26522] via-[#ff7e22] to-yellow-500 z-0 opacity-90 dark:opacity-100"></div>
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20 z-0"></div>
          <div className="absolute -top-24 -right-10 w-64 h-64 bg-white/20 blur-3xl rounded-full z-0 pointer-events-none"></div>
          
          {/* User Welcome Greeting & Badges */}
          <div className="relative z-10 flex items-start justify-between gap-gutter-md">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 mb-1 bg-black/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
                <span className="inline-block w-2 h-2 rounded-full bg-green-400 animate-pulse shadow-[0_0_8px_#4ade80]"></span>
                <span className="font-label-sm text-[10px] text-white tracking-widest uppercase font-black">KMITL Sports Portal</span>
              </div>
              <h1 className="font-headline-lg text-[28px] md:text-[36px] text-white font-black tracking-tight flex items-center gap-2 drop-shadow-md">
                Hi, {user.name} <span className="text-3xl md:text-4xl animate-bounce">🏸</span>
              </h1>
              <p className="font-body-md text-[14px] md:text-[16px] text-white/90 font-medium mt-1">
                Welcome back to KMITL Badminton
              </p>
            </div>
            {/* Student Badge Avatar / Tier */}
            <div className="flex flex-col items-end">
              <span className="px-3 py-1.5 rounded-full bg-white text-[#F26522] font-label-sm text-[11px] font-black shadow-lg flex items-center gap-1 uppercase tracking-wider">
                <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content Flow */}
        <div className="px-4 md:px-margin-screen flex flex-col gap-6 mt-3">
          
          {/* 1. Upcoming Booking Card */}
          {pendingBooking ? (
            <section className="flex flex-col">
              <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-card-padding shadow-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-primary-fixed-dim/25 blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Upcoming Booking</h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">Your next court reservation</span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                    CONFIRMED
                  </span>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-semibold">Reserved Court</span>
                      <div className="font-headline-md text-headline-md text-primary-container font-extrabold flex items-center gap-1">
                        <span>{pendingBooking.court?.name}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary-container shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">stadium</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 bg-surface-container-lowest py-2 px-2.5 rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Time</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{pendingBooking.start_time.slice(0, 5)} - {pendingBooking.end_time.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest py-2 px-2.5 rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Date</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{pendingBooking.booking_date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-on-surface-variant pt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">pin_drop</span>
                    <span className="font-body-sm text-body-sm font-medium">Main Sports Complex • อาคารยิมเนเซียม 1</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2.5 mt-4">
                  <button 
                    onClick={() => router.push('/scan')}
                    className="col-span-3 h-12 rounded-xl bg-gradient-to-r from-primary-container to-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(255,94,30,0.32)] active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    <span>Check-in (เช็คอิน)</span>
                  </button>
                  <button 
                    onClick={() => handleCancelBooking(pendingBooking.id)}
                    className="col-span-2 h-12 rounded-xl bg-error-container text-on-error-container font-label-lg text-label-lg font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-opacity-90 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
            </section>
          ) : activeBooking ? (
            <section className="flex flex-col">
              <div className="bg-surface-container-lowest rounded-2xl p-4 md:p-card-padding shadow-md relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full bg-secondary/25 blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between mb-3.5">
                  <div className="flex flex-col">
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Currently Playing</h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">You are checked in</span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                    ACTIVE
                  </span>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-semibold">Active Court</span>
                      <div className="font-headline-md text-headline-md text-secondary font-extrabold flex items-center gap-1">
                        <span>{activeBooking.court?.name}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">stadium</span>
                    </div>
                  </div>
                  
                  <div className="text-center py-4 bg-surface-container-lowest rounded-lg shadow-sm border border-secondary/20">
                    <p className="font-label-sm text-[13px] font-bold text-on-surface-variant mb-1 tracking-widest">TIME REMAINING (ENDS AT {activeBooking.end_time.slice(0, 5)})</p>
                    <div className="font-headline-xl text-[48px] font-black text-secondary">
                      {timeLeft}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          ) : null}

          {/* 2. Quick Action Buttons */}
          <section className="grid grid-cols-2 gap-3">
            <div 
              onClick={() => router.push('/booking')}
              className="cursor-pointer group relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-container to-primary text-on-primary p-4 md:p-card-padding shadow-[0_8px_20px_rgba(255,94,30,0.28)] flex flex-col justify-between min-h-[140px] active:scale-[0.98] transition-transform"
            >
              <div className="absolute -right-3 -bottom-3 text-on-primary/15 pointer-events-none">
                <span className="material-symbols-outlined text-[84px] leading-none">sports_tennis</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-on-primary/20 backdrop-blur-md flex items-center justify-center shadow-inner">
                <span className="material-symbols-outlined text-[22px] text-on-primary">edit_calendar</span>
              </div>
              <div className="flex flex-col z-10 mt-3">
                <span className="font-headline-sm text-headline-sm font-extrabold leading-tight text-on-primary">Book Court</span>
                <span className="font-body-sm text-body-sm text-on-primary/80 font-medium">จองคอร์ทแบดมินตัน</span>
              </div>
            </div>

            <div 
              onClick={() => router.push('/scan')}
              className="cursor-pointer group relative overflow-hidden rounded-2xl bg-surface-container-lowest text-on-surface p-4 md:p-card-padding shadow-md flex flex-col justify-between min-h-[140px] active:scale-[0.98] transition-transform"
            >
              <div className="absolute -right-3 -bottom-3 text-surface-container-high/40 pointer-events-none">
                <span className="material-symbols-outlined text-[84px] leading-none">qr_code_2</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary-container">
                <span className="material-symbols-outlined text-[22px]" style={{ fontVariationSettings: "'FILL' 1" }}>qr_code_scanner</span>
              </div>
              <div className="flex flex-col z-10 mt-3">
                <span className="font-headline-sm text-headline-sm font-extrabold leading-tight text-on-surface">Scan QR</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">สแกนเข้าสนาม</span>
              </div>
            </div>
          </section>



          {/* 3. Recent Bookings Section */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">history</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">Recent Bookings</h2>
                <span className="font-body-sm text-body-sm text-on-surface-variant">(ประวัติการจอง)</span>
              </div>
              {bookings.length > 3 && (
                <button onClick={() => router.push('/booking')} className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-0.5">
                  <span>View all</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-2.5">
              {bookings.length === 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-6 text-center text-on-surface-variant">
                  <p className="font-body-md text-body-md font-medium">No bookings yet.</p>
                </div>
              )}
              {bookings.slice(0, 3).map(booking => {
                const isPending = booking.status === 'PENDING';
                const isCancelled = booking.status === 'CANCELLED';
                const isCompleted = booking.status === 'COMPLETED';
                const isCheckedIn = booking.status === 'CHECKED_IN';
                
                let accentColor = 'bg-primary-container';
                let iconColor = 'text-primary';
                let badgeClass = 'bg-primary-fixed text-on-primary-fixed';
                let statusIcon = 'sports_tennis';
                
                if (isCancelled) {
                  accentColor = 'bg-outline-variant';
                  iconColor = 'text-on-surface-variant';
                  badgeClass = 'bg-error-container text-on-error-container';
                  statusIcon = 'sports_tennis';
                } else if (isCompleted || isCheckedIn) {
                  accentColor = 'bg-secondary';
                  iconColor = 'text-secondary';
                  badgeClass = 'bg-secondary-container text-on-secondary-container';
                  statusIcon = 'sports_tennis';
                }

                return (
                  <div key={booking.id} className="relative bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex items-center justify-between overflow-hidden">
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`}></div>
                    <div className="flex items-center gap-3 pl-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 ${iconColor}`}>
                        <span className="material-symbols-outlined text-[22px]">{statusIcon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{booking.court?.name || 'Court'}</span>
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${badgeClass}`}>
                            {booking.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[13px]">schedule</span> {booking.start_time.slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span className="font-medium">{booking.booking_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isPending ? (
                        <button 
                          onClick={() => handleCancelBooking(booking.id)}
                          className="px-3 py-1.5 rounded-lg bg-error-container text-on-error-container font-label-sm text-label-sm font-bold hover:bg-opacity-90 active:scale-95 transition-all"
                        >
                          CANCEL
                        </button>
                      ) : isCancelled ? (
                        <span className="material-symbols-outlined text-on-surface-variant text-[18px]">cancel</span>
                      ) : (
                        <span className="material-symbols-outlined text-secondary text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Helpful Rules / Policy Callout Card */}
          <section className="rounded-xl bg-surface-container-low p-3.5 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary text-[22px] mt-0.5 shrink-0">info</span>
            <div className="flex flex-col">
              <span className="font-label-md text-label-md text-on-surface font-bold">กฎการเข้าใช้คอร์ทและเช็คอิน</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                กรุณาสแกน QR หน้าสนามก่อนเวลาเริ่ม 15 นาที หากเลยเวลาเกิน 15 นาที ระบบจะยกเลิกการจองโดยอัตโนมัติเพื่อให้สิทธิ์ผู้รอคิวถัดไป
              </p>
            </div>
          </section>

        </div>
      </div>
    </MainLayout>
  );
}
