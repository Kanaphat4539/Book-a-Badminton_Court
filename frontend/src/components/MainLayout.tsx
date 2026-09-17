'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';
import { cn } from '@/lib/utils';
import { BanPopup } from '@/components/BanPopup';

const GlobalFooter = () => (
  <footer className="hidden md:block w-full mt-auto bg-[#24150d] text-[#ffddc2] overflow-hidden relative">
    <div className="absolute -right-20 -top-20 w-64 h-64 rounded-full border-[30px] border-primary/10 pointer-events-none"></div>
    <div className="mx-auto max-w-7xl px-6 py-12 md:px-10">
      <div className="grid gap-12 md:grid-cols-4 lg:grid-cols-5">
        <div className="md:col-span-2 lg:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="grid w-12 h-12 place-items-center rounded-2xl bg-primary text-white shadow-lg">
              <span className="material-symbols-outlined text-[24px]">sports_tennis</span>
            </div>
            <div>
              <p className="font-black text-white text-lg">KMITL Badminton</p>
              <p className="text-sm text-primary-container/80">Sports Complex System</p>
            </div>
          </div>
          <p className="max-w-xs text-sm leading-relaxed text-[#ffddc2]/70 mb-8">
            A smarter way to manage courts, schedules, and every match that matters.
          </p>
          <div className="flex gap-3">
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-white/10 text-primary-container transition-all hover:bg-primary hover:text-white hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">public</span>
            </button>
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-white/10 text-primary-container transition-all hover:bg-primary hover:text-white hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">photo_camera</span>
            </button>
            <button className="grid w-10 h-10 place-items-center rounded-xl bg-white/10 text-primary-container transition-all hover:bg-primary hover:text-white hover:scale-105">
              <span className="material-symbols-outlined text-[18px]">settings</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary-container mb-6">Platform</h3>
          <div className="flex flex-col gap-4 text-sm text-[#ffddc2]/70">
            <a className="hover:text-white transition-colors" href="/dashboard">Dashboard</a>
            <a className="hover:text-white transition-colors" href="/booking">Bookings</a>
            <a className="hover:text-white transition-colors" href="#">Court Schedule</a>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black uppercase tracking-[0.2em] text-primary-container mb-6">Support</h3>
          <div className="flex flex-col gap-4 text-sm text-[#ffddc2]/70">
            <a className="inline-flex items-center gap-2 hover:text-white transition-colors" href="#">
              <span className="material-symbols-outlined text-[16px]">call</span> 02-329-8000
            </a>
            <a className="inline-flex items-center gap-2 hover:text-white transition-colors" href="#">
              <span className="material-symbols-outlined text-[16px]">open_in_new</span> Help Center
            </a>
            <span className="text-[#ffddc2]/50">Mon – Fri, 08:00 – 18:00</span>
          </div>
        </div>

        <div className="md:col-span-4 lg:col-span-1">
          <div className="rounded-2xl border border-primary-container/20 bg-primary/10 p-5 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
              <span className="material-symbols-outlined text-[18px] text-primary">bolt</span> System Status
            </div>
            <p className="text-xs leading-relaxed text-[#ffddc2]/70 mb-4">
              All booking services are operating normally.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-green-400">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span> Operational
            </div>
          </div>
        </div>
      </div>

      <div className="mt-12 flex flex-col justify-between gap-4 border-t border-white/10 pt-8 text-xs text-[#ffddc2]/40 sm:flex-row">
        <p>© 2026 KMITL Badminton. All rights reserved.</p>
        <p>Internal use only · Sports Complex</p>
      </div>
    </div>
  </footer>
);

type MainLayoutProps = {
  children: React.ReactNode;
  width?: 'compact' | 'wide' | 'full';
};

