'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import MainLayout from '@/components/MainLayout';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: number, name: string, username: string, role: string } | null>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [allBookings, setAllBookings] = useState<any[]>([]);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const selectedBooking = allBookings.find(b => b.booking_id === selectedBookingId) || null;
  const [bookingTimeRemaining, setBookingTimeRemaining] = useState<string>('--:--');
  const [mounted, setMounted] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [statPeriod, setStatPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Countdown timer for admin selected booking
  useEffect(() => {
    if (!selectedBooking || selectedBooking.status !== 'CHECKED_IN') return;

    const updateTimer = () => {
      const now = new Date();
      // Calculate countdown to time_out
      const endTimeStr = `${selectedBooking.booking_date}T${selectedBooking.time_out}`;
      const endTime = new Date(endTimeStr);

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
      setSelectedBookingId(null);
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
      // Poll every 5 seconds
      const interval = setInterval(() => {
        fetchAllBookings();
      }, 5000);
      return () => clearInterval(interval);
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



  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      await api.post(`/bookings/${bookingToCancel}/cancel`);
      toast.success('ยกเลิกการจองสำเร็จ (Booking cancelled successfully)');
      setBookingToCancel(null);
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
        const endDateStr = `${activeBooking.booking_date}T${activeBooking.time_out}`;
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
      <MainLayout width="full">
        <div className="flex flex-col w-full">
          
          {/* Admin Banner (smash-peach inspired) */}
          <div className="relative w-full overflow-hidden bg-primary-fixed text-on-primary-fixed dark:bg-surface-container-low dark:text-on-surface shrink-0">
            <div className="absolute -right-24 -top-36 w-md h-112 rounded-full border-48 border-primary/15"></div>
            <div className="absolute -bottom-44 left-1/3 w-104 h-104 rounded-full border border-primary-container/20"></div>
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffb469 1px, transparent 1px)', backgroundSize: '18px 18px' }}></div>
            
            <div className="relative z-10 flex flex-col mx-auto max-w-7xl px-6 md:px-10 pt-10 pb-16">
              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-3">
                  <div className="grid w-11 h-11 place-items-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                    <span className="material-symbols-outlined text-[22px]">monitoring</span>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">KMITL Sports Complex</p>
                    <p className="text-sm font-semibold">Admin control center</p>
                  </div>
                </div>
                <button
                  className="group inline-flex items-center justify-center h-9 gap-2 px-3.5 rounded-xl border border-outline-variant bg-surface/60 text-on-surface hover:bg-surface transition-all text-sm font-medium"
                  onClick={() => router.push('/admin/users')}
                >
                  <span className="material-symbols-outlined text-[18px]">group</span> Users
                </button>
              </div>

              <div className="max-w-3xl">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_10px_#F26522]"></span> Live system overview
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">Good morning, Admin.</h1>
                <p className="mt-4 max-w-xl text-base md:text-lg leading-7 text-on-primary-fixed-variant dark:text-on-surface-variant">
                  Stay on top of every booking, court schedule, and player experience in one place.
                </p>
              </div>

              <div className="mt-9 flex flex-wrap gap-3 text-xs font-medium text-on-primary-fixed-variant dark:text-on-surface-variant">
                <span className="inline-flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">pin_drop</span> Lat Krabang Campus
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">schedule</span> Last synced just now
                </span>
                <span className="inline-flex items-center gap-2 rounded-lg bg-surface/60 px-3 py-2">
                  <span className="material-symbols-outlined text-[14px] text-primary">security</span> Secure admin mode
                </span>
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-7xl px-4 md:px-10 w-full flex flex-col gap-6 mt-8 pb-10">
          {/* Booking Statistics (A06) */}
          <div className="px-4 md:px-margin-screen flex flex-col gap-4 mt-4 mb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[22px] text-primary">bar_chart</span>
                <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">Booking Statistics</h2>
              </div>
              <div className="flex bg-surface-container-low p-1 rounded-xl">
                {['Day', 'Week', 'Month', 'Year'].map(period => (
                  <button 
                    key={period}
                    onClick={() => setStatPeriod(period as any)}
                    className={`px-3 py-1.5 text-[12px] md:text-[13px] font-bold rounded-lg transition-colors ${statPeriod === period ? 'bg-primary text-on-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </div>
            
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-5 md:p-6 shadow-sm overflow-hidden flex flex-col">
              <p className="font-label-sm text-on-surface-variant uppercase tracking-wider mb-6">Booking trends by {statPeriod.toLowerCase()}</p>
              
              <div className="flex flex-col justify-end h-56 relative w-full mt-2">
                {/* Y-axis placeholder lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none z-0 pb-8">
                  <div className="border-b border-surface-container-highest/50 w-full h-0"></div>
                  <div className="border-b border-surface-container-highest/50 w-full h-0"></div>
                  <div className="border-b border-surface-container-highest/50 w-full h-0"></div>
                  <div className="border-b border-surface-container-highest/50 w-full h-0"></div>
                  <div className="border-b border-surface-container-high w-full h-0"></div>
                </div>

                {(() => {
                  // A06: Time-series realistic data (Trend, Seasonality, Anomalies)
                  let labels: string[] = [];
                  let completedData: number[] = [];

                  if (statPeriod === 'Day') {
                    // Time-series: Quiet morning, lunch spike, evening peak
                    labels = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
                    completedData = [2, 5, 15, 10, 35, 20];
                  } else if (statPeriod === 'Week') {
                    // Time-series: Weekdays stable, weekend massive peak
                    labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    completedData = [45, 42, 38, 50, 65, 95, 90]; 
                  } else if (statPeriod === 'Month') {
                    // Time-series: Upward trend, anomaly in week 3
                    labels = ['W1', 'W2', 'W3', 'W4'];
                    completedData = [150, 165, 90, 190]; // 90 is the anomaly/shock
                  } else if (statPeriod === 'Year') {
                    // Time-series: Long-term growth trend over the year
                    labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                    completedData = [300, 320, 350, 340, 400, 420, 480, 500, 520, 550, 590, 650];
                  }
                  
                  const maxVal = Math.max(...completedData) * 1.2 || 1; // 20% headroom above peak

                  const data = labels.map((label, idx) => {
                    const val1 = completedData[idx];
                    const h1 = (val1 / maxVal) * 100;
                    return { label, h1, val1 };
                  });

                  // SVG dimensions
                  const w = 1000;
                  const h = 160;
                  const step = w / (data.length > 1 ? data.length - 1 : 1);
                  
                  // Coordinate generator (margin to prevent clipping dots)
                  const getCoords = (percent: number, idx: number) => {
                    const x = idx * step;
                    const y = (100 - percent) / 100 * (h - 20) + 10;
                    return { x, y };
                  };

                  const points1 = data.map((d, i) => getCoords(d.h1, i));

                  const createSmoothPath = (points: {x: number, y: number}[]) => {
                    if (points.length === 0) return '';
                    return points.map((point, i, a) => {
                      if (i === 0) return `M ${point.x},${point.y}`;
                      const prev = a[i - 1];
                      // Control points for a horizontal bezier curve
                      const cp1x = prev.x + (point.x - prev.x) * 0.4;
                      const cp1y = prev.y;
                      const cp2x = point.x - (point.x - prev.x) * 0.4;
                      const cp2y = point.y;
                      return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
                    }).join(' ');
                  };

                  const path1 = createSmoothPath(points1);
                  const areaPath = `${path1} L ${w},${h} L 0,${h} Z`;

                  return (
                    <div className="relative z-10 w-full h-full flex flex-col">
                      <div className="relative flex-1 w-full pb-8">
                        <svg viewBox={`-15 0 ${w + 30} ${h}`} className="absolute inset-0 w-full h-full overflow-visible" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="gradientCompleted" x1="0" x2="0" y1="0" y2="1">
                              <stop offset="0%" stopColor="currentColor" className="text-primary" stopOpacity="0.25" />
                              <stop offset="100%" stopColor="currentColor" className="text-primary" stopOpacity="0.0" />
                            </linearGradient>
                          </defs>

                          {/* Completed Area */}
                          <path d={areaPath} fill="url(#gradientCompleted)" />

                          {/* Completed Line */}
                          <path 
                            d={path1} fill="none" stroke="currentColor" className="text-primary" 
                            strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" 
                            style={{ filter: 'drop-shadow(0px 6px 8px rgba(242,101,34,0.3))' }}
                          />
                          
                          {/* Dots */}
                          {data.map((d, i) => {
                            const p1 = points1[i];
                            return (
                              <g key={i}>
                                {/* Completed Dot */}
                                <circle cx={p1.x} cy={p1.y} r="6.5" fill="#fff" className="text-primary" stroke="currentColor" strokeWidth="4">
                                  <title>Bookings: {Math.round(d.val1)}</title>
                                </circle>
                              </g>
                            );
                          })}
                        </svg>
                      </div>

                      {/* X-axis labels */}
                      <div className="absolute bottom-0 left-0 w-full h-6">
                        {data.map((d, idx) => (
                          <span 
                            key={d.label} 
                            className="absolute font-label-sm text-[10px] md:text-[12px] text-on-surface-variant whitespace-nowrap"
                            style={{ left: `${(idx / (data.length - 1)) * 100}%`, transform: 'translateX(-50%)' }}
                          >
                            {d.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
          
          <div className="px-4 md:px-margin-screen flex flex-col gap-4 mt-2">
            <div className="flex items-center gap-2 mb-2">
              <span className="material-symbols-outlined text-[22px] text-primary">list_alt</span>
              <h2 className="font-headline-md text-headline-md text-on-surface font-extrabold">All Bookings</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {allBookings.length === 0 && (
                <div className="col-span-full bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-2xl p-8 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">event_busy</span>
                  <p className="font-body-md font-medium">No bookings found.</p>
                </div>
              )}
              
              {allBookings.map(booking => {
                const isPending = booking.status === 'PENDING';
                const isCancelled = booking.status === 'CANCELLED';
                const isCompleted = booking.status === 'COMPLETED';
                const isCheckedIn = booking.status === 'CHECKED_IN';
                
                let accentColor = 'bg-primary-container';
                let badgeClass = 'bg-primary-fixed text-on-primary-fixed';
                let iconColor = 'text-primary';
                
                if (isCancelled) {
                  accentColor = 'bg-outline-variant';
                  badgeClass = 'bg-error-container text-on-error-container';
                  iconColor = 'text-error';
                } else if (isCompleted) {
                  accentColor = 'bg-secondary';
                  badgeClass = 'bg-secondary-container text-on-secondary-container';
                  iconColor = 'text-secondary';
                } else if (isCheckedIn) {
                  accentColor = 'bg-tertiary';
                  badgeClass = 'bg-tertiary-container text-on-tertiary-container';
                  iconColor = 'text-tertiary';
                }

                return (
                  <div 
                    key={booking.booking_id} 
                    className="relative bg-surface-container-lowest rounded-2xl p-4 shadow-sm border border-outline-variant/20 hover:border-primary/30 transition-all cursor-pointer flex overflow-hidden"
                    onClick={() => setSelectedBookingId(booking.booking_id)}
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`}></div>
                    
                    <div className="flex flex-col w-full min-w-0 pl-2">
                      {/* Top Row: Name and Status */}
                      <div className="flex items-start justify-between gap-2 mb-3 w-full">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="font-headline-sm font-bold text-on-surface truncate">
                            {booking.student?.first_name} {booking.student?.last_name}
                          </span>
                          <span className="font-label-sm text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-md truncate max-w-20 shrink-0">
                            @{booking.student?.username}
                          </span>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2.5 py-0.5 rounded-full font-label-sm font-bold uppercase tracking-wide ${badgeClass}`}>
                            {booking.status}
                          </span>
                          {(booking.status === 'CANCELLED' || booking.status === 'CHECKED_IN' || booking.status === 'COMPLETED') && booking.updated_at && (
                            <span className="text-[10px] text-on-surface-variant font-medium whitespace-nowrap">
                              {booking.status === 'CANCELLED' ? 'ยกเลิกเมื่อ ' : booking.status === 'CHECKED_IN' ? 'เข้าเล่นเมื่อ ' : 'เสร็จสิ้นเมื่อ '}
                              {new Date(booking.updated_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Bottom Row: Details and Time */}
                      <div className="flex flex-wrap items-end justify-between gap-2 mt-auto w-full">
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-body-sm text-on-surface-variant">
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="material-symbols-outlined text-[14px]">stadium</span> Court {booking.court}</span>
                          <span className="flex items-center gap-1 whitespace-nowrap"><span className="material-symbols-outlined text-[14px]">calendar_today</span> {booking.booking_date}</span>
                        </div>
                        <span className="font-headline-sm font-extrabold text-on-surface shrink-0">
                          {(booking.time_in || '').slice(0, 5)} - {(booking.time_out || '').slice(0, 5)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Admin Booking Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-scrim/60 backdrop-blur-sm" onClick={() => setSelectedBookingId(null)}></div>
            <div className="relative bg-surface w-full max-w-md rounded-3xl p-6 shadow-2xl border border-surface-container-high animate-in zoom-in-95 duration-200">
              <button 
                onClick={() => setSelectedBookingId(null)} 
                className="absolute top-4 right-4 text-on-surface-variant hover:text-on-surface transition-colors"
              >
                <span className="material-symbols-outlined text-[24px]">close</span>
              </button>
              
              <div className="text-center mb-6 mt-2">
                <h3 className="font-headline-lg font-bold text-on-surface mb-1">Booking Details</h3>
                <p className="font-body-md text-on-surface-variant">{selectedBooking.student?.first_name} {selectedBooking.student?.last_name} (@{selectedBooking.student?.username})</p>
                <p className="font-headline-sm text-primary font-bold mt-2 bg-primary-container/30 inline-block px-4 py-1.5 rounded-full">
                  Court {selectedBooking.court} • {(selectedBooking.time_in || '').slice(0,5)} - {(selectedBooking.time_out || '').slice(0,5)}
                </p>
              </div>

              {selectedBooking.status === 'PENDING' && (() => {
                const now = new Date();
                const bookingDateTime = new Date(`${selectedBooking.booking_date}T${selectedBooking.time_in}`);
                const isEarly = now < bookingDateTime;

                return (
                  <div className="flex flex-col items-center gap-5 mt-4">
                    {isEarly ? (
                      <div className="bg-surface-container-highest p-6 rounded-2xl border border-surface-container-high w-full text-center">
                        <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-2">schedule</span>
                        <p className="font-label-lg font-bold text-on-surface">Too Early for Check-in</p>
                        <p className="font-body-sm text-on-surface-variant mt-2">
                          QR Code will be available when the booking time starts.
                        </p>
                      </div>
                    ) : (
                      <>
                        <div className="bg-white p-5 rounded-3xl shadow-sm border border-surface-container-high">
                          <QRCode 
                            value={selectedBooking.court?.toString() || 'court'} 
                            size={200}
                            level="H"
                          />
                        </div>
                        <p className="font-body-sm text-on-surface-variant text-center px-4">
                          Ask the user to scan this QR code with their app to check in and start their session.
                        </p>
                      </>
                    )}
                  </div>
                );
              })()}

              {selectedBooking.status === 'CHECKED_IN' && (
                <div className="flex flex-col items-center gap-5 mt-4">
                  <div className="text-center p-6 bg-tertiary-container text-on-tertiary-container rounded-2xl w-full border border-tertiary/20">
                    <p className="font-label-sm font-bold uppercase tracking-wider mb-2">Time Remaining</p>
                    <p className="text-5xl font-mono font-black">{bookingTimeRemaining}</p>
                  </div>
                  
                  <button 
                    onClick={() => handleFinishBooking(selectedBooking.booking_id)}
                    className="w-full bg-error text-on-error font-label-lg font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:bg-error/90 active:scale-95"
                  >
                    <span className="material-symbols-outlined">stop_circle</span>
                    Finish Early
                  </button>
                </div>
              )}

              {(selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'CANCELLED') && (
                <div className="flex flex-col items-center gap-3 mt-6 p-6 bg-surface-container-low rounded-2xl border border-surface-container-high">
                  <span className="material-symbols-outlined text-[48px] text-on-surface-variant">
                    {selectedBooking.status === 'COMPLETED' ? 'check_circle' : 'cancel'}
                  </span>
                  <p className="font-label-lg font-bold text-on-surface">
                    This booking is {selectedBooking.status.toLowerCase()}.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout width="full">
      <div className="flex flex-col w-full">
        
        {/* User Banner (smash-peach inspired) */}
        <div className="relative w-full overflow-hidden bg-primary-fixed text-on-primary-fixed dark:bg-surface-container-low dark:text-on-surface shrink-0">
          <div className="absolute -right-24 -top-36 w-md h-112 rounded-full border-48 border-primary/15"></div>
          <div className="absolute -bottom-44 left-1/3 w-104 h-104 rounded-full border border-primary-container/20"></div>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(#ffb469 1px, transparent 1px)', backgroundSize: '18px 18px' }}></div>
          
          <div className="relative z-10 flex flex-col mx-auto max-w-7xl px-6 md:px-10 pt-10 pb-16">
            <div className="flex items-center justify-between mb-10">
              <div className="flex items-center gap-3">
                <div className="grid w-11 h-11 place-items-center rounded-2xl bg-primary text-on-primary shadow-lg shadow-primary/20">
                  <span className="material-symbols-outlined text-[22px]">sports_tennis</span>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-primary">KMITL Badminton</p>
                  <p className="text-sm font-semibold">Player Dashboard</p>
                </div>
              </div>
              <span className="px-3 py-1.5 rounded-full border border-outline-variant bg-surface/60 text-on-surface text-[11px] font-black uppercase tracking-wider flex items-center gap-1">
                <span className="material-symbols-outlined text-[16px] text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {user.role}
              </span>
            </div>

            <div className="max-w-3xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary-container/25 bg-primary/20 px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 shadow-[0_0_10px_#4ade80] animate-pulse"></span> Ready to play
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight">Hi, {user.name} <span className="animate-bounce inline-block">🏸</span></h1>
              <p className="mt-4 max-w-xl text-base md:text-lg leading-7 text-on-primary-fixed-variant dark:text-on-surface-variant">
                Welcome back to your personal KMITL Badminton portal. Book a court, check your schedule, and get ready to smash.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 md:px-10 w-full flex flex-col gap-6 mt-8 pb-10">
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
                      <div className="font-headline-md text-headline-md text-primary font-extrabold flex items-center gap-1">
                        <span>{pendingBooking.court?.name}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">stadium</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="flex items-center gap-2 bg-surface-container-lowest py-2 px-2.5 rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">schedule</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">Time</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{pendingBooking.time_in?.slice(0, 5)} - {pendingBooking.time_out?.slice(0, 5)}</span>
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
                    className="col-span-3 h-12 rounded-xl bg-linear-to-r from-primary-container to-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(255,94,30,0.32)] active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    <span>Check-in (เช็คอิน)</span>
                  </button>
                  <button 
                    onClick={() => setBookingToCancel(pendingBooking.booking_id)}
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
                    <p className="font-label-sm text-[13px] font-bold text-on-surface-variant mb-1 tracking-widest">TIME REMAINING (ENDS AT {activeBooking.time_out?.slice(0, 5)})</p>
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
              className="cursor-pointer group relative overflow-hidden rounded-2xl bg-linear-to-br from-primary-container to-primary text-on-primary p-4 md:p-card-padding shadow-[0_8px_20px_rgba(255,94,30,0.28)] flex flex-col justify-between min-h-35 active:scale-[0.98] transition-transform"
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
              className="cursor-pointer group relative overflow-hidden rounded-2xl bg-surface-container-lowest text-on-surface p-4 md:p-card-padding shadow-md flex flex-col justify-between min-h-35 active:scale-[0.98] transition-transform"
            >
              <div className="absolute -right-3 -bottom-3 text-surface-container-high/40 pointer-events-none">
                <span className="material-symbols-outlined text-[84px] leading-none">qr_code_2</span>
              </div>
              <div className="w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center text-primary">
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
              {bookings?.slice(0, 3).map(booking => {
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
                  <div key={booking.booking_id} className="relative bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex items-center justify-between overflow-hidden">
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
                            <span className="material-symbols-outlined text-[13px]">schedule</span> {booking.time_in?.slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span className="font-medium">{booking.booking_date}</span>
                        </div>
                      </div>
                    </div>
                    <div className="shrink-0 pl-2">
                      {isPending ? (
                        <span className="material-symbols-outlined text-orange-500 text-[20px]">pending</span>
                      ) : isCancelled ? null : (
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
                กรุณาสแกน QR หน้าสนามเพื่อเช็คอิน หากยกเลิกช้าหรือมาสายเกิน 15 นาที ระบบจะนับว่าผิดกฎ 1 ครั้ง (สะสมความผิดครบ 2 ครั้งจะถูกแบน 24 ชั่วโมง)
              </p>
            </div>
          </section>

        </div>
      </div>

      <Dialog open={bookingToCancel !== null} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>ยืนยันการยกเลิกจองคอร์ท (Cancel Booking)</DialogTitle>
            <DialogDescription className="text-on-surface-variant pt-2 space-y-2">
              <p>คุณต้องการยกเลิกการจองคอร์ทนี้ใช่หรือไม่?</p>
              <ul className="list-disc pl-5 text-error font-medium">
                <li>ต้องยกเลิกก่อนครบ 15 นาทีหลังเวลาเริ่มจอง</li>
                <li>หากยกเลิกทันเวลา คุณสามารถจองคอร์ทใหม่ในวันนี้ได้ 1 ครั้ง</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookingToCancel(null)}>
              ปิด (Close)
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} className="bg-error hover:bg-error/90 text-on-error">
              ยืนยันยกเลิก (Confirm Cancel)
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}
