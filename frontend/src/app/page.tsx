'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
      <div className="min-h-screen bg-slate-50 p-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
            <div>
              <h1 className="text-xl font-bold">Admin Dashboard</h1>
              <p className="text-sm text-slate-500">Manage courts and view all bookings</p>
            </div>
            <div className="flex gap-2">
              <Button variant="destructive" size="sm" onClick={handleResetDatabase}>Reset Database</Button>
              <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
            </div>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Bookings</CardTitle>
              <CardDescription>Recent and upcoming bookings in the system</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {allBookings.length === 0 && <p className="text-slate-500 text-sm">No bookings found.</p>}
                {allBookings.map(booking => (
                  <div key={booking.id} className="bg-slate-50 p-3 rounded-lg flex justify-between items-center border border-slate-100">
                    <div>
                      <p className="font-semibold text-sm">{booking.user?.name} (@{booking.user?.username})</p>
                      <p className="text-xs text-slate-500">{booking.court?.name} • {booking.booking_date}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <p className="text-sm font-semibold">{booking.start_time.slice(0,5)} - {booking.end_time.slice(0,5)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                        booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                        booking.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {booking.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
          <div>
            <h1 className="text-xl font-bold">Hi, {user.name}</h1>
            <p className="text-sm text-slate-500">Welcome to Badminton Courts</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>Logout</Button>
        </div>

        {activeBooking && (
          <Card className="border-emerald-200 bg-emerald-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-emerald-700">Currently Playing</CardTitle>
              <CardDescription>You are checked in to {activeBooking.court?.name}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-sm font-medium text-emerald-800">Time remaining (Ends at {activeBooking.end_time})</p>
                <div className="text-4xl font-bold text-emerald-600 my-2">
                  {timeLeft}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {pendingBooking && !activeBooking && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-blue-700">Upcoming Booking</CardTitle>
              <CardDescription>Your next court reservation</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center mb-4">
                <div>
                  <p className="font-semibold text-slate-800">{pendingBooking.court?.name}</p>
                  <p className="text-sm text-slate-500">{pendingBooking.booking_date}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{pendingBooking.start_time.slice(0,5)}</p>
                  <p className="text-sm text-slate-500">to {pendingBooking.end_time.slice(0,5)}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button className="w-full" onClick={() => router.push('/scan')}>
                  Scan QR to Check-in
                </Button>
                <Button variant="destructive" className="w-full" onClick={() => handleCancelBooking(pendingBooking.id)}>
                  Cancel Booking
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Button 
            className="h-24 flex flex-col gap-2 bg-slate-900 hover:bg-slate-800" 
            onClick={() => router.push('/booking')}
          >
            <span className="text-2xl">🏸</span>
            <span>Book Court</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-24 flex flex-col gap-2 bg-white"
            onClick={() => router.push('/scan')}
          >
            <span className="text-2xl">📱</span>
            <span>Scan QR</span>
          </Button>
        </div>

        <div>
          <h2 className="text-lg font-bold mb-3 px-1">Recent Bookings</h2>
          <div className="space-y-3">
            {bookings.length === 0 && <p className="text-slate-500 text-sm px-1">No bookings yet.</p>}
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white p-3 rounded-lg shadow-sm border border-slate-100 flex justify-between items-center">
                <div>
                  <p className="font-medium text-sm">{booking.court?.name || 'Court'}</p>
                  <p className="text-xs text-slate-500">{booking.booking_date}</p>
                </div>
                <div className="text-right flex flex-col items-end gap-1">
                  <p className="text-sm font-semibold">{booking.start_time.slice(0,5)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      booking.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                      booking.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                      booking.status === 'CHECKED_IN' ? 'bg-blue-100 text-blue-700' :
                      'bg-amber-100 text-amber-700'
                    }`}>
                      {booking.status}
                    </span>
                    {booking.status === 'PENDING' && (
                      <button 
                        onClick={() => handleCancelBooking(booking.id)}
                        className="text-xs text-red-600 hover:text-red-800 underline"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
