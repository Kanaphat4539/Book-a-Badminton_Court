'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { isSessionExpiredError } from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import MainLayout from '@/components/MainLayout';
import SportBanner from '@/components/SportBanner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Activity,
  RefreshCw,
  Download,
  SlidersHorizontal,
  CalendarCheck2,
  TrendingUp,
  TrendingDown,
  ArrowDownRight,
  ArrowUpRight,
  Gauge,
  Ban,
  Flame,
  Zap,
  LayoutGrid,
  Search,
  Shield,
  Calendar,
  Clock,
  RotateCcw,
  FileText,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  CheckCircle2,
  X
} from 'lucide-react';

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

  // Cybercourt telemetry filters & controls
  const [chartCourtFilter, setChartCourtFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CANCELLED' | 'ACTIVE'>('ALL');
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');

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
      const endTimeStr = `${selectedBooking.booking_date}T${selectedBooking.time_out}+07:00`;
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
      if (isSessionExpiredError(err)) return;
      console.error(err);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setAllBookings(response.data);
      const now = new Date();
      setLastSyncTime(`Today at ${now.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC+7`);
    } catch (err) {
      if (isSessionExpiredError(err)) return;
      console.error(err);
    }
  };

  const handleSyncRealtime = async () => {
    setIsSyncing(true);
    try {
      await fetchAllBookings();
      toast.success('Live telemetry synchronized');
    } catch {
      toast.error('Failed to sync telemetry');
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleExportLogs = () => {
    if (!allBookings.length) {
      toast.error('No booking records to export');
      return;
    }
    const headers = ['Booking ID', 'Student Name', 'Username', 'Court', 'Date', 'Time In', 'Time Out', 'Status', 'Updated At'];
    const rows = allBookings.map(b => [
      b.booking_id,
      `"${(b.student?.first_name || '') + ' ' + (b.student?.last_name || '')}"`,
      b.student?.username || '',
      b.court,
      b.booking_date,
      b.time_in,
      b.time_out,
      b.status,
      b.updated_at || ''
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `cybercourt-telemetry-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Logs exported to CSV');
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
        const endDateStr = `${activeBooking.booking_date}T${activeBooking.time_out}+07:00`;
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

  // Cybercourt Admin calculations
  const totalBookingsCount = allBookings.length > 0 ? allBookings.length : 1428;
  const cancelledBookings = allBookings.filter(b => b.status === 'CANCELLED');
  const cancelledCount = allBookings.length > 0 ? cancelledBookings.length : 12;
  const activeBookings = allBookings.filter(b => b.status === 'CHECKED_IN' || b.status === 'PENDING');
  const completedBookings = allBookings.filter(b => b.status === 'COMPLETED');
  const activeOrCompleted = activeBookings.length + completedBookings.length;
  const utilizationRate = allBookings.length > 0
    ? Math.min(98, Math.max(45, Math.round((activeOrCompleted / Math.max(allBookings.length, 1)) * 100)))
    : 84.6;
  const cancellationRate = allBookings.length > 0
    ? ((cancelledCount / allBookings.length) * 100).toFixed(1)
    : '4.2';

  const peakHours = (() => {
    if (!allBookings.length) return '18:00 - 21:00';
    const slotMap: Record<string, number> = {};
    allBookings.forEach(b => {
      const key = `${(b.time_in || '').slice(0, 5)} - ${(b.time_out || '').slice(0, 5)}`;
      slotMap[key] = (slotMap[key] || 0) + 1;
    });
    let maxSlot = '18:00 - 21:00';
    let maxC = 0;
    Object.entries(slotMap).forEach(([k, v]) => {
      if (v > maxC) {
        maxC = v;
        maxSlot = k;
      }
    });
    return maxSlot;
  })();

  const getChartData = () => {
    let labels: string[] = [];
    let baseData: number[] = [];

    if (statPeriod === 'Day') {
      labels = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      baseData = [12, 18, 35, 28, 68, 42];
    } else if (statPeriod === 'Week') {
      labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      baseData = [28, 25, 22, 32, 44, 78, 62];
    } else if (statPeriod === 'Month') {
      labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4'];
      baseData = [140, 165, 120, 195];
    } else {
      labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      baseData = [300, 320, 350, 340, 400, 420, 480, 500, 520, 550, 590, 650];
    }

    let factor = 1;
    if (chartCourtFilter === '1') factor = 0.32;
    else if (chartCourtFilter === '2') factor = 0.28;
    else if (chartCourtFilter === '3') factor = 0.22;
    else if (chartCourtFilter === '4') factor = 0.18;

    const values = baseData.map(v => Math.round(v * factor));
    return { labels, values };
  };

  const { labels: chartLabels, values: chartValues } = getChartData();
  const maxChartVal = Math.max(...chartValues, 80) * 1.15;
  const peakChartIdx = chartValues.indexOf(Math.max(...chartValues));
  const peakChartVal = chartValues[peakChartIdx];

  const chartPoints = chartValues.map((val, idx) => {
    const x = 60 + (idx / Math.max(chartValues.length - 1, 1)) * (935 - 60);
    const y = 260 - (val / maxChartVal) * (260 - 50);
    return { x, y, val, label: chartLabels[idx] };
  });

  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return '';
    return pts.map((pt, i, arr) => {
      if (i === 0) return `M ${pt.x} ${pt.y}`;
      const prev = arr[i - 1];
      const cp1x = prev.x + (pt.x - prev.x) * 0.45;
      const cp1y = prev.y;
      const cp2x = pt.x - (pt.x - prev.x) * 0.45;
      const cp2y = pt.y;
      return `C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${pt.x} ${pt.y}`;
    }).join(' ');
  };

  const chartLinePath = createSmoothPath(chartPoints);
  const chartAreaPath = chartPoints.length
    ? `${chartLinePath} L ${chartPoints[chartPoints.length - 1].x} 280 L ${chartPoints[0].x} 280 Z`
    : '';

  const filteredBookings = allBookings.filter(b => {
    if (statusFilter === 'CANCELLED' && b.status !== 'CANCELLED') return false;
    if (statusFilter === 'ACTIVE' && b.status !== 'CHECKED_IN' && b.status !== 'PENDING') return false;

    if (courtFilter !== 'ALL' && String(b.court) !== courtFilter) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const fullName = `${b.student?.first_name || ''} ${b.student?.last_name || ''}`.toLowerCase();
      const username = (b.student?.username || '').toLowerCase();
      const courtStr = `court ${b.court}`.toLowerCase();
      const idStr = String(b.booking_id);
      const dateStr = (b.booking_date || '').toLowerCase();
      if (!fullName.includes(q) && !username.includes(q) && !courtStr.includes(q) && !idStr.includes(q) && !dateStr.includes(q)) {
        return false;
      }
    }
    return true;
  });

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const pagedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const formatThaiTime = (dateStr?: string | Date) => {
    if (!dateStr) return '15:17';
    try {
      const d = new Date(dateStr);
      return d.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '15:17';
    }
  };

  const getInitials = (b: any) => {
    const fn = b.student?.first_name || '';
    const ln = b.student?.last_name || '';
    if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    if (b.student?.username) return b.student.username.slice(0, 2).toUpperCase();
    return 'TS';
  };

  if (!mounted) return null;
  if (!user) return null;

  if (user.role === 'ADMIN') {
    return (
      <MainLayout width="full">
        <div className="flex flex-col w-full">
          {/* Admin Banner */}
          <SportBanner
            contentClassName="px-4 sm:px-6 md:px-10 pt-8 sm:pt-10 pb-10 sm:pb-12"
            leading={
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="grid w-10 h-10 sm:w-11 sm:h-11 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 text-white shadow-lg shrink-0">
                  <Activity className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/90">KMITL Sports Complex</p>
                  <p className="text-xs sm:text-sm font-semibold text-white">Admin control center</p>
                </div>
              </div>
            }
            topRight={
              <button
                className="group inline-flex items-center justify-center h-8 sm:h-9 gap-1.5 sm:gap-2 px-3 sm:px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-all text-xs sm:text-sm font-medium backdrop-blur-sm"
                onClick={() => router.push('/admin/users')}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Users
              </button>
            }
            eyebrow="Live system overview"
            title="Good morning, Admin."
            subtitle="Stay on top of every booking, court schedule, and player experience in one place."
            meta={[
              <span key="campus" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">pin_drop</span> Lat Krabang Campus</span>,
              <span key="sync" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">schedule</span> Last synced {lastSyncTime.replace('Today at ', '') || 'just now'}</span>,
              <span key="sec" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">security</span> Secure admin mode</span>,
            ]}
          />

          <div className="w-full max-w-[1580px] mx-auto px-3.5 sm:px-6 lg:px-8 flex flex-col gap-4 sm:gap-6 mt-4 sm:mt-6 pb-16" data-purpose="dashboard-container">
            {/* BEGIN: TopBarNav */}
            <header className="glass-card rounded-2xl p-3.5 sm:p-5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3.5 sm:gap-4 shadow-hud-panel border-slate-200 dark:border-slate-800" data-purpose="top-navigation">
              {/* System Identity & Breadcrumb */}
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="relative flex items-center justify-center w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 shadow-cyber-glow-sm text-white dark:text-slate-950 shrink-0">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6 stroke-[2.5]" />
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping"></span>
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 sm:w-3 sm:h-3 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                    <span className="font-mono text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded bg-orange-50 text-orange-600 border border-orange-200 dark:bg-orange-500/15 dark:text-orange-400 dark:border-orange-500/30 tracking-wider">
                      CYBERCOURT OS v4.8
                    </span>
                    <div className="flex items-center gap-1.5 text-[10px] sm:text-xs font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      CORE SENSORS: ONLINE
                    </div>
                  </div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 font-thai">
                    Booking Statistics &amp; Telemetry
                    <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 font-thai block sm:inline mt-0.5 sm:mt-0">
                      {' '}| ระบบบริหารและวิเคราะห์การจองสนามอัจฉริยะ
                    </span>
                  </h1>
                </div>
              </div>

              {/* Controls: Timeframe Filter & Action Hub */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                {/* Segmented Time Range Selector */}
                <nav aria-label="Timeframe Navigation" className="grid grid-cols-4 sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-inner w-full sm:w-auto" data-purpose="timeframe-filter">
                  {(['Day', 'Week', 'Month', 'Year'] as const).map(period => (
                    <button
                      key={period}
                      onClick={() => setStatPeriod(period)}
                      className={
                        statPeriod === period
                          ? "relative px-2 sm:px-4 py-1.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-orange-600 to-amber-500 rounded-lg shadow-cyber-glow-sm transition-all flex items-center justify-center gap-1"
                          : "px-2 sm:px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 transition-colors text-center"
                      }
                    >
                      {statPeriod === period && <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>}
                      {period}
                    </button>
                  ))}
                </nav>

                {/* Quick Telemetry Actions */}
                <div className="grid grid-cols-3 sm:flex items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleSyncRealtime}
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-mono font-medium rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/90 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 transition-all shadow-sm"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-orange-600 dark:text-orange-400 ${isSyncing ? 'animate-spin' : ''}`} />
                    <span className="hidden sm:inline">SYNC</span>
                    <span className="sm:hidden">SYNC</span>
                  </button>
                  <button
                    onClick={handleExportLogs}
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-mono font-medium rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>EXPORT</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/users')}
                    title="Manage Users"
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-sm text-xs font-mono font-semibold"
                  >
                    <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>USERS</span>
                  </button>
                </div>
              </div>
            </header>
            {/* END: TopBarNav */}

            {/* BEGIN: MetricHudCards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-purpose="telemetry-overview-metrics">
              {/* Metric 1: Total Bookings */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Total Bookings ({statPeriod})
                  </span>
                  <span className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400">
                    <CalendarCheck2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                    {totalBookingsCount.toLocaleString()}
                  </span>
                  <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                    <TrendingUp className="w-3 h-3 mr-1 inline" />+18.4%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-thai">
                  <span>ความต้องการใช้งานคอร์ตรวม</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium">+210 จากสัปดาห์ก่อน</span>
                </div>
              </div>

              {/* Metric 2: Utilization Rate */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Court Utilization
                  </span>
                  <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400">
                    <Gauge className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-cyan-600 dark:text-cyan-300 tracking-tight">
                    {utilizationRate}%
                  </span>
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    OPTIMAL RANGE
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${utilizationRate}%` }}
                  ></div>
                </div>
              </div>

              {/* Metric 3: Active Cancellations */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-rose-200 dark:border-rose-500/30">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Cancelled Bookings
                  </span>
                  <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
                    <Ban className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                    {cancelledCount}
                  </span>
                  <span className="inline-flex items-center text-xs font-mono font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-500/20">
                    <ArrowDownRight className="w-3 h-3 mr-1 inline" />-{cancellationRate}%
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-thai">
                  <span>อัตรายกเลิกต่ำกว่าเกณฑ์</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-medium">Slot Release Auto</span>
                </div>
              </div>

              {/* Metric 4: Peak Activity Window */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    Peak Congestion
                  </span>
                  <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400">
                    <Flame className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight truncate">
                    {peakHours}
                  </span>
                </div>
                <div className="mt-3.5 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-thai">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" /> คอร์ต 1 - 4 จองเต็มอัตรา
                  </span>
                  <span className="font-mono text-slate-500">Peak Window</span>
                </div>
              </div>
            </section>
            {/* END: MetricHudCards */}

            {/* BEGIN: FuturisticBookingTrendsChart */}
            <section className="glass-card rounded-2xl p-4 sm:p-6 lg:p-7 shadow-hud-panel border-slate-200 dark:border-slate-800" data-purpose="interactive-trends-chart">
              {/* Chart Header Controls */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 pb-4 sm:pb-5 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></span>
                    <h2 className="text-base sm:text-lg md:text-xl font-bold tracking-tight text-slate-900 dark:text-white uppercase font-mono">
                      Booking Trends by {statPeriod}
                    </h2>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium font-mono">
                      LIVE TELEMETRY
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-thai mt-0.5">
                    กราฟวิเคราะห์ปริมาณการสำรองสนามรายสัปดาห์ แยกตามแต่ละช่วงเวลาและสนาม
                  </p>
                </div>

                {/* Court Filters inside chart header (Courts 1 - 4, No VIP) */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline font-medium shrink-0">ARENA:</span>
                  {[
                    { id: 'ALL', label: 'ALL COURTS' },
                    { id: '1', label: 'COURT 1' },
                    { id: '2', label: 'COURT 2' },
                    { id: '3', label: 'COURT 3' },
                    { id: '4', label: 'COURT 4' },
                  ].map(f => (
                    <button
                      key={f.id}
                      onClick={() => setChartCourtFilter(f.id)}
                      className={`shrink-0 px-2.5 sm:px-3 py-1 text-xs font-mono font-semibold rounded-lg transition ${
                        chartCourtFilter === f.id
                          ? 'bg-orange-500 text-white shadow-sm border border-orange-600'
                          : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* High-Tech SVG Rendered Chart */}
              <div className="mt-4 sm:mt-6 relative" data-purpose="chart-viewport">
                {/* Desktop Peak Tooltip Card */}
                <div
                  className="hidden lg:flex flex-col absolute top-2 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-orange-300 dark:border-orange-500/40 shadow-cyber-glow pointer-events-none transform -translate-x-1/2 transition-all duration-300"
                  style={{
                    left: `${Math.min(88, Math.max(12, (chartPoints[peakChartIdx]?.x / 1000) * 100))}%`
                  }}
                >
                  <div className="flex items-center justify-between gap-3 text-xs font-mono">
                    <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 animate-ping"></span>
                      {chartLabels[peakChartIdx]?.toUpperCase()} PEAK
                    </span>
                    <span className="text-slate-900 dark:text-white font-extrabold">{peakChartVal} SLOTS</span>
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300 font-thai mt-1 font-medium">
                    อัตราจองเต็มสูงสุดประจำสัปดาห์ (14:00 - 22:00)
                  </p>
                </div>

                {/* Mobile Peak Information Bar */}
                <div className="flex lg:hidden items-center justify-between p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-xs font-mono mb-3">
                  <span className="text-orange-600 dark:text-orange-400 font-bold flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    {chartLabels[peakChartIdx]?.toUpperCase()} PEAK: {peakChartVal} SLOTS
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-thai text-[11px]">ช่วงเวลาจองสูงสุด (14:00 - 22:00)</span>
                </div>

                {/* SVG Graph Viewport */}
                <div className="w-full overflow-x-auto scrollbar-thin pb-2 sm:pb-0">
                  <div className="min-w-[620px] sm:min-w-[700px] h-[260px] sm:h-[320px] relative">
                    <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 1000 320">
                      <defs>
                        {/* Light Area Gradient */}
                        <linearGradient id="cyberAreaGradientLight" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#EA580C" stopOpacity="0.28" />
                          <stop offset="45%" stopColor="#F97316" stopOpacity="0.14" />
                          <stop offset="85%" stopColor="#FB923C" stopOpacity="0.04" />
                          <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.0" />
                        </linearGradient>
                        {/* Dark Area Gradient */}
                        <linearGradient id="cyberAreaGradientDark" x1="0" x2="0" y1="0" y2="1">
                          <stop offset="0%" stopColor="#FF5500" stopOpacity="0.38" />
                          <stop offset="45%" stopColor="#FF7A00" stopOpacity="0.18" />
                          <stop offset="85%" stopColor="#FF9900" stopOpacity="0.04" />
                          <stop offset="100%" stopColor="#0B0F19" stopOpacity="0.0" />
                        </linearGradient>

                        {/* Light Line Gradient */}
                        <linearGradient id="cyberLineGradientLight" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#C2410C" />
                          <stop offset="35%" stopColor="#EA580C" />
                          <stop offset="70%" stopColor="#F97316" />
                          <stop offset="100%" stopColor="#FB923C" />
                        </linearGradient>
                        {/* Dark Line Gradient */}
                        <linearGradient id="cyberLineGradientDark" x1="0" x2="1" y1="0" y2="0">
                          <stop offset="0%" stopColor="#DD4B00" />
                          <stop offset="35%" stopColor="#F97316" />
                          <stop offset="70%" stopColor="#FF8A00" />
                          <stop offset="100%" stopColor="#FFA826" />
                        </linearGradient>

                        {/* Glow Filters */}
                        <filter id="neonGlowLight" width="140%" height="140%" x="-20%" y="-20%">
                          <feGaussianBlur stdDeviation="3.5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                        <filter id="neonGlowDark" width="140%" height="140%" x="-20%" y="-20%">
                          <feGaussianBlur stdDeviation="5" result="blur" />
                          <feMerge>
                            <feMergeNode in="blur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>

                      {/* Clean Grid Horizontal Guides */}
                      <g className="stroke-slate-200 dark:stroke-slate-800" strokeDasharray="4 6" strokeWidth="1.2">
                        <line x1="40" x2="960" y1="50" y2="50" />
                        <line x1="40" x2="960" y1="110" y2="110" />
                        <line x1="40" x2="960" y1="170" y2="170" />
                        <line x1="40" x2="960" y1="230" y2="230" />
                      </g>

                      {/* Grid Metric Labels on Left */}
                      <g className="text-[11px] font-mono fill-slate-400 dark:fill-slate-500 font-semibold select-none">
                        <text x="15" y="54">80</text>
                        <text x="15" y="114">60</text>
                        <text x="15" y="174">40</text>
                        <text x="15" y="234">20</text>
                      </g>

                      {/* Area Gradients: Light vs Dark */}
                      <path d={chartAreaPath} className="block dark:hidden" fill="url(#cyberAreaGradientLight)" />
                      <path d={chartAreaPath} className="hidden dark:block" fill="url(#cyberAreaGradientDark)" />

                      {/* Curve Lines: Light vs Dark */}
                      <path
                        d={chartLinePath}
                        className="block dark:hidden"
                        fill="none"
                        filter="url(#neonGlowLight)"
                        stroke="url(#cyberLineGradientLight)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="5"
                      />
                      <path
                        d={chartLinePath}
                        className="hidden dark:block"
                        fill="none"
                        filter="url(#neonGlowDark)"
                        stroke="url(#cyberLineGradientDark)"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="6"
                      />

                      {/* Interactive Node Points */}
                      {chartPoints.map((pt, i) => {
                        const isPeak = i === peakChartIdx;
                        return (
                          <g
                            key={i}
                            className="cursor-pointer group"
                            transform={`translate(${pt.x}, ${pt.y})`}
                          >
                            <circle
                              className={isPeak ? "animate-ping" : "group-hover:scale-125 transition-transform"}
                              fill="#EA580C"
                              fillOpacity={isPeak ? 0.35 : 0.2}
                              r={isPeak ? 16 : 12}
                            />
                            {isPeak && (
                              <circle fill="#F97316" fillOpacity="0.3" r="13" />
                            )}
                            <circle
                              fill="#EA580C"
                              r={isPeak ? 9 : 8}
                              stroke="#FFFFFF"
                              strokeWidth={isPeak ? 3.5 : 3}
                              className="dark:stroke-slate-900"
                            />
                          </g>
                        );
                      })}

                      {/* Baseline X Axis Line */}
                      <line stroke="currentColor" className="text-slate-300 dark:text-slate-800" strokeWidth="1.5" x1="40" x2="960" y1="280" y2="280" />
                    </svg>

                    {/* X-Axis Labels */}
                    <div className="flex justify-between items-center px-4 sm:px-14 pt-3 font-mono text-[11px] sm:text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {chartLabels.map((lbl, idx) => {
                        const isPeak = idx === peakChartIdx;
                        return isPeak ? (
                          <span key={lbl} className="text-orange-600 dark:text-orange-400 font-bold bg-orange-50 dark:bg-orange-500/10 px-2 sm:px-2.5 py-0.5 rounded border border-orange-200 dark:border-orange-500/30 shadow-sm">
                            {lbl} (Peak)
                          </span>
                        ) : (
                          <span key={lbl} className="hover:text-orange-600 dark:hover:text-orange-400 transition cursor-default">
                            {lbl}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Chart Legend / Footnotes */}
              <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2.5">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-3.5 h-1.5 rounded-full bg-orange-500"></span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">All Booked Slots (Gross Total)</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-900 bg-orange-600 shadow-sm"></span>
                    <span className="font-medium text-slate-700 dark:text-slate-300">Verified Check-in Milestone</span>
                  </div>
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                  Last calculation synced: <span className="text-slate-800 dark:text-slate-200 font-semibold">{lastSyncTime || 'Today at 15:20:41 UTC+7'}</span>
                </div>
              </div>
            </section>
            {/* END: FuturisticBookingTrendsChart */}

            {/* BEGIN: AllBookingsSection */}
            <section className="space-y-3.5 sm:space-y-4" data-purpose="all-bookings-management-hub">
              {/* Section Header & Filter Toolbar */}
              <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 sm:gap-4">
                {/* Section Title with Count Badge */}
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="p-2 sm:p-2.5 rounded-xl bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400 shadow-sm shrink-0">
                    <LayoutGrid className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2 font-thai">
                        All Bookings
                      </h2>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-700">
                        {filteredBookings.length} Records Listed
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-thai">
                      รายการบันทึกการจองคอร์ตทั้งหมด พร้อมสถานะและประวัติการยกเลิกเรียลไทม์
                    </p>
                  </div>
                </div>

                {/* Filter & Search Controls */}
                <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-3 w-full lg:w-auto">
                  {/* Search input */}
                  <div className="relative flex-1 sm:w-60 lg:w-64">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                      className="w-full pl-9 pr-8 py-2 text-xs font-mono bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700 rounded-xl focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 transition shadow-sm"
                      placeholder="Search user, ID or court..."
                      type="text"
                    />
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Status Selector Pill Filter */}
                  <div className="grid grid-cols-3 sm:flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-mono w-full sm:w-auto">
                    <button
                      onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'ALL'
                          ? 'bg-orange-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      ALL
                    </button>
                    <button
                      onClick={() => { setStatusFilter('CANCELLED'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'CANCELLED'
                          ? 'bg-rose-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      CANCELLED
                    </button>
                    <button
                      onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'ACTIVE'
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      ACTIVE
                    </button>
                  </div>

                  {/* Court Dropdown Filter (Courts 1 - 4, No VIP) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={courtFilter}
                      onChange={(e) => { setCourtFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full sm:w-auto text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 focus:ring-0 cursor-pointer shadow-sm font-medium"
                    >
                      <option value="ALL">All Courts</option>
                      <option value="1">Court 1</option>
                      <option value="2">Court 2</option>
                      <option value="3">Court 3</option>
                      <option value="4">Court 4</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Bookings 3-Column Futuristic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4" data-purpose="booking-card-grid">
                {pagedBookings.length === 0 ? (
                  <div className="col-span-full glass-card rounded-2xl p-10 sm:p-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[42px] sm:text-[48px] opacity-30 mb-2">event_busy</span>
                    <p className="font-semibold text-sm sm:text-base">No booking records found</p>
                    <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                  </div>
                ) : (
                  pagedBookings.map((booking) => {
                    const isCancelled = booking.status === 'CANCELLED';
                    const isCheckedIn = booking.status === 'CHECKED_IN';
                    const isPending = booking.status === 'PENDING';
                    const isCompleted = booking.status === 'COMPLETED';

                    const borderLeftClass = isCancelled
                      ? 'border-l-4 border-l-rose-500'
                      : isCheckedIn
                      ? 'border-l-4 border-l-emerald-500'
                      : isPending
                      ? 'border-l-4 border-l-amber-500'
                      : 'border-l-4 border-l-cyan-500';

                    const initials = getInitials(booking);

                    return (
                      <article
                        key={booking.booking_id}
                        onClick={() => setSelectedBookingId(booking.booking_id)}
                        className={`glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden group shadow-hud-panel cursor-pointer ${borderLeftClass}`}
                        data-purpose="court-card-item"
                      >
                        <div className="flex items-start justify-between gap-2.5 sm:gap-3">
                          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold font-mono text-xs sm:text-sm border shadow-sm shrink-0 ${
                                isCancelled
                                  ? 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                                  : 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-500/30'
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base truncate">
                                  {booking.student?.first_name} {booking.student?.last_name}
                                </h3>
                                {booking.student?.role === 'ADMIN' ? (
                                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800 font-bold">
                                    ADMIN
                                  </span>
                                ) : (
                                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold">
                                    MEMBER
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-mono text-orange-600 dark:text-orange-400 font-medium truncate max-w-[130px] sm:max-w-[160px]">
                                @{booking.student?.username}
                              </div>
                            </div>
                          </div>

                          {/* Status Pill with Thai timestamp */}
                          <div className="text-right shrink-0">
                            {isCancelled && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 shadow-sm">
                                  CANCELLED
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-rose-600/90 dark:text-rose-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <RotateCcw className="w-3 h-3 text-rose-500" />
                                  ยกเลิกเมื่อ {formatThaiTime(booking.updated_at || booking.created_at)} น.
                                </div>
                              </>
                            )}
                            {isCheckedIn && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                                  ACTIVE
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-emerald-500" />
                                  เข้าเล่นเมื่อ {formatThaiTime(booking.updated_at || booking.created_at)} น.
                                </div>
                              </>
                            )}
                            {isPending && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                                  PENDING
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  รอเช็คอิน
                                </div>
                              </>
                            )}
                            {isCompleted && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm">
                                  COMPLETED
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-cyan-600 dark:text-cyan-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                                  เสร็จสิ้นเมื่อ {formatThaiTime(booking.updated_at || booking.created_at)} น.
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Divider line */}
                        <div className="my-3 sm:my-4 border-t border-slate-100 dark:border-slate-800"></div>

                        {/* Court, Date Grid */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono font-semibold">ARENA</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-xs">Court {booking.court}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono font-semibold">DATE</span>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs">{booking.booking_date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Time Slot Highlight Bar */}
                        <div className="mt-2.5 sm:mt-3 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                            <span className="text-[11px] sm:text-xs">Reserved Slot:</span>
                          </div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wider bg-white dark:bg-slate-900 px-2 sm:px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            {(booking.time_in || '').slice(0, 5)} - {(booking.time_out || '').slice(0, 5)}
                          </div>
                        </div>

                        {/* Telemetry Footer / Action Buttons */}
                        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">REF: #BK-{booking.booking_id}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId(booking.booking_id);
                              }}
                              className="hover:text-orange-600 dark:hover:text-orange-400 transition p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                              title="Details"
                            >
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId(booking.booking_id);
                              }}
                              className="hover:text-orange-600 dark:hover:text-orange-400 transition p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                              title="More"
                            >
                              <MoreVertical className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })
                )}
              </div>

              {/* Pagination */}
              <footer className="glass-card rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 shadow-hud-panel">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span className="text-center sm:text-left text-[11px] sm:text-xs">
                    Showing {pagedBookings.length} of {filteredBookings.length} weekly telemetry logs
                  </span>
                </div>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1)
                    .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                    .map((p, idx, arr) => (
                      <span key={p} className="flex items-center gap-1">
                        {idx > 0 && arr[idx - 1] !== p - 1 && <span className="px-1 text-slate-400 text-xs">...</span>}
                        <button
                          onClick={() => setCurrentPage(p)}
                          className={`px-2.5 sm:px-3 py-1 rounded-lg text-xs font-bold transition shadow-sm ${
                            currentPage === p
                              ? 'bg-orange-500 text-white'
                              : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {p}
                        </button>
                      </span>
                    ))}

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </footer>
            </section>
            {/* END: AllBookingsSection */}
          </div>

          {/* Admin Booking Modal */}
          {selectedBooking && (
            <div className="fixed inset-0 z-110 flex items-center justify-center p-4">
              <div
                className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
                onClick={() => setSelectedBookingId(null)}
              ></div>
              <div className="relative glass-card w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in zoom-in-95 duration-200 z-10">
                <button
                  onClick={() => setSelectedBookingId(null)}
                  className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="text-center mb-6 mt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs font-mono font-semibold border border-orange-200 dark:border-orange-500/30 mb-2">
                    REF: #BK-{selectedBooking.booking_id}
                  </div>
                  <h3 className="font-headline-lg font-bold text-slate-900 dark:text-white mb-1">Booking Telemetry</h3>
                  <p className="font-body-md text-slate-500 dark:text-slate-400">
                    {selectedBooking.student?.first_name} {selectedBooking.student?.last_name} (@{selectedBooking.student?.username})
                  </p>
                  <p className="font-mono text-sm text-orange-600 dark:text-orange-400 font-bold mt-2 bg-orange-50 dark:bg-orange-500/10 inline-block px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/30">
                    Court {selectedBooking.court} • {(selectedBooking.time_in || '').slice(0, 5)} - {(selectedBooking.time_out || '').slice(0, 5)}
                  </p>
                </div>

                {selectedBooking.status === 'PENDING' && (() => {
                  const now = new Date();
                  const bookingDateTime = new Date(`${selectedBooking.booking_date}T${selectedBooking.time_in}+07:00`);
                  const isEarly = now < bookingDateTime;

                  return (
                    <div className="flex flex-col items-center gap-5 mt-4">
                      {isEarly ? (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 w-full text-center">
                          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
                          <p className="font-label-lg font-bold text-slate-800 dark:text-slate-200">Too Early for Check-in</p>
                          <p className="font-body-sm text-slate-500 dark:text-slate-400 mt-2">
                            QR Code will be available when the booking time starts.
                          </p>
                        </div>
                      ) : (
                        <>
                          <div className="bg-white p-5 rounded-3xl shadow-sm border border-slate-200">
                            <QRCode
                              value={selectedBooking.court?.toString() || 'court'}
                              size={200}
                              level="H"
                            />
                          </div>
                          <p className="font-body-sm text-slate-500 dark:text-slate-400 text-center px-4">
                            Ask the player to scan this QR code with their app to check in and start their session.
                          </p>
                        </>
                      )}

                      <button
                        onClick={() => {
                          setBookingToCancel(selectedBooking.booking_id);
                          handleCancelBooking();
                          setSelectedBookingId(null);
                        }}
                        className="w-full bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 text-xs font-mono font-bold py-2.5 rounded-xl transition"
                      >
                        Cancel this Booking
                      </button>
                    </div>
                  );
                })()}

                {selectedBooking.status === 'CHECKED_IN' && (
                  <div className="flex flex-col items-center gap-5 mt-4">
                    <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl w-full border border-emerald-200 dark:border-emerald-800/40">
                      <p className="font-label-sm font-bold uppercase tracking-wider mb-2 font-mono text-emerald-600 dark:text-emerald-400">
                        Live Session In Progress
                      </p>
                      <p className="text-5xl font-mono font-black">{bookingTimeRemaining}</p>
                    </div>

                    <button
                      onClick={() => handleFinishBooking(selectedBooking.booking_id)}
                      className="w-full bg-rose-600 text-white font-label-lg font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:bg-rose-700 active:scale-95"
                    >
                      <span className="material-symbols-outlined">stop_circle</span>
                      Finish Early
                    </button>
                  </div>
                )}

                {(selectedBooking.status === 'COMPLETED' || selectedBooking.status === 'CANCELLED') && (
                  <div className="flex flex-col items-center gap-3 mt-6 p-6 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                    {selectedBooking.status === 'COMPLETED' ? (
                      <CheckCircle2 className="w-12 h-12 text-cyan-600 dark:text-cyan-400" />
                    ) : (
                      <Ban className="w-12 h-12 text-rose-600 dark:text-rose-400" />
                    )}
                    <p className="font-label-lg font-bold text-slate-800 dark:text-slate-200">
                      This booking is {selectedBooking.status.toLowerCase()}.
                    </p>
                    {selectedBooking.updated_at && (
                      <p className="text-xs font-mono text-slate-500">
                        Recorded at: {new Date(selectedBooking.updated_at).toLocaleString('th-TH')}
                      </p>
                    )}
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
        
        {/* User Banner */}
                <SportBanner
                  contentClassName="px-6 md:px-10 pt-10 pb-12"
                  leading={
                    <div className="flex items-center gap-3">
                      <div className="grid w-11 h-11 place-items-center rounded-2xl bg-white/20 ring-1 ring-white/30 text-white shadow-lg">
                        <span className="material-symbols-outlined text-[22px]">sports_tennis</span>
                      </div>
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/90">KMITL Badminton</p>
                        <p className="text-sm font-semibold text-white">Player Dashboard</p>
                      </div>
                    </div>
                  }
                  topRight={
                    <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      {user.role}
                    </span>
                  }
                  eyebrow="Ready to play"
                  title={<>Hi, {user.name}</>}
                  subtitle="Welcome back to your personal KMITL Badminton portal. Book a court, check your schedule, and get ready to smash."
                />

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
