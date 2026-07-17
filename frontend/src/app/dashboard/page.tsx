'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
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

  if (!user) return null;

  if (user.role === 'ADMIN') {
    return (
      <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 text-on-surface antialiased min-h-screen flex flex-col pt-24 pb-24 font-sans relative overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/10 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
          <div className="absolute bottom-[20%] right-[-10%] w-[600px] h-[600px] bg-yellow-200/50 rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        </div>
        {/* TopAppBar */}
        <div className="fixed top-0 w-full z-50 shadow-sm">
          <header className="bg-[#F26522] flex justify-between items-center px-container-padding h-16 text-white shadow-sm">
            <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
              <img alt="KMITL Badminton Logo" className="h-10 w-10 rounded-full bg-white p-0.5 object-cover shadow-sm" src="/kmitl-logo.png" />
              <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
            </div>
            <div className="flex items-center gap-1">
              <ThemeToggle className="hidden md:flex w-11 h-11 rounded-full hover:bg-black/10 transition-all active:scale-95 text-white items-center justify-center" iconClassName="text-[28px]" />
              <button className="hidden md:flex w-11 h-11 items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={handleLogout}>
                <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
              </button>
              <button className="md:hidden w-11 h-11 flex items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={() => setIsSidebarOpen(true)}>
                <span className="material-symbols-outlined text-[28px]">menu</span>
              </button>
            </div>
          </header>
          <div className="bg-[#545454] h-8 flex items-center px-container-padding text-white font-body-md text-[12px] md:text-[14px]">
            สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 w-full px-container-padding mt-4 relative z-10">
          <div className="flex justify-between items-center bg-white/80 dark:bg-[#2a1300]/60 backdrop-blur-xl p-6 rounded-3xl shadow-lg border border-white/60 dark:border-[#ff6b00]/20 transition-colors duration-300">
            <div>
              <h1 className="font-display-sm text-[28px] font-extrabold text-gray-900 dark:text-orange-50 drop-shadow-sm transition-colors duration-300">Admin Dashboard</h1>
              <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 font-medium transition-colors duration-300">Manage courts and view all bookings</p>
            </div>
            <div className="flex gap-2">
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-5 py-2.5 rounded-xl font-button text-[15px] font-bold transition-all shadow-[0_4px_12px_rgba(239,68,68,0.3)] hover:shadow-[0_6px_16px_rgba(239,68,68,0.4)] active:scale-95"
                onClick={handleResetDatabase}
              >
                Reset Database
              </button>
            </div>
          </div>

          <section>
            <h2 className="font-headline-md text-[22px] font-extrabold mb-4 text-gray-900 dark:text-orange-50 transition-colors duration-300">All Bookings</h2>
            <div className="space-y-4">
              {allBookings.length === 0 && <p className="text-gray-500 dark:text-orange-200/70 font-medium text-[15px] bg-white/50 dark:bg-[#2a1300]/40 p-6 rounded-2xl text-center transition-colors duration-300">No bookings found.</p>}
              {allBookings.map(booking => (
                <div key={booking.id} className="bg-white/70 dark:bg-[#2a1300]/60 backdrop-blur-xl p-5 rounded-2xl flex justify-between items-center border border-white/60 dark:border-[#ff6b00]/20 shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.06)] transition-all duration-300">
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
                  <button onClick={() => { setIsSidebarOpen(false); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">About</button>
                  <button onClick={() => { setIsSidebarOpen(false); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">News <span className="w-2 h-2 rounded-full bg-green-500 inline-block ml-1"></span></button>
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

                <div className="mt-auto pt-6">
                   <button onClick={handleLogout} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                     <span className="material-symbols-outlined">logout</span>
                     Logout
                   </button>
                </div>
              </nav>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
              <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-[#2a1300] dark:via-[#140900] dark:to-[#2a1300] text-on-surface dark:text-orange-50 antialiased min-h-screen flex flex-col pt-24 pb-24 font-sans relative overflow-hidden transition-colors duration-300">
                {/* Decorative blobs */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                  <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
                  <div className="absolute top-[40%] right-[-10%] w-[400px] h-[400px] bg-yellow-200/50 dark:bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
                  <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
                </div>
                {/* TopAppBar */}
                <div className="fixed top-0 w-full z-50 shadow-sm">
                  <header className="bg-[#F26522] dark:bg-[#C24500] flex justify-between items-center px-container-padding h-16 text-white shadow-sm transition-colors duration-300">
                    <div className="flex items-center gap-4 cursor-pointer" onClick={() => router.push('/dashboard')}>
                      <img alt="KMITL Badminton Logo" className="h-10 w-10 rounded-full bg-white p-0.5 object-cover shadow-sm" src="/kmitl-logo.png" />
                      <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <ThemeToggle className="hidden md:flex w-11 h-11 rounded-full hover:bg-black/10 transition-all active:scale-95 text-white items-center justify-center" iconClassName="text-[28px]" />
                      <button className="hidden md:flex w-11 h-11 items-center justify-center rounded-full hover:bg-black/10 transition-all active:scale-95 text-white" onClick={handleLogout}>
                        <span className="material-symbols-outlined text-[28px]" style={{ fontVariationSettings: "'FILL' 0" }}>logout</span>
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


            <main className="max-w-5xl mx-auto space-y-8 w-full px-container-padding mt-6 relative z-10">

              {/* Welcome Header */}
              <section>
                <h1 className="font-display-lg text-[36px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 drop-shadow-sm tracking-tight transition-colors duration-300">Hi, {user.name}</h1>
                <p className="font-body-lg text-[17px] text-gray-600 dark:text-orange-200/70 font-medium transition-colors duration-300">Welcome back to KMITL Badminton</p>
              </section>

              {/* Active Session Card */}
              {activeBooking && (
                <section className="bg-white/80 dark:bg-[#2a1300]/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border-2 border-primary/30 dark:border-[#ff6b00]/40 shadow-[0_12px_32px_rgba(255,107,0,0.15)] relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-primary/30 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="relative z-10">
                    <h2 className="font-headline-md text-[20px] font-extrabold text-primary mb-1 uppercase tracking-wide">Currently Playing</h2>
                    <p className="font-body-md text-[15px] text-gray-700 dark:text-orange-200 font-medium mb-6 transition-colors duration-300">You are checked in to <span className="font-bold text-gray-900 dark:text-orange-50">{activeBooking.court?.name}</span></p>

                    <div className="text-center py-6 bg-white/60 dark:bg-[#140900]/60 backdrop-blur-md rounded-2xl border border-white dark:border-[#ff6b00]/30 shadow-inner transition-colors duration-300">
                      <p className="font-label-md text-[13px] font-bold text-gray-500 dark:text-orange-300/60 mb-2 tracking-widest transition-colors duration-300">TIME REMAINING (ENDS AT {activeBooking.end_time.slice(0, 5)})</p>
                      <div className="font-display-lg text-[56px] font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#E55B13] drop-shadow-sm">
                        {timeLeft}
                      </div>
                    </div>
                  </div>
                </section>
              )}

              {/* Upcoming Booking Card */}
              {pendingBooking && !activeBooking && (
                <section className="bg-white/70 dark:bg-[#2a1300]/60 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/60 dark:border-[#ff6b00]/20 shadow-[0_8px_32px_rgba(0,0,0,0.06)] relative overflow-hidden transform hover:-translate-y-1 transition-all duration-300">
                  <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-400/20 dark:from-[#ff6b00]/20 to-transparent rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none"></div>
                  <div className="relative z-10">
                    <h2 className="font-headline-md text-[20px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 transition-colors duration-300">Upcoming Booking</h2>
                    <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 font-medium mb-6 transition-colors duration-300">Your next court reservation</p>

                    <div className="flex justify-between items-center mb-6 bg-white/60 dark:bg-[#140900]/60 p-5 rounded-2xl border border-white dark:border-[#ff6b00]/30 shadow-sm transition-colors duration-300">
                      <div>
                        <p className="font-headline-md text-[18px] font-extrabold text-primary">{pendingBooking.court?.name}</p>
                        <p className="font-body-md text-[15px] text-gray-600 dark:text-orange-200/70 mt-1 font-medium transition-colors duration-300">{pendingBooking.booking_date}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-display-sm text-[28px] font-black text-gray-900 dark:text-orange-50 transition-colors duration-300">{pendingBooking.start_time.slice(0, 5)}</p>
                        <p className="font-body-md text-[15px] text-gray-500 dark:text-orange-300/60 font-bold transition-colors duration-300">to {pendingBooking.end_time.slice(0, 5)}</p>
                      </div>
                    </div>

                    <div className="flex gap-4 mt-2">
                      <button
                        className="flex-1 bg-gradient-to-r from-primary to-[#E55B13] text-white h-14 rounded-xl font-button text-[16px] font-bold flex items-center justify-center gap-2 shadow-[0_8px_20px_rgba(255,107,0,0.3)] hover:shadow-[0_10px_25px_rgba(255,107,0,0.4)] active:scale-95 transition-all"
                        onClick={() => router.push('/scan')}
                      >
                        <span className="material-symbols-outlined text-[22px]">qr_code_scanner</span>
                        Check-in
                      </button>
                      <button
                        className="flex-1 bg-white dark:bg-[#1a0a00] border-2 border-red-500 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-14 rounded-xl font-button text-[16px] font-bold transition-colors active:scale-95"
                        onClick={() => handleCancelBooking(pendingBooking.id)}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </section>
              )}

              {/* Quick Actions */}
              <section className="grid grid-cols-2 gap-4 md:gap-5">
                <button
                  className="h-32 flex flex-col items-center justify-center gap-2 rounded-3xl transition-all active:scale-95 bg-gradient-to-br from-primary via-[#ff7e22] to-[#E55B13] text-white shadow-[0_8px_24px_rgba(255,107,0,0.35)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.45)] hover:-translate-y-1 relative overflow-hidden group"
                  onClick={() => router.push('/booking')}
                >
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/20 rounded-full blur-2xl -mr-8 -mt-8 transition-transform group-hover:scale-150"></div>
                  <span className="material-symbols-outlined text-[38px] drop-shadow-sm">sports_tennis</span>
                  <span className="font-button text-[16px] font-bold tracking-wide drop-shadow-sm">Book Court</span>
                </button>
                <button
                  className="h-32 flex flex-col items-center justify-center gap-2 rounded-3xl transition-all duration-300 active:scale-95 bg-white/70 dark:bg-[#1a0a00]/70 backdrop-blur-xl border-2 border-white dark:border-[#ff6b00]/30 text-gray-800 dark:text-orange-50 shadow-[0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.15)] hover:-translate-y-1 hover:border-primary/40 group relative overflow-hidden"
                  onClick={() => router.push('/scan')}
                >
                  <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 dark:bg-primary/20 rounded-full blur-2xl -ml-8 -mb-8 transition-transform group-hover:scale-150"></div>
                  <span className="material-symbols-outlined text-[38px] text-gray-700 dark:text-orange-200 group-hover:text-primary transition-colors drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 0" }}>qr_code_scanner</span>
                  <span className="font-button text-[16px] font-bold tracking-wide">Scan QR</span>
                </button>
              </section>

              {/* Recent Bookings */}
              <section>
                <div className="flex justify-between items-center mb-5">
                  <h2 className="font-headline-md text-[22px] font-extrabold text-gray-900 dark:text-orange-50 transition-colors duration-300">Recent Bookings</h2>
                  {bookings.length > 3 && (
                    <button onClick={() => router.push('/booking')} className="text-primary font-label-md text-[14px] font-bold hover:underline transition-all">
                      View all
                    </button>
                  )}
                </div>
                <div className="space-y-4">
                  {bookings.length === 0 && (
                    <div className="bg-white/60 dark:bg-[#2a1300]/60 backdrop-blur-xl border border-white dark:border-[#ff6b00]/20 shadow-sm rounded-3xl p-8 text-center transition-colors duration-300">
                      <p className="font-body-md text-[16px] text-gray-500 dark:text-orange-200/70 font-medium transition-colors duration-300">No bookings yet.</p>
                      <button
                        className="mt-4 text-primary font-button text-[16px] font-bold hover:underline"
                        onClick={() => router.push('/booking')}
                      >
                        Make your first booking
                      </button>
                    </div>
                  )}
                  {bookings.slice(0, 3).map(booking => (
                    <div key={booking.id} className="bg-white/70 dark:bg-[#1a0a00]/70 backdrop-blur-xl p-5 rounded-3xl flex justify-between items-center border border-white/80 dark:border-[#ff6b00]/30 shadow-[0_8px_24px_rgba(0,0,0,0.04)] dark:shadow-[0_8px_24px_rgba(255,107,0,0.05)] hover:shadow-[0_12px_32px_rgba(255,107,0,0.1)] hover:-translate-y-0.5 transition-all relative overflow-hidden group">
                      {/* Left Accent Bar */}
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary to-[#E55B13] opacity-80 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="pl-2">
                        <p className="font-headline-md text-[18px] font-extrabold mb-1 text-gray-900 dark:text-orange-50 transition-colors duration-300">{booking.court?.name || 'Court'}</p>
                        <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 dark:text-orange-200/70 transition-colors duration-300">
                          <span className="material-symbols-outlined text-[16px]">calendar_month</span>
                          <p className="font-body-md text-[14px] font-semibold">{booking.booking_date}</p>
                        </div>
                      </div>
                      <div className="text-right flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5 text-primary">
                          <span className="material-symbols-outlined text-[18px]">schedule</span>
                          <p className="font-headline-md text-[19px] font-black tracking-tight">{booking.start_time.slice(0, 5)}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          {booking.status === 'PENDING' && (
                            <button
                              onClick={() => handleCancelBooking(booking.id)}
                              className="text-[12px] font-bold text-red-500 hover:text-red-700 uppercase tracking-wider transition-colors active:scale-95 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md"
                            >
                              Cancel
                            </button>
                          )}
                          <span className={`text-[10px] sm:text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-wider border shadow-sm ${booking.status === 'COMPLETED' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800' :
                            booking.status === 'CANCELLED' ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-200 dark:border-red-800' :
                              booking.status === 'CHECKED_IN' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' :
                                'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border-orange-200 dark:border-orange-800'
                            }`}>
                            {booking.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </main>

            {/* BottomNavBar */}
            {user.role !== 'ADMIN' && (
              <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-white/90 dark:bg-[#140900]/95 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-[#ff6b00]/20 transition-colors duration-300">
                <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
                  <span className="material-symbols-outlined drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>sports_tennis</span>
                  <span className="font-label-md text-[12px] font-semibold tracking-wide">Home</span>
                </button>
                <button onClick={() => router.push('/booking')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>event_note</span>
                  <span className="font-label-md text-[12px] font-semibold tracking-wide">Bookings</span>
                </button>
                <button onClick={() => router.push('/scan')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>qr_code_scanner</span>
                  <span className="font-label-md text-[12px] font-semibold">Scan</span>
                </button>
                <button onClick={() => router.push('/news')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
                  <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>article</span>
                  <span className="font-label-md text-[12px] font-semibold">News</span>
                </button>
              </nav>
            )}

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
                  <button onClick={() => { setIsSidebarOpen(false); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">News <span className="w-2 h-2 rounded-full bg-green-500 inline-block ml-1"></span></button>
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

                <div className="mt-auto pt-6">
                   <button onClick={handleLogout} className="w-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400 transition-colors">
                     <span className="material-symbols-outlined">logout</span>
                     Logout
                   </button>
                </div>
              </nav>
            </div>
          </div>
        )}
        </div>
        );
}

