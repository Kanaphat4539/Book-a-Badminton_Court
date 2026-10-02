'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import api, { isSessionExpiredError } from '@/lib/api';
import { BanPopup } from '@/components/BanPopup';
import { useLocale } from '@/components/locale-provider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface BanStatus {
  isBanned: boolean;
  bannedUntil?: string | null;
  strikes: number;
}

const GlobalFooter = () => {
  const { t } = useLocale();
  return (
  <footer className="hidden md:block w-full mt-auto bg-surface text-on-surface overflow-hidden relative border-t border-surface-container-high">
    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border-30 border-primary/10 pointer-events-none"></div>
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
      <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
        <div className="md:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white flex items-center justify-center shadow-lg shrink-0">
              <img
                alt="KMITL Badminton Logo"
                className="w-full h-full object-cover scale-[1.3] origin-center"
                src="https://dynamic.design.com/preview/logodraft/19a68c63-7360-49b5-81f0-76059ea64263/image/extra-large.en-us.png"
              />
            </div>
            <div>
              <p className="font-black text-on-surface text-lg">KMITL Badminton</p>
              <p className="text-sm text-primary">Sports Complex System</p>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-on-surface-variant mb-8">
            {t('footerDescription')}
          </p>
          <div className="flex gap-3">
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-surface-container-high text-primary transition-all hover:bg-primary hover:text-on-primary hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">public</span>
            </button>
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-surface-container-high text-primary transition-all hover:bg-primary hover:text-on-primary hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-surface-container-high text-primary transition-all hover:bg-primary hover:text-on-primary hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">{t('footerPlatform')}</h3>
          <div className="flex flex-col gap-4 text-sm text-on-surface-variant">
            <a className="hover:text-primary transition-colors" href="/dashboard">{t('home')}</a>
            <a className="hover:text-primary transition-colors" href="/booking">{t('footerBookings')}</a>
            <a className="hover:text-primary transition-colors" href="#">{t('footerSchedule')}</a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary mb-6">{t('footerSupport')}</h3>
          <div className="flex flex-col gap-4 text-sm text-on-surface-variant">
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined text-[16px]">call</span> 02-329-8000
            </a>
            <a className="inline-flex items-center gap-2 hover:text-primary transition-colors" href="#">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span> {t('footerHelp')}
            </a>
            <span className="text-on-surface-variant/60">{t('footerHours')}</span>
          </div>
        </div>

        <div className="md:col-span-4 lg:col-span-1">
          <div className="rounded-2xl border border-surface-container-high bg-surface-container-low p-5">
            <div className="flex items-center gap-2 text-sm font-bold text-on-surface mb-2">
              <span className="material-symbols-outlined text-[18px] text-primary">bolt</span> {t('footerStatus')}
            </div>
            <p className="text-xs leading-relaxed text-on-surface-variant mb-4">
              {t('servicesNormal')}
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-secondary">
              <span className="w-2 h-2 rounded-full bg-secondary animate-pulse"></span> {t('operational')}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col justify-between gap-4 border-t border-surface-container-high pt-8 text-xs text-on-surface-variant/70 sm:flex-row">
        <p>© 2026 KMITL Badminton. All rights reserved.</p>
        <p>Internal use only · Sports Complex</p>
      </div>
    </div>
  </footer>
  );
};

type MainLayoutProps = {
  children: React.ReactNode;
  width?: 'compact' | 'wide' | 'full';
};