export default function MainLayout({ children, width = 'compact' }: MainLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/rules-of-hooks, @typescript-eslint/no-unused-vars, no-restricted-syntax, react-hooks/set-state-in-effect
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUserRole(parsedUser.role);
        
        // If Admin, fetch notifications
        if (parsedUser.role === 'ADMIN') {
          fetchNotifications();
        }
      } catch (e) {}
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/bookings/notifications', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
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
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <button 
                aria-label="Notifications" 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors relative"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {userRole === 'ADMIN' && notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 rounded-full bg-error ring-2 ring-surface"></span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-surface rounded-xl shadow-lg border border-surface-container-high overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-4 border-b border-surface-container-high flex justify-between items-center bg-surface-container-lowest">
                    <h3 className="font-headline-sm text-on-surface">การแจ้งเตือน (Admin)</h3>
                    <button onClick={() => setIsNotificationsOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                      <span className="material-symbols-outlined text-[20px]">close</span>
                    </button>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {userRole === 'ADMIN' && notifications.length > 0 ? (
                      notifications.map((notif: any) => (
                        <div key={notif.booking_id} className={`p-4 border-b border-surface-container-low hover:bg-surface-container-lowest transition-colors ${notif.status === 'CANCELLED' ? 'border-l-4 border-l-error' : 'border-l-4 border-l-primary'}`}>
                          <div className="flex justify-between items-start">
                            <p className="font-label-lg text-on-surface">
                              {notif.status === 'CANCELLED' ? '🔴 ยกเลิกการจอง' : '🟢 การจองใหม่'}
                            </p>
                            <span className="text-[10px] text-on-surface-variant bg-surface-container px-2 py-0.5 rounded-full">
                              ID: {notif.booking_id}
                            </span>
                          </div>
                          <p className="text-body-sm text-on-surface-variant mt-1">
                            คอร์ท {notif.court} | วันที่ {notif.booking_date} | {notif.time_in}-{notif.time_out}
                          </p>
                          <p className="text-label-sm text-primary mt-1">
                            โดย รหัสนักศึกษา: {notif.stu_id} {notif.student ? `(${notif.student.first_name} ${notif.student.last_name})` : ''}
                          </p>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center text-on-surface-variant">
                        <span className="material-symbols-outlined text-[48px] opacity-20 mb-2">notifications_off</span>
                        <p>{userRole === 'ADMIN' ? 'ไม่มีการแจ้งเตือน' : 'ฟีเจอร์นี้สำหรับผู้ดูแลระบบ'}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            <button aria-label="Menu" onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform">
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
            <button onClick={() => router.push('/dashboard')} className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors cursor-pointer ${isActive('/dashboard') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/dashboard') ? { fontVariationSettings: "'FILL' 1" } : {}}>home</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">หน้าหลัก</span>
            </button>
            <button onClick={() => router.push('/booking')} className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors cursor-pointer ${isActive('/booking') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/booking') ? { fontVariationSettings: "'FILL' 1" } : {}}>calendar_month</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">จองคอร์ท</span>
            </button>
            <button onClick={() => router.push('/scan')} className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors cursor-pointer ${isActive('/scan') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/scan') ? { fontVariationSettings: "'FILL' 1" } : {}}>qr_code_scanner</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">สแกนเข้าสนาม</span>
            </button>
            <button onClick={() => router.push('/news')} className={`flex flex-col items-center justify-center min-w-[56px] h-12 gap-1 transition-colors cursor-pointer ${isActive('/news') ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>
              <span className="material-symbols-outlined text-[24px]" style={isActive('/news') ? { fontVariationSettings: "'FILL' 1" } : {}}>newspaper</span>
              <span className="font-label-sm text-[10px] md:text-label-sm">ข่าวสาร</span>
            </button>
          </div>
        </nav>
      )}

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-on-background/50 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[280px] bg-surface h-full shadow-2xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center mb-8">
              <span className="font-headline-sm text-on-surface font-bold">KMITL Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>
            <nav className="flex flex-col gap-6">
              <div className="flex flex-col gap-4">
                <button onClick={() => { setIsSidebarOpen(false); router.push('/dashboard'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">หน้าหลัก (Home)</button>
                {userRole !== 'ADMIN' && (
                  <>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/booking'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">จองคอร์ท (Book Courts)</button>
                    <button onClick={() => { setIsSidebarOpen(false); router.push('/scan'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">สแกนคิวอาร์ (Scan QR)</button>
                  </>
                )}
                <button onClick={() => { setIsSidebarOpen(false); router.push('/news'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">ข่าวสาร (News)</button>
                {userRole === 'ADMIN' && (
                  <button onClick={() => { setIsSidebarOpen(false); router.push('/admin/users'); }} className="text-left font-label-lg text-secondary hover:text-primary border-b border-surface-container-high pb-2">จัดการผู้ใช้ (Manage Users)</button>
                )}
              </div>
              
              <div>
                <h3 className="font-label-lg text-on-surface-variant mb-3">ตั้งค่า (Settings)</h3>
                <div className="flex flex-col gap-3 pl-4 border-l-2 border-surface-container-high">
                  <div className="flex items-center justify-between text-label-md text-on-surface">
                    <span>โหมดมืด (Dark Mode)</span>
                    <ThemeToggle />
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6">
                <button onClick={handleLogout} className="w-full bg-error-container text-on-error-container font-label-lg py-3 rounded-xl flex items-center justify-center gap-2 hover:opacity-80 transition-opacity">
                  <span className="material-symbols-outlined">logout</span>
                  ออกจากระบบ
                </button>
              </div>
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}
