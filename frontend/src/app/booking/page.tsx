'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function BookingPage() {
  const router = useRouter();
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [courts, setCourts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Time slots from 09:00 to 21:00
  const timeSlots = Array.from({ length: 13 }, (_, i) => {
    return `${(i + 9).toString().padStart(2, '0')}:00`;
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchAvailability();
  }, [date]);

  const fetchAvailability = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/courts/availability?date=${date}`);
      setCourts(response.data);
    } catch (err) {
      toast.error('Failed to load courts');
    } finally {
      setLoading(false);
    }
  };

  const isSlotBooked = (court: any, time: string) => {
    // format from db is HH:mm:ss
    const formattedTime = time + ':00';
    return court.bookings?.some((b: any) => b.start_time === formattedTime);
  };

  const handleBook = async (courtId: number, startTime: string) => {
    setBookingLoading(true);
    try {
      await api.post('/bookings', {
        courtId,
        date,
        startTime: startTime + ':00'
      });
      toast.success('Court booked successfully!');
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to book court');
    } finally {
      setBookingLoading(false);
      fetchAvailability(); // Refresh data
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">Book a Court</h1>
          <Button variant="ghost" onClick={() => router.push('/')}>Back</Button>
        </div>

        <Card>
          <CardHeader className="pb-4">
            <CardTitle>Select Date</CardTitle>
            <CardDescription>When do you want to play?</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              type="date" 
              value={date} 
              onChange={(e) => setDate(e.target.value)} 
              min={new Date().toISOString().split('T')[0]}
            />
          </CardContent>
        </Card>

        {loading ? (
          <p className="text-center text-slate-500 py-8">Loading availability...</p>
        ) : (
          <div className="space-y-6">
            {courts.map(court => (
              <div key={court.id} className="bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                <h2 className="text-lg font-bold mb-4">{court.name}</h2>
                <div className="grid grid-cols-3 gap-2">
                  {timeSlots.map(time => {
                    const booked = isSlotBooked(court, time);
                    const [hours, minutes] = time.split(':');
                    const endTime = `${(parseInt(hours) + 1).toString().padStart(2, '0')}:${minutes}`;
                    
                    return (
                      <Button
                        key={time}
                        variant={booked ? "secondary" : "outline"}
                        className={`h-auto py-2 flex flex-col items-center justify-center ${
                          booked ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' : 'hover:border-blue-500 hover:text-blue-600 border-slate-200'
                        }`}
                        disabled={booked || bookingLoading || court.status === 'MAINTENANCE'}
                        onClick={() => handleBook(court.id, time)}
                      >
                        <span className="text-sm font-semibold">{time}</span>
                        <span className="text-[10px] opacity-70">to {endTime}</span>
                      </Button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