export default function MainLayout({ children, width = 'compact' }: MainLayoutProps) {
  const { locale, setLocale, t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [isStrikeDialogOpen, setIsStrikeDialogOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
    const fetchNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/bookings/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        const unreadCount = res.data.filter((n: any) => !n.is_read).length;
        setHasUnreadNotifications(unreadCount > 0);
      } catch (err) {
        if (isSessionExpiredError(err)) return;
        console.error('Failed to fetch notifications', err);
      }
    };

    const fetchUserNotifications = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/bookings/user-notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setNotifications(res.data);
        const unreadCount = res.data.filter((n: any) => !n.is_read).length;
        setHasUnreadNotifications(unreadCount > 0);
      } catch (err) {
        if (isSessionExpiredError(err)) return;
        console.error('Failed to fetch user notifications', err);
      }
    };

    const fetchBanStatus = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;
        const res = await api.get('/users/me/ban-status', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBanStatus(res.data);
      } catch (err) {
        if (isSessionExpiredError(err)) return;
        console.error('Failed to fetch ban status', err);
      }
    };

    const checkAuth = () => {
      const token = localStorage.getItem('token');
      if (!token) {
        setIsAuthenticated(false);
        setBanStatus(null);
        if (typeof window !== 'undefined' && 
            !window.location.pathname.startsWith('/login') && 
            !window.location.pathname.startsWith('/register') && 
            window.location.pathname !== '/') {
          router.push('/login');
        }
        return;
      }

      try {
        const parsedUser = JSON.parse(localStorage.getItem('user') || '{}');
        setUserRole(parsedUser.role || 'USER');
        setIsAuthenticated(true);
        if (parsedUser.role === 'ADMIN') {
          fetchNotifications();
        } else {
          fetchUserNotifications();
          fetchBanStatus();
        }
      } catch (e) {}
    };

    checkAuth();
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUserRole(null);
    setBanStatus(null);
    router.push('/login');
  };

  const isActive = (path: string) => {
    if (path === '/dashboard' && pathname === '/dashboard') return true;
    if (path !== '/dashboard' && pathname?.startsWith(path)) return true;
    return false;
  };

  const containerWidth = width === 'full' ? 'w-full' : width === 'wide' ? 'max-w-6xl' : 'max-w-2xl';

  if (!mounted) return <div className="min-h-screen bg-surface"></div>;

  return (
    <div className={cn('bg-surface text-on-surface min-h-screen flex flex-col', width === 'wide' ? 'font-user' : 'font-sans')}>
      <BanPopup />
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className={cn('h-16 px-4 md:px-margin-screen flex items-center justify-between mx-auto', containerWidth)}>
          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white flex items-center justify-center shadow-[0_4px_12px_rgba(255,94,30,0.25)] shrink-0">
              <img
                alt="KMITL Badminton Logo"
                className="w-full h-full object-cover scale-[1.3] origin-center"
                src="https://dynamic.design.com/preview/logodraft/19a68c63-7360-49b5-81f0-76059ea64263/image/extra-large.en-us.png"
              />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-headline-sm text-base md:text-headline-sm text-on-surface leading-tight tracking-tight truncate">KMITL Badminton</span>
              <div className="flex items-center gap-1 min-w-0">
                <span className="material-symbols-outlined text-[14px] text-primary shrink-0">location_on</span>
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant font-medium truncate">Main Sports Complex</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Student Strike Points Badge */}
            {isAuthenticated && userRole !== 'ADMIN' && banStatus && (
              <button
                type="button"
                onClick={() => setIsStrikeDialogOpen(true)}
                title={t('strikesBadgeLabel')}
                aria-label={`${t('strikesBadgeLabel')}: ${banStatus.strikes}/2`}
                className={cn(
                  'h-8 px-2 sm:px-2.5 rounded-full flex items-center gap-1 sm:gap-1.5 transition-all duration-200 cursor-pointer text-xs font-semibold border select-none',
                  banStatus.isBanned
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20 shadow-xs'
                    : banStatus.strikes === 1
                    ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20 shadow-xs'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25 hover:bg-emerald-500/20'
                )}
              >
                <span className="material-symbols-outlined text-[16px] sm:text-[18px]">
                  {banStatus.isBanned ? 'block' : banStatus.strikes === 1 ? 'warning' : 'verified_user'}
                </span>
                <span className="sm:hidden font-bold leading-none">{banStatus.strikes}/2</span>
                <span className="hidden sm:inline leading-none font-medium">
                  {banStatus.strikes}/2 {t('strikesUnit')}
                </span>
              </button>
            )}

            <LanguageToggle />
            <div className="relative">
              <button 
                aria-label={t('notifications')}
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors relative"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-lg border border-surface-container-high overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-surface-container-high flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-headline-sm text-on-surface">{t('notifications')} {userRole === 'ADMIN' ? '(Admin)' : ''}</h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map((notif: any, index: number) => {
                        if (notif.type === 'SYSTEM') {
                          return (
                            <div key={`sys-${index}`} className="p-4 border-b border-surface-container-low hover:bg-surface-container-lowest transition-colors border-l-4 border-l-secondary">
                              <div className="flex justify-between items-start">
                                <p className="font-label-lg text-on-surface">📢 {t('notificationSystem')}</p>
                              </div>
                              <p className="text-body-sm text-on-surface-variant mt-1">{notif.message}</p>
                            </div>
                          );
                        }
                        return (
                          <div key={notif.booking_id} className={`p-4 border-b border-surface-container-low hover:bg-surface-container-lowest transition-colors ${notif.status === 'CANCELLED' ? 'border-l-4 border-l-error' : notif.status === 'CHECKED_IN' ? 'border-l-4 border-l-secondary' : 'border-l-4 border-l-primary'}`}>
                            <div className="flex justify-between items-start">
                              <p className="font-label-lg text-on-surface">
                                {userRole === 'ADMIN' 
                                  ? (notif.status === 'CANCELLED' ? `🔴 ${t('notificationBookingCancelled')}` : `🟢 ${t('notificationNewBooking')}`)
                                  : (notif.status === 'CANCELLED' ? `🔴 ${t('notificationBookingCancelled')}` : notif.status === 'CHECKED_IN' ? `🟢 ${t('notificationCheckin')}` : notif.status === 'COMPLETED' ? `🟢 ${t('notificationComplete')}` : `🟢 ${t('notificationSuccess')}`)}
                              </p>
                              <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                                ID: {notif.booking_id}
                              </span>
                            </div>
                            <p className="text-body-sm text-on-surface-variant mt-1">
                              {t('notificationCourt')} {notif.court} | {t('notificationDate')} {notif.booking_date} | {notif.time_in}-{notif.time_out}
                            </p>
                            {userRole === 'ADMIN' && (
                              <p className="text-label-sm text-primary mt-1">
                                {t('notificationByStudent')} {notif.stu_id} {notif.student ? `(${notif.student.first_name} ${notif.student.last_name})` : ''}
                              </p>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="p-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">notifications_off</span>
                        <p>{t('noNotifications')}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button aria-label={t('menu')} onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-on-primary text-[20px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className={cn('flex-1 w-full pt-16 pb-24 md:pb-0 mx-auto flex flex-col min-h-[calc(100vh-4rem)]', containerWidth)}>
        <main className="flex-1">
          {children}
        </main>

      </div>

      {/* Global Footer (Visible only on Desktop) */}
      <GlobalFooter />

      {/* Bottom Nav */}
      {userRole !== 'ADMIN' && (
        <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)] md:hidden">
          <div className={cn('h-20 px-gutter-sm flex items-center justify-around mx-auto', containerWidth)}>
            <button onClick={() => router.push('/dashboard')} className={`flex flex-col items-center justify-center min-w-14 h-12 gap-1 transition-colors cursor-pointer ${isActive('/dashboard') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/dashboard') ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">{t('home')}</span>
            </button>
            <button onClick={() => router.push('/booking')} className={`flex flex-col items-center justify-center min-w-14 h-12 gap-1 transition-colors cursor-pointer ${isActive('/booking') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/booking') ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_month</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">{t('booking')}</span>
            </button>
            <button onClick={() => router.push('/scan')} className={`flex flex-col items-center justify-center min-w-14 h-12 gap-1 transition-colors cursor-pointer ${isActive('/scan') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/scan') ? { fontVariationSettings: "'FILL' 1" } : {}}>qr_code_scanner</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">{t('scan')}</span>
            </button>
            <button onClick={() => router.push('/news')} className={`flex flex-col items-center justify-center min-w-14 h-12 gap-1 transition-colors cursor-pointer ${isActive('/news') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/news') ? { fontVariationSettings: "'FILL' 1" } : {}}>newspaper</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">{t('news')}</span>
            </button>
          </div>
        </nav>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-100 flex justify-end">
          <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-70 bg-surface h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-headline-sm text-on-surface font-bold">{t('menu')}</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              {/* Student Ban Strikes Info Card in Menu */}
              {userRole !== 'ADMIN' && banStatus && (
                <div
                  onClick={() => {
                    setIsSidebarOpen(false);
                    setIsStrikeDialogOpen(true);
                  }}
                  className="p-3.5 rounded-2xl bg-surface-container-low border border-surface-container-high cursor-pointer hover:bg-surface-container transition-colors select-none"
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[16px] text-primary">shield</span>
                      {t('strikesBadgeLabel')}
                    </span>
                    <span
                      className={cn(
                        'text-[11px] font-bold px-2 py-0.5 rounded-full border',
                        banStatus.isBanned
                          ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          : banStatus.strikes === 1
                          ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                      )}
                    >
                      {banStatus.strikes} / 2 {t('strikesUnit')}
                    </span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-on-surface-variant">
                    {banStatus.isBanned
                      ? t('strikesDescBanned')
                      : banStatus.strikes === 1
                      ? t('strikesDescWarning')
                      : t('strikesDescNormal')}
                  </p>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <button onClick={() => { setIsSidebarOpen(false); router.push('/dashboard'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">{t('home')}</button>
                {userRole !== 'ADMIN' && (
                  <>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/booking'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">{t('booking')}</button>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/scan'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">{t('scan')}</button>
                  </>
                )}
                <button onClick={() => { setIsSidebarOpen(false); router.push('/news'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">{t('news')}</button>
                {userRole === 'ADMIN' && (
                  <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/users'); }} className="text-left font-label-lg text-secondary hover:text-primary border-b border-surface-container-high pb-2">{t('users')}</button>
                )}
              </div>
              
              <div>
                <h3 className="font-label-lg text-on-surface-variant mb-3">{t('settings')}</h3>
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container-high">
                  <div className="flex items-center justify-between text-label-md text-on-surface">
                    <span>{t('dark')}</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button onClick={handleLogout} className="w-full bg-error-container text-on-error-container font-label-lg py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="material-symbols-outlined">logout</span>
                  {t('logout')}
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}

      {/* Ban Strikes Details Dialog */}
      <Dialog open={isStrikeDialogOpen} onOpenChange={setIsStrikeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3 mb-1">
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0',
                  banStatus?.isBanned
                    ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                    : banStatus?.strikes === 1
                    ? 'bg-amber-500/15 text-amber-600 dark:text-amber-400'
                    : 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                )}
              >
                <span className="material-symbols-outlined text-[24px]">
                  {banStatus?.isBanned ? 'block' : banStatus?.strikes === 1 ? 'warning' : 'verified_user'}
                </span>
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-bold leading-tight">
                  {t('strikesModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-xs text-on-surface-variant truncate">
                  {t('strikesModalDesc')}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          {/* Current Status Card */}
          <div
            className={cn(
              'p-4 rounded-2xl border flex flex-col gap-2',
              banStatus?.isBanned
                ? 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                : banStatus?.strikes === 1
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            )}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider opacity-80">
                {t('strikesCurrentCount')}
              </span>
              <span className="text-sm font-bold px-2.5 py-0.5 rounded-full bg-surface/70 border border-current/20">
                {banStatus?.strikes ?? 0} / 2 {t('strikesUnit')}
              </span>
            </div>
            <p className="text-sm font-semibold">
              {banStatus?.isBanned
                ? t('strikesDescBanned')
                : banStatus?.strikes === 1
                ? t('strikesDescWarning')
                : t('strikesDescNormal')}
            </p>
            {banStatus?.isBanned && banStatus?.bannedUntil && (
              <div className="mt-1 text-xs opacity-90 pt-2 border-t border-rose-500/20">
                {t('strikesBannedUntil')}:{' '}
                {new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
                  timeZone: 'Asia/Bangkok',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                }).format(new Date(banStatus.bannedUntil))}
              </div>
            )}
          </div>

          {/* Rules Breakdown */}
          <div className="space-y-2 pt-1">
            <h4 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">gavel</span>
              {t('strikesRulesTitle')}
            </h4>
            <div className="space-y-2 text-xs text-on-surface-variant">
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-primary shrink-0 mt-0.5">schedule</span>
                <span>{t('strikesRuleCheckin')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-emerald-500 shrink-0 mt-0.5">check_circle</span>
                <span>{t('strikesRuleCancelEarly')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">warning</span>
                <span>{t('strikesRuleCancelLate')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-amber-500 shrink-0 mt-0.5">timer_off</span>
                <span>{t('strikesRuleNoShow')}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-surface-container-low border border-surface-container-high flex items-start gap-2">
                <span className="material-symbols-outlined text-[16px] text-rose-500 shrink-0 mt-0.5">block</span>
                <span>{t('strikesRuleBan')}</span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setIsStrikeDialogOpen(false)} className="w-full">
              {t('strikesCloseBtn')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
