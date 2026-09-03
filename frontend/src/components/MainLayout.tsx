'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        setUserRole(parsedUser.role);
      } catch (e) {}
    }
  }, []);

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

  if (!mounted) return <div className="min-h-screen bg-surface"></div>;

  return (
    <div className="bg-surface text-on-surface min-h-screen flex flex-col font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full z-50 pt-safe bg-surface/80 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
        <div className="h-16 px-4 md:px-margin-screen flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer min-w-0" onClick={() => router.push('/dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-on-primary shadow-[0_4px_12px_rgba(255,94,30,0.25)] shrink-0">
              <span className="material-symbols-outlined text-[22px]">sports_tennis</span>
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
            <button aria-label="Notifications" className="w-10 h-10 flex items-center justify-center rounded-full text-on-surface-variant hover:text-on-surface active:bg-surface-container-high transition-colors relative">
              <span className="material-symbols-outlined text-[22px]">notifications</span>
              <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full bg-primary-container ring-2 ring-surface"></span>
            </button>
            <button aria-label="Menu" onClick={() => setIsSidebarOpen(true)} className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shrink-0 shadow-sm active:scale-95 transition-transform">
              <span className="material-symbols-outlined text-on-primary text-[20px]">menu</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 w-full pt-16 pb-24 max-w-2xl mx-auto">
        {children}
      </div>

      {/* Bottom Nav */}
      {userRole !== 'ADMIN' && (
        <nav className="fixed bottom-0 w-full z-40 pb-safe bg-surface/85 backdrop-blur-xl shadow-[0_-2px_12px_rgba(0,0,0,0.05)]">
          <div className="h-20 px-gutter-sm flex items-center justify-around max-w-2xl mx-auto">
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
                <button onClick={() => { setIsSidebarOpen(false); router.push('/booking'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">จองคอร์ท (Book Courts)</button>
                <button onClick={() => { setIsSidebarOpen(false); router.push('/scan'); }} className="text-left font-label-lg text-on-surface hover:text-primary border-b border-surface-container-high pb-2">สแกนคิวอาร์ (Scan QR)</button>
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
