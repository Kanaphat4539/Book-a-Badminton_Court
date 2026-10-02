'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import api, { isSessionExpiredError } from '@/lib/api';
import { toast } from 'sonner';
import QRCode from 'react-qr-code';
import MainLayout from '@/components/MainLayout';
import { useLocale } from '@/components/locale-provider';
import { adminDashboardCopy } from '@/lib/admin-dashboard-copy.cjs';
import { playerDashboardCopy } from '@/lib/player-dashboard-copy.cjs';
import dashboardActionCopy from '@/lib/dashboard-action-copy.cjs';
import {
  aggregateBookings,
  filterBookingLogs,
  formatBucketLabel,
  localizedStatus,
  safeDashboardError,
  STATUS_COLORS,
  statusDistribution,
} from '@/lib/dashboard-analytics.cjs';
import { AdminStatusDonut, AdminTrendChart, AdminUsageBars, type BreakdownRow } from '@/components/AdminAnalyticsCharts';
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
  const [timeLeft, setTimeLeft] = useState<string>('--:--:--');
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const selectedBooking = allBookings.find(b => b.booking_id === selectedBookingId) || null;
  const [bookingTimeRemaining, setBookingTimeRemaining] = useState<string>('--:--:--');
  const [serverOffset, setServerOffset] = useState<number>(0);
  const [showHistoryModal, setShowHistoryModal] = useState<boolean>(false);
  const [historyStatusFilter, setHistoryStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED'>('ALL');
  const [mounted, setMounted] = useState(false);
  const [bookingToCancel, setBookingToCancel] = useState<number | null>(null);
  const [statPeriod, setStatPeriod] = useState<'Day' | 'Week' | 'Month' | 'Year'>('Week');
  const [scrollY, setScrollY] = useState(0);

  // Cybercourt telemetry filters & controls
  const [chartCourtFilter, setChartCourtFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CANCELLED' | 'ACTIVE' | 'READY_CHECK_IN' | 'COMPLETED'>('ALL');
  const [courtFilter, setCourtFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [lastSyncTime, setLastSyncTime] = useState<string>('');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const { locale, t, formatDate } = useLocale();
  const c = adminDashboardCopy[locale];
  const p = playerDashboardCopy[locale];
  const actions = dashboardActionCopy(locale);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const sortBookingsList = (list: any[]) => {
    if (!Array.isArray(list)) return [];
    return [...list].sort((a, b) => {
      const dateComp = (b.booking_date || '').localeCompare(a.booking_date || '');
      if (dateComp !== 0) return dateComp;
      const timeComp = (b.time_in || '').localeCompare(a.time_in || '');
      if (timeComp !== 0) return timeComp;
      return (b.booking_id || b.id || 0) - (a.booking_id || a.id || 0);
    });
  };

  const syncServerTime = async () => {
    try {
      const res = await api.get('/time');
      if (res.data?.timestamp) {
        setServerOffset(res.data.timestamp - Date.now());
      }
    } catch {
      // ignore
    }
  };

  // Countdown timer for admin selected booking
  useEffect(() => {
    if (!selectedBooking || selectedBooking.status !== 'CHECKED_IN') return;

    const updateTimer = () => {
      const now = new Date(Date.now() + serverOffset);
      const endTimeStr = `${selectedBooking.booking_date}T${selectedBooking.time_out}+07:00`;
      const endTime = new Date(endTimeStr);

      const diff = endTime.getTime() - now.getTime();
      if (diff <= 0) {
        setBookingTimeRemaining('00:00:00');
        return;
      }

      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff / (1000 * 60)) % 60);
      const s = Math.floor((diff / 1000) % 60);
      setBookingTimeRemaining(
        `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      );
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [selectedBooking, serverOffset]);

  const handleFinishBooking = async (bookingId: number) => {
    if (!confirm(actions.finishConfirm)) return;
    try {
      await api.post(`/bookings/${bookingId}/finish`);
      toast.success(actions.finishSuccess);
      setSelectedBookingId(null);
      fetchAllBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || actions.finishFailed);
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
    syncServerTime();

    if (parsedUser.role === 'ADMIN') {
      fetchAllBookings();
      // Poll every 5 seconds
      const interval = setInterval(() => {
        fetchAllBookings();
      }, 5000);
      return () => clearInterval(interval);
    } else {
      fetchBookings();
      // Poll every 5 seconds so student dashboard reflects real-time status changes
      const interval = setInterval(() => {
        fetchBookings();
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [router]);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings/me');
      setBookings(sortBookingsList(response.data));
      if (response.headers?.date) {
        const serverHeaderTime = Date.parse(response.headers['date']);
        if (!isNaN(serverHeaderTime)) {
          setServerOffset(serverHeaderTime - Date.now());
        }
      }
    } catch (err) {
      if (isSessionExpiredError(err)) return;
      console.error(err);
    }
  };

  const fetchAllBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setAllBookings(sortBookingsList(response.data));
      const now = new Date();
      setLastSyncTime(`${c.todayAt}${formatDate(now)} ${now.toLocaleTimeString(locale === 'th' ? 'th-TH' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} UTC+7`);
      if (response.headers?.date) {
        const serverHeaderTime = Date.parse(response.headers['date']);
        if (!isNaN(serverHeaderTime)) {
          setServerOffset(serverHeaderTime - Date.now());
        }
      }
    } catch (err) {
      if (isSessionExpiredError(err)) return;
      console.error(err);
    }
  };

  const handleSyncRealtime = async () => {
    setIsSyncing(true);
    try {
      await fetchAllBookings();
      toast.success(actions.syncSuccess);
    } catch {
      toast.error(actions.syncFailed);
    } finally {
      setTimeout(() => setIsSyncing(false), 500);
    }
  };

  const handleExportLogs = async () => {
    if (!filteredBookings.length) {
      toast.error(actions.exportEmpty);
      return;
    }
    setIsExporting(true);
    try {
      // The workbook is generated by the backend (GET /bookings/export.xlsx) from the same
      // filters the table applies, so the file and the on-screen log cannot disagree.
      const response = await api.get('/bookings/export.xlsx', {
        params: {
          court: courtFilter,
          status: statusFilter,
          search: searchQuery.trim(),
          lang: locale,
          from: dateFrom,
          to: dateTo,
        },
        responseType: 'blob',
      });
      const disposition = String(response.headers?.['content-disposition'] || '');
      const match = /filename="?([^"]+)"?/.exec(disposition);
      const filename = match?.[1] || `booking-logs-${new Date().toISOString().slice(0, 10)}.xlsx`;
      const blobUrl = URL.createObjectURL(response.data as Blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
      toast.success(actions.exportSuccess);
    } catch (err) {
      if (isSessionExpiredError(err)) return;
      toast.error(safeDashboardError(err, 'export', locale));
    } finally {
      setIsExporting(false);
    }
  };



  const handleCancelBooking = async () => {
    if (!bookingToCancel) return;
    try {
      await api.post(`/bookings/${bookingToCancel}/cancel`);
      toast.success(actions.cancelSuccess);
      setBookingToCancel(null);
      fetchBookings();
      if (user?.role === 'ADMIN') {
        fetchAllBookings();
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || actions.cancelFailed);
    }
  };

  const handleResetDatabase = async () => {
    if (!confirm(actions.resetWarning)) return;
    if (!confirm(actions.resetConfirm)) return;
    try {
      await api.post('/bookings/reset');
      toast.success(actions.resetSuccess);
      fetchAllBookings();
    } catch (err: any) {
      toast.error(err.response?.data?.message || actions.resetFailed);
    }
  };

  // Find active checked-in booking
  const activeBooking = bookings.find(b => b.status === 'CHECKED_IN');
  const pendingBooking = bookings.find(b => b.status === 'PENDING');

  useEffect(() => {
    let interval: any;
    if (activeBooking && user?.role !== 'ADMIN') {
      const updatePlayerTimer = () => {
        const now = new Date(Date.now() + serverOffset);
        const endDateStr = `${activeBooking.booking_date}T${activeBooking.time_out}+07:00`;
        const endDate = new Date(endDateStr);
        const diff = endDate.getTime() - now.getTime();

        if (diff <= 0) {
          setTimeLeft('00:00:00');
          if (interval) clearInterval(interval);
          fetchBookings();
        } else {
          const h = Math.floor(diff / (1000 * 60 * 60));
          const m = Math.floor((diff / (1000 * 60)) % 60);
          const s = Math.floor((diff / 1000) % 60);
          setTimeLeft(
            `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
          );
        }
      };

      updatePlayerTimer();
      interval = setInterval(updatePlayerTimer, 1000);
    }
    return () => clearInterval(interval);
  }, [activeBooking, user, serverOffset]);

  // Cybercourt admin telemetry. Every number below is computed from the real booking
  // rows in `allBookings` (GET /bookings) — nothing here is estimated or hard-coded.
  const periodLabels: Record<'Day' | 'Week' | 'Month' | 'Year', string> = {
    Day: t('periodDay'),
    Week: t('periodWeek'),
    Month: t('periodMonth'),
    Year: t('periodYear'),
  };
  const formatNumber = (value: number) => value.toLocaleString(locale === 'th' ? 'th-TH' : 'en-US');
  const fillCopy = (template: string, values: Record<string, string>) =>
    Object.entries(values).reduce((text, [key, value]) => text.replace(`{${key}}`, value), template);
  const formatClockTime = (value?: string | Date) => {
    if (!value) return '—';
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
      timeZone: 'Asia/Bangkok',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };
  const getInitials = (b: any) => {
    const fn = b.student?.first_name || '';
    const ln = b.student?.last_name || '';
    if (fn && ln) return `${fn[0]}${ln[0]}`.toUpperCase();
    if (fn) return fn.slice(0, 2).toUpperCase();
    if (b.student?.username) return b.student.username.slice(0, 2).toUpperCase();
    return 'TS';
  };
  // The API can return either a court number or an expanded court object.
  const playerCourtName = (booking: { court?: number | string | { name?: string } | null }) => {
    const court = booking?.court;
    if (court && typeof court === 'object') return court.name || p.courtFallback;
    if (court === 0 || court) return fillCopy(p.courtPrefix, { court: String(court) });
    return p.courtFallback;
  };

  const analytics = useMemo(
    () => aggregateBookings(allBookings, { period: statPeriod, court: chartCourtFilter }),
    [allBookings, statPeriod, chartCourtFilter]
  );
  const trendLabels = useMemo(
    () => analytics.series.map((point) => formatBucketLabel(point.key, analytics.granularity, locale)),
    [analytics, locale]
  );
  const peakIndex = analytics.peak ? analytics.series.findIndex((point) => point.key === analytics.peak!.key) : null;
  const peakLabel = analytics.peak
    ? analytics.granularity === 'hour'
      ? `${analytics.peak.key}:00`
      : formatBucketLabel(analytics.peak.key, analytics.granularity, locale)
    : '—';
  const statusCounts = statusDistribution(analytics);
  const statusRows: BreakdownRow[] = (['PENDING', 'CHECKED_IN', 'COMPLETED', 'CANCELLED', 'OTHER'] as const).map((key) => ({
    key,
    label: localizedStatus(key, locale),
    count: statusCounts[key],
    share: analytics.total ? Math.round((statusCounts[key] / analytics.total) * 100) : 0,
    color: STATUS_COLORS[key],
  }));
  const courtRows: BreakdownRow[] = analytics.courts.map((entry) => ({
    key: String(entry.court),
    label: `${c.court} ${entry.court}`,
    count: entry.count,
    share: analytics.total ? Math.round((entry.count / analytics.total) * 100) : 0,
    color: '#f97316',
  }));
  const busiestCourt = analytics.courts.reduce((best, entry) => (entry.count > best.count ? entry : best), { court: 0, count: 0 });
  const cancellationPercent = analytics.total ? ((analytics.cancelled / analytics.total) * 100).toFixed(1) : '0.0';
  const deltaPercent = analytics.previousTotal ? Math.round(((analytics.total - analytics.previousTotal) / analytics.previousTotal) * 100) : null;
  const deltaText = analytics.delta === null
    ? c.noPreviousData
    : `${analytics.delta > 0 ? '+' : ''}${formatNumber(analytics.delta)} ${c.deltaVsPrevious}`;
  const dateRangeInvalid = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  // Same filter helper the XLSX export mirrors, so the table and the workbook always agree.
  const filteredBookings = filterBookingLogs(allBookings, {
    court: courtFilter,
    status: statusFilter,
    search: searchQuery,
    dateFrom,
    dateTo,
  });

  const itemsPerPage = 6;
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / itemsPerPage));
  const pagedBookings = filteredBookings.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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
                  <p className="text-xs sm:text-sm font-semibold text-white">{c.adminControlCenter}</p>
                </div>
              </div>
            }
            eyebrow={c.liveSystemOverview}
            title={c.greeting}
            subtitle={c.heroSubtitle}
            meta={[
              <span key="campus" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">pin_drop</span> {c.campus}</span>,
              <span key="sync" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">schedule</span> {c.lastSynced}{lastSyncTime.replace(c.todayAt, '') || c.justNow}</span>,
              <span key="sec" className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[13px] sm:text-[14px]">security</span> {c.secureMode}</span>,
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
                      {c.coreSensors}
                    </div>
                  </div>
                  <h1 className="text-lg sm:text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-0.5 font-thai">
                    {c.statsTitle}
                    <span className="text-xs sm:text-sm font-normal text-slate-500 dark:text-slate-400 font-thai block sm:inline mt-0.5 sm:mt-0">
                      {' '}| {c.adminSubtitle}
                    </span>
                  </h1>
                </div>
              </div>

              {/* Controls: Timeframe Filter & Action Hub */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full lg:w-auto">
                {/* Segmented Time Range Selector */}
                <nav aria-label={c.timeframeNav} className="grid grid-cols-4 sm:flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-inner w-full sm:w-auto" data-purpose="timeframe-filter">
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
                    <span className="hidden sm:inline">{c.sync}</span>
                    <span className="sm:hidden">{c.sync}</span>
                  </button>
                  <button
                    onClick={handleExportLogs}
                    disabled={isExporting}
                    aria-busy={isExporting}
                    title={c.exportNote}
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-mono font-medium rounded-xl bg-orange-50 hover:bg-orange-100 dark:bg-orange-500/10 dark:hover:bg-orange-500/20 border border-orange-200 dark:border-orange-500/40 text-orange-600 dark:text-orange-400 transition-all disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce' : ''}`} />
                    <span>{isExporting ? c.exporting : c.export}</span>
                  </button>
                  <button
                    onClick={() => router.push('/admin/users')}
                    title={c.manageUsers}
                    className="flex items-center justify-center gap-1.5 px-2.5 sm:px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 dark:bg-slate-800/80 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition shadow-sm text-xs font-mono font-semibold"
                  >
                    <Users className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                    <span>{c.users}</span>
                  </button>
                </div>
              </div>
            </header>
            {/* END: TopBarNav */}

            {/* BEGIN: MetricHudCards */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4" data-purpose="telemetry-overview-metrics">
              {/* Metric 1: Bookings in the selected period (real records) */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-orange-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {c.bookingsInPeriod}
                  </span>
                  <span className="p-2 rounded-lg bg-orange-50 dark:bg-orange-500/15 border border-orange-200 dark:border-orange-500/30 text-orange-600 dark:text-orange-400">
                    <CalendarCheck2 className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight">
                    {formatNumber(analytics.total)}
                  </span>
                  {deltaPercent !== null && (
                    <span
                      className={`inline-flex items-center text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                        deltaPercent >= 0
                          ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/20'
                          : 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/20'
                      }`}
                    >
                      {deltaPercent >= 0 ? <TrendingUp className="w-3 h-3 mr-1 inline" /> : <TrendingDown className="w-3 h-3 mr-1 inline" />}
                      {`${deltaPercent > 0 ? '+' : ''}${deltaPercent}%`}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-thai">
                  <span>{periodLabels[statPeriod]}</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300 font-medium truncate">{deltaText}</span>
                </div>
              </div>

              {/* Metric 2: Court utilization (booked hours vs offered hours) */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {c.courtUtilization}
                  </span>
                  <span className="p-2 rounded-lg bg-cyan-50 dark:bg-cyan-500/15 border border-cyan-200 dark:border-cyan-500/30 text-cyan-700 dark:text-cyan-400">
                    <Gauge className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-cyan-600 dark:text-cyan-300 tracking-tight">
                    {analytics.utilization.percent}%
                  </span>
                  <span
                    className="text-xs font-mono text-slate-500 dark:text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700 truncate max-w-[9rem]"
                    title={c.utilizationNote}
                  >
                    {periodLabels[statPeriod]}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 mt-3.5 overflow-hidden p-0.5 border border-slate-200 dark:border-slate-700">
                  <div
                    className="bg-gradient-to-r from-cyan-500 to-amber-500 h-full rounded-full transition-all duration-1000"
                    style={{ width: `${analytics.utilization.percent}%` }}
                  ></div>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  <span>{`${formatNumber(analytics.utilization.used)} / ${formatNumber(analytics.utilization.offered)}`}</span>
                  <span className="truncate" title={c.utilizationNote}>{c.utilizationNote}</span>
                </div>
              </div>

              {/* Metric 3: Cancelled bookings (real count + real rate) */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-rose-200 dark:border-rose-500/30">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-rose-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {c.cancelledBookings}
                  </span>
                  <span className="p-2 rounded-lg bg-rose-50 dark:bg-rose-500/15 border border-rose-200 dark:border-rose-500/30 text-rose-600 dark:text-rose-400">
                    <Ban className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-extrabold font-mono text-rose-600 dark:text-rose-400 tracking-tight">
                    {formatNumber(analytics.cancelled)}
                  </span>
                  <span className="inline-flex items-center text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-2 py-0.5 rounded border border-rose-200 dark:border-rose-500/20">
                    <ArrowDownRight className="w-3 h-3 mr-1 inline" />{`${cancellationPercent}%`}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-thai">
                  <span>{c.cancelBelowThreshold}</span>
                  <span className="font-mono text-rose-600 dark:text-rose-400 font-medium truncate">{c.cancellationRateLabel}</span>
                </div>
              </div>

              {/* Metric 4: Peak activity window (busiest bucket in this period) */}
              <div className="glass-card glass-card-hover rounded-2xl p-4 sm:p-5 relative overflow-hidden shadow-hud-panel border-slate-200 dark:border-slate-800">
                <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl pointer-events-none"></div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold">
                    {c.peakCongestion}
                  </span>
                  <span className="p-2 rounded-lg bg-amber-50 dark:bg-amber-500/15 border border-amber-200 dark:border-amber-500/30 text-amber-600 dark:text-amber-400">
                    <Flame className="w-4 h-4" />
                  </span>
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-xl sm:text-2xl lg:text-3xl font-extrabold font-mono text-slate-900 dark:text-white tracking-tight truncate">
                    {peakLabel}
                  </span>
                </div>
                <div className="mt-3.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium font-thai truncate">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-500 shrink-0" />
                    {analytics.peak ? `${formatNumber(analytics.peak.total)} ${c.chartSlots}` : c.noPeakYet}
                  </span>
                  <span className="font-mono truncate">
                    {`${c.busiestCourtLabel}: `}
                    <span className="text-slate-800 dark:text-slate-200 font-semibold">
                      {busiestCourt.count > 0 ? `${c.court} ${busiestCourt.court}` : '—'}
                    </span>
                  </span>
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
                      {c.chartTitle}
                    </h2>
                    <span className="text-[10px] sm:text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-medium font-mono">
                      {c.liveTelemetry}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-thai mt-0.5">
                    {c.chartSubtitle}
                  </p>
                </div>

                {/* Court Filters inside chart header (Courts 1 - 4) */}
                <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0 scrollbar-none w-full md:w-auto">
                  <span className="text-xs font-mono text-slate-500 dark:text-slate-400 mr-1 hidden sm:inline font-medium shrink-0">{c.arena}</span>
                  {[
                    { id: 'ALL', label: c.allCourtsUpper },
                    { id: '1', label: `${c.court} 1` },
                    { id: '2', label: `${c.court} 2` },
                    { id: '3', label: `${c.court} 3` },
                    { id: '4', label: `${c.court} 4` },
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

              {/* Responsive SVG trend chart: real booked slots vs verified check-ins */}
              <div className="mt-4 sm:mt-6">
                <AdminTrendChart
                  points={analytics.series}
                  axisLabels={trendLabels}
                  peakIndex={peakIndex}
                  seriesNames={{ total: c.allBookedSlots, checkins: c.verifiedCheckin, cancelled: c.statusCancelled }}
                  peakBadge={c.chartPeakBadge}
                  unitLabel={c.chartSlots}
                  emptyText={c.chartEmpty}
                  ariaLabel={c.chartAria}
                  loading={isSyncing}
                  loadingText={c.chartLoading}
                />
              </div>

              {/* Chart Legend / Footnotes */}
              <div className="mt-4 sm:mt-6 pt-3.5 sm:pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2.5">
                <div className="flex items-center gap-3 sm:gap-4 flex-wrap">
                  <span className="font-medium text-slate-700 dark:text-slate-300">{`${formatNumber(analytics.total)} ${c.recordsUnit}`}</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">{`${formatNumber(analytics.checkins)} ${c.verifiedCheckin}`}</span>
                </div>
                <div className="font-mono text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
                  {c.lastCalculationSynced}<span className="text-slate-800 dark:text-slate-200 font-semibold">{lastSyncTime || c.justNow}</span>
                </div>
              </div>
            </section>

            {/* BEGIN: BreakdownPanels — booked slots per court and status split */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4" data-purpose="analytics-breakdown">
              <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-hud-panel border-slate-200 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono uppercase tracking-tight">{c.panelCourtUsage}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-thai mt-0.5 mb-4">{c.panelCourtUsageSub}</p>
                <AdminUsageBars
                  rows={courtRows}
                  total={analytics.total}
                  totalLabel={c.panelTotal}
                  emptyText={c.panelNoData}
                  unitLabel={c.recordsUnit}
                />
              </div>
              <div className="glass-card rounded-2xl p-4 sm:p-6 shadow-hud-panel border-slate-200 dark:border-slate-800">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono uppercase tracking-tight">{c.panelStatusSplit}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-thai mt-0.5 mb-4">{c.panelStatusSplitSub}</p>
                <AdminStatusDonut
                  rows={statusRows}
                  total={analytics.total}
                  totalLabel={c.panelTotal}
                  emptyText={c.panelNoData}
                  unitLabel={c.recordsUnit}
                />
              </div>
            </section>
            {/* END: BreakdownPanels */}

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
                        {c.allBookings}
                      </h2>
                      <span className="px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800 text-orange-600 dark:text-orange-400 border border-slate-200 dark:border-slate-700">
                        {`${filteredBookings.length} ${c.recordsUnit}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-thai">
                      {c.tableSubtitle}
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
                      placeholder={c.searchPlaceholder}
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
                      {c.filterAll}
                    </button>
                    <button
                      onClick={() => { setStatusFilter('CANCELLED'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'CANCELLED'
                          ? 'bg-rose-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400'
                      }`}
                    >
                      {c.filterCancelled}
                    </button>
                    <button
                      onClick={() => { setStatusFilter('ACTIVE'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'ACTIVE'
                          ? 'bg-emerald-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
                      }`}
                    >
                      {c.filterActive}
                    </button>
                    <button
                      onClick={() => { setStatusFilter('COMPLETED'); setCurrentPage(1); }}
                      className={`px-2.5 py-1 rounded-lg transition font-medium text-center ${
                        statusFilter === 'COMPLETED'
                          ? 'bg-blue-500 text-white font-bold shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400'
                      }`}
                    >
                      {c.filterComplete}
                    </button>
                  </div>

                  {/* Court Dropdown Filter (Courts 1 - 4, No VIP) */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={courtFilter}
                      onChange={(e) => { setCourtFilter(e.target.value); setCurrentPage(1); }}
                      className="w-full sm:w-auto text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 focus:ring-0 cursor-pointer shadow-sm font-medium"
                    >
                      <option value="ALL">{c.allCourts}</option>
                      <option value="1">{c.court} 1</option>
                      <option value="2">{c.court} 2</option>
                      <option value="3">{c.court} 3</option>
                      <option value="4">{c.court} 4</option>
                    </select>
                  </div>

                  {/* Date range filter — inclusive bounds, identical to the XLSX export */}
                  <div className="flex items-center gap-1.5 w-full sm:w-auto">
                    <label className="relative flex-1 sm:w-36">
                      <span className="sr-only">{c.dateFromLabel}</span>
                      <input
                        type="date"
                        value={dateFrom}
                        max={dateTo || undefined}
                        aria-label={c.dateFromLabel}
                        onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 focus:ring-0 cursor-pointer shadow-sm"
                      />
                    </label>
                    <label className="relative flex-1 sm:w-36">
                      <span className="sr-only">{c.dateToLabel}</span>
                      <input
                        type="date"
                        value={dateTo}
                        min={dateFrom || undefined}
                        aria-label={c.dateToLabel}
                        onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1); }}
                        className="w-full text-xs font-mono bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-2.5 py-2 text-slate-700 dark:text-slate-200 focus:border-orange-500 focus:ring-0 cursor-pointer shadow-sm"
                      />
                    </label>
                    {(dateFrom || dateTo) && (
                      <button
                        type="button"
                        onClick={() => { setDateFrom(''); setDateTo(''); setCurrentPage(1); }}
                        title={c.clearDates}
                        aria-label={c.clearDates}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {dateRangeInvalid && (
                <p role="alert" className="text-xs font-medium text-rose-600 dark:text-rose-400">{c.dateRangeInvalid}</p>
              )}

              {/* Bookings 3-Column Futuristic Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4" data-purpose="booking-card-grid">
                {pagedBookings.length === 0 ? (
                  <div className="col-span-full glass-card rounded-2xl p-10 sm:p-12 text-center text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-[42px] sm:text-[48px] opacity-30 mb-2">event_busy</span>
                    <p className="font-semibold text-sm sm:text-base">{c.emptyTitle}</p>
                    <p className="text-xs mt-1">{c.emptyHint}</p>
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
                                    {c.roleAdmin}
                                  </span>
                                ) : (
                                  <span className="text-[9px] sm:text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700 font-semibold">
                                    {c.roleMember}
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
                                  {c.statusCancelled}
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-rose-600/90 dark:text-rose-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <RotateCcw className="w-3 h-3 text-rose-500" />
                                  {c.cancelledAt.replace('{time}', formatClockTime(booking.updated_at || booking.created_at))}
                                </div>
                              </>
                            )}
                            {isCheckedIn && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30 shadow-sm">
                                  {c.statusActive}
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-emerald-600 dark:text-emerald-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-emerald-500" />
                                  {c.startedAt.replace('{time}', formatClockTime(booking.updated_at || booking.created_at))}
                                </div>
                              </>
                            )}
                            {isPending && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30 shadow-sm">
                                  {c.statusPending}
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-amber-600 dark:text-amber-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <Clock className="w-3 h-3 text-amber-500" />
                                  {c.statusPending}
                                </div>
                              </>
                            )}
                            {isCompleted && (
                              <>
                                <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-xs font-mono font-bold bg-cyan-50 text-cyan-700 dark:bg-cyan-500/10 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/30 shadow-sm">
                                  {c.statusCompleted}
                                </span>
                                <div className="text-[10px] sm:text-[11px] text-cyan-600 dark:text-cyan-400 font-thai mt-1 flex items-center justify-end gap-1 font-medium">
                                  <CheckCircle2 className="w-3 h-3 text-cyan-500" />
                                  {c.completedAt.replace('{time}', formatClockTime(booking.updated_at || booking.created_at))}
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
                              <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono font-semibold">{c.cardCourt}</span>
                              <span className="font-bold text-slate-800 dark:text-slate-200 truncate block text-xs">{c.court} {booking.court}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                            <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            <div className="min-w-0">
                              <span className="block text-[9px] sm:text-[10px] text-slate-400 uppercase font-mono font-semibold">{c.cardDate}</span>
                              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200 truncate block text-xs">{booking.booking_date}</span>
                            </div>
                          </div>
                        </div>

                        {/* Time Slot Highlight Bar */}
                        <div className="mt-2.5 sm:mt-3 p-2 sm:p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-600 dark:text-slate-400 text-xs font-medium">
                            <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-500 shrink-0" />
                            <span className="text-[11px] sm:text-xs">{c.reservedSlot}</span>
                          </div>
                          <div className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tracking-wider bg-white dark:bg-slate-900 px-2 sm:px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 shadow-sm">
                            {(booking.time_in || '').slice(0, 5)} - {(booking.time_out || '').slice(0, 5)}
                          </div>
                        </div>

                        {/* Telemetry Footer / Action Buttons */}
                        <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-mono text-slate-500 dark:text-slate-400">
                          <span className="text-[10px] sm:text-[11px] text-slate-400 dark:text-slate-500">{c.reference}{booking.booking_id}</span>
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId(booking.booking_id);
                              }}
                              className="hover:text-orange-600 dark:hover:text-orange-400 transition p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                              title={c.details}
                            >
                              <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); router.push('/scan'); }}
                              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition p-1.5 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg text-slate-400"
                              title={c.goScanQr}
                            >
                              <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBookingId(booking.booking_id);
                              }}
                              className="hover:text-orange-600 dark:hover:text-orange-400 transition p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-400"
                              title={c.more}
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
                    {fillCopy(c.paginationShowing, { shown: String(pagedBookings.length), total: String(filteredBookings.length) })}
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
                    {c.reference}{selectedBooking.booking_id}
                  </div>
                  <h3 className="font-headline-lg font-bold text-slate-900 dark:text-white mb-1">{c.telemetryTitle}</h3>
                  <p className="font-body-md text-slate-500 dark:text-slate-400">
                    {selectedBooking.student?.first_name} {selectedBooking.student?.last_name} (@{selectedBooking.student?.username})
                  </p>
                  <p className="font-mono text-sm text-orange-600 dark:text-orange-400 font-bold mt-2 bg-orange-50 dark:bg-orange-500/10 inline-block px-4 py-1.5 rounded-full border border-orange-200 dark:border-orange-500/30">
                    {c.courtLine} {selectedBooking.court} • {(selectedBooking.time_in || '').slice(0, 5)} - {(selectedBooking.time_out || '').slice(0, 5)}
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
                          <p className="font-label-lg font-bold text-slate-800 dark:text-slate-200">{c.tooEarlyTitle}</p>
                          <p className="font-body-sm text-slate-500 dark:text-slate-400 mt-2">
                            {c.qrNotReady}
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
                            {c.qrInstruction}
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
                        {c.cancelThisBooking}
                      </button>
                    </div>
                  );
                })()}

                {selectedBooking.status === 'CHECKED_IN' && (
                  <div className="flex flex-col items-center gap-5 mt-4">
                    <div className="text-center p-6 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-2xl w-full border border-emerald-200 dark:border-emerald-800/40">
                      <p className="font-label-sm font-bold uppercase tracking-wider mb-2 font-mono text-emerald-600 dark:text-emerald-400">
                        {c.liveSession}
                      </p>
                      <p className="text-5xl font-mono font-black">{bookingTimeRemaining}</p>
                    </div>

                    <button
                      onClick={() => handleFinishBooking(selectedBooking.booking_id)}
                      className="w-full bg-rose-600 text-white font-label-lg font-bold py-3.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 hover:bg-rose-700 active:scale-95"
                    >
                      <span className="material-symbols-outlined">stop_circle</span>
                      {c.finishEarly}
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
                      {selectedBooking.status === 'COMPLETED' ? c.bookingCompleted : c.bookingCancelled}
                    </p>
                    {selectedBooking.updated_at && (
                      <p className="text-xs font-mono text-slate-500">
                        {c.recordedAt} {formatDate(selectedBooking.updated_at)}
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
                        <p className="text-sm font-semibold text-white">{p.bannerPortalLabel}</p>
                      </div>
                    </div>
                  }
                  topRight={
                    <span className="px-3 py-1.5 rounded-full bg-white/15 border border-white/25 text-white text-[11px] font-black uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
                      <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                      {user.role === 'ADMIN' ? p.roleAdmin : p.roleStudent}
                    </span>
                  }
                  eyebrow={p.bannerEyebrow}
                  title={<>{fillCopy(p.bannerTitle, { name: user.name })}</>}
                  subtitle={p.bannerSubtitle}
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
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{p.upcomingTitle}</h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{p.upcomingSubtitle}</span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span>
                    {p.confirmedBadge}
                  </span>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-semibold">{p.reservedCourtLabel}</span>
                      <div className="font-headline-md text-headline-md text-primary font-extrabold flex items-center gap-1">
                        <span>{playerCourtName(pendingBooking)}</span>
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
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{p.timeLabel}</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{pendingBooking.time_in?.slice(0, 5)} - {pendingBooking.time_out?.slice(0, 5)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 bg-surface-container-lowest py-2 px-2.5 rounded-lg shadow-sm">
                      <span className="material-symbols-outlined text-[18px] text-primary">calendar_today</span>
                      <div className="flex flex-col min-w-0">
                        <span className="font-label-sm text-label-sm text-on-surface-variant">{p.dateLabel}</span>
                        <span className="font-label-lg text-label-lg text-on-surface font-bold truncate">{formatDate(pendingBooking.booking_date)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-on-surface-variant pt-0.5">
                    <span className="material-symbols-outlined text-[15px] text-primary">pin_drop</span>
                    <span className="font-body-sm text-body-sm font-medium">{p.venueLabel}</span>
                  </div>
                </div>

                <div className="grid grid-cols-5 gap-2.5 mt-4">
                  <button 
                    onClick={() => router.push('/scan')}
                    className="col-span-3 h-12 rounded-xl bg-linear-to-r from-primary-container to-primary text-on-primary font-label-lg text-label-lg font-bold flex items-center justify-center gap-2 shadow-[0_6px_18px_rgba(255,94,30,0.32)] active:scale-95 transition-transform cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">qr_code_scanner</span>
                    <span>{p.checkInAction}</span>
                  </button>
                  <button 
                    onClick={() => setBookingToCancel(pendingBooking.booking_id)}
                    className="col-span-2 h-12 rounded-xl bg-error-container text-on-error-container font-label-lg text-label-lg font-bold flex items-center justify-center gap-1 active:scale-95 transition-transform hover:bg-opacity-90 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    <span>{p.cancelAction}</span>
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
                    <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{p.playingTitle}</h2>
                    <span className="font-body-sm text-body-sm text-on-surface-variant">{p.playingSubtitle}</span>
                  </div>
                  <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/10 text-secondary font-label-sm text-label-sm font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-ping"></span>
                    {p.activeBadge}
                  </span>
                </div>
                
                <div className="rounded-xl bg-surface-container-low p-3.5 flex flex-col gap-3 relative">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-label-sm text-label-sm text-on-surface-variant tracking-wider uppercase font-semibold">{p.activeCourtLabel}</span>
                      <div className="font-headline-md text-headline-md text-secondary font-extrabold flex items-center gap-1">
                        <span>{playerCourtName(activeBooking)}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-secondary shadow-sm">
                      <span className="material-symbols-outlined text-[24px]">stadium</span>
                    </div>
                  </div>
                  
                  <div className="text-center py-4 bg-surface-container-lowest rounded-lg shadow-sm border border-secondary/20">
                    <p className="font-label-sm text-[13px] font-bold text-on-surface-variant mb-1 tracking-widest">
                      {fillCopy(p.timeRemaining, { time: activeBooking.time_out?.slice(0, 5) || '—' })}
                    </p>
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
                <span className="font-headline-sm text-headline-sm font-extrabold leading-tight text-on-primary">{p.bookCourtTitle}</span>
                <span className="font-body-sm text-body-sm text-on-primary/80 font-medium">{p.bookCourtSubtitle}</span>
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
                <span className="font-headline-sm text-headline-sm font-extrabold leading-tight text-on-surface">{p.scanQrTitle}</span>
                <span className="font-body-sm text-body-sm text-on-surface-variant font-medium">{p.scanQrSubtitle}</span>
              </div>
            </div>
          </section>



          {/* 3. Recent Bookings Section */}
          <section className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[20px] text-primary">history</span>
                <h2 className="font-headline-sm text-headline-sm text-on-surface font-bold">{p.recentTitle}</h2>
              </div>
              {bookings.length > 0 && (
                <button onClick={() => setShowHistoryModal(true)} className="font-label-md text-label-md text-primary font-bold hover:underline flex items-center gap-0.5 cursor-pointer">
                  <span>{p.viewAll}</span>
                  <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                </button>
              )}
            </div>
            
            <div className="flex flex-col gap-2.5">
              {bookings.length === 0 && (
                <div className="bg-surface-container-lowest border border-outline-variant/30 shadow-sm rounded-xl p-6 text-center text-on-surface-variant">
                  <p className="font-body-md text-body-md font-medium">{p.noBookingsYet}</p>
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

                const courtName = playerCourtName(booking);

                return (
                  <div 
                    key={booking.booking_id} 
                    onClick={() => setShowHistoryModal(true)}
                    className="relative bg-surface-container-lowest rounded-xl p-3.5 shadow-sm flex items-center justify-between overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${accentColor}`}></div>
                    <div className="flex items-center gap-3 pl-1 min-w-0">
                      <div className={`w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0 ${iconColor}`}>
                        <span className="material-symbols-outlined text-[22px]">{statusIcon}</span>
                      </div>
                      <div className="flex flex-col min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-headline-sm text-headline-sm font-bold text-on-surface">{courtName}</span>
                          <span className={`px-2 py-0.5 rounded-full font-label-sm text-label-sm font-bold ${badgeClass}`}>
                            {localizedStatus(booking.status, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-on-surface-variant font-body-sm text-body-sm">
                          <span className="flex items-center gap-1 font-medium">
                            <span className="material-symbols-outlined text-[13px]">schedule</span> {(booking.time_in || '').slice(0, 5)} - {(booking.time_out || '').slice(0, 5)}
                          </span>
                          <span>•</span>
                          <span className="font-medium">{formatDate(booking.booking_date)}</span>
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
              <span className="font-label-md text-label-md text-on-surface font-bold">{p.rulesTitle}</span>
              <p className="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
                {p.rulesBody}
              </p>
            </div>
          </section>

        </div>
      </div>

      {/* Booking History Full Detail Dialog */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col p-0 overflow-hidden rounded-2xl bg-surface-container-lowest border border-outline-variant/30">
          <DialogHeader className="p-5 pb-3 border-b border-outline-variant/20 bg-surface-container-low/60 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[24px]">history</span>
                </div>
                <div>
                  <DialogTitle className="font-headline-sm text-lg font-bold text-on-surface">
                    {p.historyTitle}
                  </DialogTitle>
                  <DialogDescription className="font-body-sm text-xs text-on-surface-variant">
                    {fillCopy(p.historySubtitle, { count: String(bookings.length) })}
                  </DialogDescription>
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
              {(['ALL', 'ACTIVE', 'PENDING', 'COMPLETED', 'CANCELLED'] as const).map(tab => {
                const label = tab === 'ALL' ? p.historyTabAll
                  : tab === 'ACTIVE' ? p.historyTabActive
                  : tab === 'PENDING' ? p.historyTabPending
                  : tab === 'COMPLETED' ? p.historyTabCompleted
                  : p.historyTabCancelled;
                const count = tab === 'ALL' 
                  ? bookings.length 
                  : tab === 'ACTIVE' 
                    ? bookings.filter(b => b.status === 'CHECKED_IN').length
                    : bookings.filter(b => b.status === tab).length;
                const isSelected = historyStatusFilter === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setHistoryStatusFilter(tab)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-primary text-on-primary shadow-sm'
                        : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'
                    }`}
                  >
                    <span>{label}</span>
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-white/20 text-white' : 'bg-outline-variant/30 text-on-surface-variant'}`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </DialogHeader>

          {/* Modal Body / Scrollable List */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col gap-3">
            {(() => {
              const filtered = bookings.filter(b => {
                if (historyStatusFilter === 'ALL') return true;
                if (historyStatusFilter === 'ACTIVE') return b.status === 'CHECKED_IN';
                return b.status === historyStatusFilter;
              });

              if (filtered.length === 0) {
                return (
                  <div className="text-center py-12 text-on-surface-variant">
                    <span className="material-symbols-outlined text-[44px] opacity-30 mb-2">event_busy</span>
                    <p className="font-bold text-sm">{p.historyEmpty}</p>
                    <p className="text-xs opacity-70 mt-0.5">{p.historyEmptyHint}</p>
                  </div>
                );
              }

              return filtered.map(booking => {
                const isPending = booking.status === 'PENDING';
                const isCancelled = booking.status === 'CANCELLED';

                let badgeBg = 'bg-primary-fixed text-on-primary-fixed';
                let borderColor = 'border-primary/20';

                if (booking.status === 'CHECKED_IN') {
                  badgeBg = 'bg-secondary-container text-on-secondary-container';
                  borderColor = 'border-secondary/30';
                } else if (booking.status === 'COMPLETED') {
                  badgeBg = 'bg-sky-100 text-sky-800 dark:bg-sky-950/50 dark:text-sky-300';
                  borderColor = 'border-sky-300/30';
                } else if (isCancelled) {
                  badgeBg = 'bg-error-container text-on-error-container';
                  borderColor = 'border-error/20';
                }

                const courtName = playerCourtName(booking);

                return (
                  <div
                    key={booking.booking_id}
                    className={`p-4 rounded-xl bg-surface-container-low border ${borderColor} flex flex-col gap-3 shadow-xs hover:shadow-sm transition-all`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded-xl bg-surface-container-lowest flex items-center justify-center text-primary shadow-xs">
                          <span className="material-symbols-outlined text-[22px]">stadium</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-base text-on-surface">{courtName}</span>
                            <span className="text-xs font-mono text-on-surface-variant font-semibold bg-surface-container-high px-1.5 py-0.5 rounded">
                              #BK-{booking.booking_id}
                            </span>
                          </div>
                          <span className="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                            <span className="material-symbols-outlined text-[13px]">calendar_today</span> {formatDate(booking.booking_date)}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${badgeBg}`}>
                        {localizedStatus(booking.status, locale)}
                      </span>
                    </div>

                    {/* Details Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-outline-variant/20 text-xs">
                      <div className="flex flex-col">
                        <span className="text-on-surface-variant text-[11px]">{p.historyTimeLabel}</span>
                        <span className="font-bold text-on-surface">
                          {(booking.time_in || '').slice(0, 5)} - {(booking.time_out || '').slice(0, 5)}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-on-surface-variant text-[11px]">{p.historyDurationLabel}</span>
                        <span className="font-bold text-on-surface">{p.historyDurationValue}</span>
                      </div>
                      <div className="flex flex-col col-span-2 sm:col-span-1">
                        <span className="text-on-surface-variant text-[11px]">{p.historySystemStatusLabel}</span>
                        <span className="font-mono font-semibold text-on-surface">{booking.status}</span>
                      </div>
                    </div>

                    {/* Actions if Pending */}
                    {isPending && (
                      <div className="flex items-center gap-2 pt-1 border-t border-outline-variant/10">
                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            router.push('/scan');
                          }}
                          className="flex-1 py-2 px-3 rounded-lg bg-primary text-on-primary text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-primary/90 transition-all cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-[16px]">qr_code_scanner</span>
                          <span>{p.checkInAction}</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            setBookingToCancel(booking.booking_id);
                          }}
                          className="py-2 px-3 rounded-lg bg-error-container text-on-error-container text-xs font-bold hover:bg-error-container/80 transition-all cursor-pointer"
                        >
                          {p.cancelAction}
                        </button>
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          <DialogFooter className="p-3 bg-surface-container-low/60 border-t border-outline-variant/20">
            <Button variant="outline" onClick={() => setShowHistoryModal(false)} className="w-full sm:w-auto">
              {p.historyClose}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={bookingToCancel !== null} onOpenChange={(open) => !open && setBookingToCancel(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{p.cancelDialogTitle}</DialogTitle>
            <DialogDescription className="text-on-surface-variant pt-2 space-y-2">
              <p>{p.cancelDialogQuestion}</p>
              <ul className="list-disc pl-5 text-error font-medium">
                <li>{p.cancelDialogRuleOne}</li>
                <li>{p.cancelDialogRuleTwo}</li>
              </ul>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4 gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setBookingToCancel(null)}>
              {p.cancelDialogClose}
            </Button>
            <Button variant="destructive" onClick={handleCancelBooking} className="bg-error hover:bg-error/90 text-on-error">
              {p.cancelDialogConfirm}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </MainLayout>
  );
}
