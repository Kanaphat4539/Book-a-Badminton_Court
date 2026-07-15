'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');

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
      <div className="bg-background text-on-background antialiased min-h-screen flex flex-col pt-24 pb-24 font-sans">
        {/* TopAppBar */}
        <div className="fixed top-0 w-full z-50 shadow-sm">
          <header className="bg-[#F26522] flex justify-between items-center px-container-padding h-16 text-white">
            <div className="flex items-center gap-sm cursor-pointer" onClick={() => router.push('/')}>
              <img alt="KMITL Badminton Logo" className="h-10 w-10 rounded-full bg-white p-0.5 object-cover shadow-sm" src="/kmitl-logo.png" />
              <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
            </div>
            <button className="hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200 text-white" onClick={handleLogout}>
              <span className="material-symbols-outlined font-headline-md text-[24px]" style={{fontVariationSettings: "'FILL' 0"}}>logout</span>
            </button>
          </header>
          <div className="bg-[#545454] h-8 flex items-center px-container-padding text-white font-body-md text-[12px] md:text-[14px]">
            สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
          </div>
        </div>

        <div className="max-w-5xl mx-auto space-y-6 w-full px-container-padding mt-4">
          <div className="flex justify-between items-center bg-surface-container p-4 rounded-xl shadow-lg border border-outline-variant/30">
            <div>
              <h1 className="font-display-sm text-[24px] font-bold">Admin Dashboard</h1>
              <p className="font-body-md text-[14px] text-on-surface-variant">Manage courts and view all bookings</p>
            </div>
            <div className="flex gap-2">
              <button 
                className="bg-error hover:bg-error/90 text-on-error px-4 py-2 rounded-lg font-button text-[14px] font-semibold transition-colors shadow-md"
                onClick={handleResetDatabase}
              >
                Reset Database
              </button>
            </div>
          </div>

          <section>
            <h2 className="font-headline-md text-[20px] font-semibold mb-4">All Bookings</h2>
            <div className="space-y-3">
              {allBookings.length === 0 && <p className="text-on-surface-variant text-sm">No bookings found.</p>}
              {allBookings.map(booking => (
                <div key={booking.id} className="bg-surface-container p-4 rounded-xl flex justify-between items-center border border-outline-variant/30">
                  <div>
                    <p className="font-headline-md text-[16px] font-bold">{booking.user?.name} <span className="text-on-surface-variant font-normal text-[14px]">(@{booking.user?.username})</span></p>
                    <p className="text-[14px] text-on-surface-variant mt-1">{booking.court?.name} • {booking.booking_date}</p>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-[14px] font-bold text-primary">{booking.start_time.slice(0,5)} - {booking.end_time.slice(0,5)}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      booking.status === 'COMPLETED' ? 'bg-[#004d40] text-[#1de9b6] border border-[#1de9b6]/30' :
                      booking.status === 'CANCELLED' ? 'bg-[#4a0005] text-[#ffb4ab] border border-[#ffb4ab]/30' :
                      booking.status === 'CHECKED_IN' ? 'bg-[#003257] text-[#9ccaff] border border-[#9ccaff]/30' :
                      'bg-[#572000] text-[#ffb693] border border-[#ffb693]/30'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col pt-24 pb-24 font-sans">
      {/* TopAppBar */}
      <div className="fixed top-0 w-full z-50 shadow-sm">
        <header className="bg-[#F26522] flex justify-between items-center px-container-padding h-16 text-white">
          <div className="flex items-center gap-sm cursor-pointer" onClick={() => router.push('/')}>
            <img alt="KMITL Badminton Logo" className="h-10 w-10 rounded-full bg-white p-0.5 object-cover shadow-sm" src="/kmitl-logo.png" />
            <span className="font-display-sm text-[22px] md:text-[24px] font-bold tracking-tight text-white">KMITL BADMINTON</span>
          </div>
          <button className="hover:opacity-80 transition-opacity active:scale-95 transition-transform duration-200 text-white" onClick={handleLogout}>
            <span className="material-symbols-outlined font-headline-md text-[24px]" style={{fontVariationSettings: "'FILL' 0"}}>logout</span>
          </button>
        </header>
        <div className="bg-[#545454] h-8 flex items-center px-container-padding text-white font-body-md text-[12px] md:text-[14px]">
          สถาบันเทคโนโลยีพระจอมเกล้าเจ้าคุณทหารลาดกระบัง
        </div>
      </div>

      <main className="max-w-5xl mx-auto space-y-6 w-full px-container-padding mt-4">
        
        {/* Welcome Header */}
        <section>
          <h1 className="font-display-lg text-[32px] font-bold mb-1">Hi, {user.name}</h1>
          <p className="font-body-lg text-[16px] text-on-surface-variant">Welcome back to KMITL Badminton</p>
        </section>

        {/* Active Session Card */}
        {activeBooking && (
          <section className="bg-surface-container rounded-2xl p-5 border border-primary shadow-[0_0_20px_rgba(255,107,0,0.15)] relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <div className="relative z-10">
              <h2 className="font-headline-md text-[18px] font-bold text-primary mb-1">Currently Playing</h2>
              <p className="font-body-md text-[14px] text-on-surface-variant mb-4">You are checked in to {activeBooking.court?.name}</p>
              
              <div className="text-center py-4 bg-surface rounded-xl border border-outline-variant/20">
                <p className="font-label-md text-[12px] font-medium text-on-surface-variant mb-2">TIME REMAINING (ENDS AT {activeBooking.end_time})</p>
                <div className="font-display-lg text-[48px] font-bold text-primary">
                  {timeLeft}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Upcoming Booking Card */}
        {pendingBooking && !activeBooking && (
          <section className="bg-surface-container rounded-2xl p-5 border border-tertiary-container/30 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-32 h-32 bg-tertiary-container/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
             <div className="relative z-10">
                <h2 className="font-headline-md text-[18px] font-bold mb-1">Upcoming Booking</h2>
                <p className="font-body-md text-[14px] text-on-surface-variant mb-4">Your next court reservation</p>

                <div className="flex justify-between items-center mb-4 bg-surface p-4 rounded-xl border border-outline-variant/20">
                  <div>
                    <p className="font-headline-md text-[16px] font-bold text-primary">{pendingBooking.court?.name}</p>
                    <p className="font-body-md text-[14px] text-on-surface-variant mt-1">{pendingBooking.booking_date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-display-sm text-[24px] font-bold">{pendingBooking.start_time.slice(0,5)}</p>
                    <p className="font-body-md text-[14px] text-on-surface-variant">to {pendingBooking.end_time.slice(0,5)}</p>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button 
                    className="flex-1 btn-primary h-12 rounded-lg font-button text-[14px] font-semibold flex items-center justify-center gap-2"
                    onClick={() => router.push('/scan')}
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    Check-in
                  </button>
                  <button 
                    className="flex-1 bg-transparent border border-error/50 text-error hover:bg-error/10 h-12 rounded-lg font-button text-[14px] font-semibold transition-colors"
                    onClick={() => handleCancelBooking(pendingBooking.id)}
                  >
                    Cancel
                  </button>
                </div>
             </div>
          </section>
        )}

        {/* Quick Actions */}
        <section className="grid grid-cols-2 gap-4">
          <button 
            className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all active:scale-95 bg-primary-container text-white shadow-[0_4px_14px_0_rgba(255,107,0,0.39)] border border-primary-container/20 hover:bg-primary-container/90"
            onClick={() => router.push('/booking')}
          >
            <span className="material-symbols-outlined text-[32px]">sports_tennis</span>
            <span className="font-button text-[16px] font-semibold">Book Court</span>
          </button>
          <button 
            className="h-28 flex flex-col items-center justify-center gap-3 rounded-2xl transition-all active:scale-95 bg-surface-container border border-outline-variant/30 hover:border-primary/50 hover:bg-surface-container-high"
            onClick={() => router.push('/scan')}
          >
            <span className="material-symbols-outlined text-[32px]" style={{fontVariationSettings: "'FILL' 0"}}>qr_code_scanner</span>
            <span className="font-button text-[16px] font-semibold">Scan QR</span>
          </button>
        </section>

        {/* Recent Bookings */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-headline-md text-[20px] font-semibold">Recent Bookings</h2>
          </div>
          <div className="space-y-3">
            {bookings.length === 0 && (
              <div className="bg-surface-container border border-outline-variant/30 rounded-xl p-6 text-center">
                <p className="font-body-md text-[14px] text-on-surface-variant">No bookings yet.</p>
                <button 
                  className="mt-4 text-primary font-button text-[14px] font-semibold hover:underline"
                  onClick={() => router.push('/booking')}
                >
                  Make your first booking
                </button>
              </div>
            )}
            {bookings.map(booking => (
              <div key={booking.id} className="bg-surface-container p-4 rounded-xl flex justify-between items-center border border-outline-variant/30">
                <div>
                  <p className="font-headline-md text-[16px] font-bold mb-1">{booking.court?.name || 'Court'}</p>
                  <p className="font-body-md text-[12px] text-on-surface-variant">{booking.booking_date}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-2">
                  <p className="font-headline-md text-[16px] font-bold text-primary">{booking.start_time.slice(0,5)}</p>
                  <div className="flex items-center gap-3">
                    {booking.status === 'PENDING' && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-[12px] font-bold text-error hover:text-error/80 uppercase tracking-wider transition-colors"
                      >
                        Cancel
                      </button>
                    )}
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      booking.status === 'COMPLETED' ? 'bg-[#004d40] text-[#1de9b6] border border-[#1de9b6]/30' :
                      booking.status === 'CANCELLED' ? 'bg-[#4a0005] text-[#ffb4ab] border border-[#ffb4ab]/30' :
                      booking.status === 'CHECKED_IN' ? 'bg-[#003257] text-[#9ccaff] border border-[#9ccaff]/30' :
                      'bg-[#572000] text-[#ffb693] border border-[#ffb693]/30'
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
        <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-surface-container/90 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.5)] border-t border-[#2A2A2A]">
          <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>sports_tennis</span>
            <span className="font-label-md text-[12px] font-semibold">Home</span>
          </button>
          <button onClick={() => router.push('/booking')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>event_note</span>
            <span className="font-label-md text-[12px] font-semibold">Bookings</span>
          </button>
          <button onClick={() => router.push('/scan')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
            <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>qr_code_scanner</span>
            <span className="font-label-md text-[12px] font-semibold">Scan</span>
          </button>
        </nav>
      )}
    </div>
  );
}

