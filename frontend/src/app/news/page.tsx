'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

export default function NewsPage() {
  const router = useRouter();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="bg-white dark:bg-[#0a0400] text-on-surface dark:text-orange-50 antialiased min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-x-hidden">
      
      {/* Header */}
      <div className="flex items-center justify-between p-6 md:px-12 lg:px-24 w-full z-10 relative">
        <h1 className="font-display-sm text-[24px] font-bold text-gray-900 dark:text-orange-50 transition-colors duration-300">
          News
        </h1>
        <div className="flex items-center gap-4">
          <div className="bg-white/80 dark:bg-[#1a0a00]/80 rounded-full shadow-sm border border-gray-200 dark:border-[#ff6b00]/20 transition-colors duration-300">
            <ThemeToggle className="w-11 h-11 flex items-center justify-center rounded-full text-gray-800 dark:text-orange-50 hover:bg-gray-100 dark:hover:bg-[#3a1b00] transition-colors" iconClassName="text-[28px]" />
          </div>
          <button className="md:hidden w-11 h-11 flex items-center justify-center rounded-full bg-white/80 dark:bg-[#1a0a00]/80 shadow-sm border border-gray-200 dark:border-[#ff6b00]/20 text-gray-800 dark:text-orange-50 hover:bg-gray-100 dark:hover:bg-[#3a1b00] transition-colors" onClick={() => setIsSidebarOpen(true)}>
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>
        </div>
      </div>

      <div className="flex-1 w-full pb-24">
        {/* News Section (from landing page) */}
        <section className="relative py-16 px-6 md:px-12 lg:px-24 bg-cover bg-fixed bg-center min-h-[80vh] flex flex-col justify-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')` }}>
          <div className="absolute inset-0 bg-black/80 z-0"></div>
          <div className="relative z-10 max-w-7xl w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
              <div>
                <h2 className="font-display-lg text-[40px] md:text-[64px] font-extrabold text-white tracking-tight">Latest News</h2>
                <p className="text-[18px] text-gray-300 mt-2">Get updated on the latest KMITL Badminton news</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-black/80 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">NEW</span>
                  <span className="text-gray-400 text-[14px]">2026/07/17</span>
                </div>
                <h3 className="font-bold text-[22px] text-white mb-4 leading-snug">The KMITL Court Booking Terms of Use will be revised on July 27, 2026</h3>
                <p className="text-gray-300 text-[15px] leading-relaxed line-clamp-3 mb-6">
                  The Terms of Use (for KMITL Athletes) will be revised on July 27, 2026. Scheduled date of revision July 27, 2026. The content and date are subject to change. Details of revision include court cancellation policies...
                </p>
                <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">Court Booking</span>
              </div>

              <div className="bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-black/80 transition-colors cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">NEW</span>
                  <span className="text-gray-400 text-[14px]">2026/07/15</span>
                </div>
                <h3 className="font-bold text-[22px] text-white mb-4 leading-snug">You can now view your booking statistics in the new Dashboard</h3>
                <p className="text-gray-300 text-[15px] leading-relaxed line-clamp-3 mb-6">
                  We have added a new statistics panel to the user dashboard where you can see how many hours you've played, your most frequently visited courts, and more...
                </p>
                <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">Dashboard Update</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-white/90 dark:bg-[#140900]/95 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.05)] border-t border-gray-100 dark:border-[#ff6b00]/20 transition-colors duration-300">
        <button onClick={() => router.push('/dashboard')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>sports_tennis</span>
          <span className="font-label-md text-[12px] font-semibold">Home</span>
        </button>
        <button onClick={() => router.push('/booking')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>event_note</span>
          <span className="font-label-md text-[12px] font-semibold">Bookings</span>
        </button>
        <button onClick={() => router.push('/scan')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>qr_code_scanner</span>
          <span className="font-label-md text-[12px] font-semibold">Scan</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined drop-shadow-sm" style={{ fontVariationSettings: "'FILL' 1" }}>article</span>
          <span className="font-label-md text-[12px] font-semibold tracking-wide">News</span>
        </button>
      </nav>

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
                <button onClick={() => { setIsSidebarOpen(false); router.push('/news'); }} className="text-left font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-primary transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">News <span className="w-2 h-2 rounded-full bg-green-500 inline-block ml-1"></span></button>
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
            </nav>
          </div>
        </div>
      )}
    </div>
  );
}

