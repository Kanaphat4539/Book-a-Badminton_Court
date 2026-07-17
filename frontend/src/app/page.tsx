'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';

const heroImages = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1920&q=80',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg/960px-Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYUOMPRdYqlaU4UWU1XQ2jM99-UN3JLKVkoCYYNpLEZm0LMIH_WRkeaO8&s=10'
];

export default function LandingPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);

  useEffect(() => {
    const heroInterval = setInterval(() => {
      setCurrentHeroImage((prev) => (prev + 1) % heroImages.length);
    }, 3000);
    return () => clearInterval(heroInterval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen font-sans bg-[#f8f9fa] dark:bg-[#0a0400] text-gray-900 dark:text-gray-100 transition-colors duration-300">
      
      {/* Fixed Navbar */}
      <nav className={`fixed top-0 w-full z-50 px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-black/20 backdrop-blur-sm border-b border-white/10'}`}>
        <div className="flex items-center gap-12">
          <Link href="/" className="font-display-sm text-[20px] md:text-[24px] font-extrabold tracking-tight text-white flex items-center gap-2 drop-shadow-sm">
            <span className="text-[#F26522]">KMITL</span> PCC
          </Link>
          <div className="hidden lg:flex items-center gap-8 font-medium text-[15px]">
            <Link href="#services" className="text-white/80 hover:text-white transition-colors">Services</Link>
            <Link href="#news" className="text-white/80 hover:text-white transition-colors">News <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-top ml-0.5"></span></Link>
            <Link href="#tips" className="text-white/80 hover:text-white transition-colors">Tips</Link>
            <Link href="#rules" className="text-white/80 hover:text-white transition-colors">Rules</Link>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-4">
          <ThemeToggle className="hidden md:flex w-10 h-10 items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors" iconClassName="text-[24px]" />
          <Link href="/login" className="hidden md:flex bg-white text-black font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95">
            Log in to Console
          </Link>
          <button 
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isSidebarOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsSidebarOpen(false)}></div>
          <div className="relative w-[300px] sm:w-[320px] bg-white dark:bg-[#140900] h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-800">
              <span className="font-display-sm text-[20px] font-extrabold text-gray-900 dark:text-orange-50">Menu</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Link href="#hero" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Home</Link>
                  <Link href="#services" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Services</Link>
                  <Link href="#news" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">News <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span></Link>
                  <Link href="#tips" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Tips</Link>
                  <Link href="#rules" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Rules</Link>
                </div>
                
                <div className="mt-4">
                  <h3 className="font-bold text-[18px] text-gray-900 dark:text-orange-50 mb-3">Settings</h3>
                  <div className="flex items-center justify-between text-[16px] text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                    <span>Dark Mode</span>
                    <ThemeToggle />
                  </div>
                </div>
              </nav>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800">
              <Link href="/login" className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md">
                Log in to Console
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section (Image Slider) */}
      <header id="hero" className="relative w-full h-screen flex flex-col justify-center px-8 md:px-12 lg:px-24 overflow-hidden bg-black">
        {/* Background Images */}
        {heroImages.map((img, index) => (
          <div 
            key={img}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ease-in-out z-0 ${index === currentHeroImage ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url('${img}')` }}
          />
        ))}
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-0"></div>
        <div className="relative z-10 max-w-7xl w-full mx-auto">
          <h1 className="font-display-lg text-[42px] sm:text-[56px] md:text-[80px] font-extrabold text-white leading-[1.05] drop-shadow-xl mb-6 tracking-tight">
            Connect with <br/>
            {'{'}KMITL PCC <br className="md:hidden" /> BADMINTON{'}'}
          </h1>
          <Link href="/login" className="font-bold text-[18px] md:text-[22px] text-[#F26522] hover:text-[#ff7e22] transition-colors inline-flex items-center gap-2 w-fit bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full backdrop-blur-sm border border-white/20 shadow-lg">
            / Start Booking <span className="material-symbols-outlined font-bold text-[20px] md:text-[24px]">arrow_forward_ios</span>
          </Link>
        </div>
      </header>

      {/* 2. Services Section (Solid Background) */}
      <section id="services" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">Services</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">Brief overview of each service</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">event_available</span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">Court Booking API</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Enable real-time court reservations and management for KMITL students and staff.</p>
            </div>
            {/* Card 2 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">card_membership</span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">Membership Login</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Let athletes easily log in and connect with their KMITL Badminton ID.</p>
            </div>
            {/* Card 3 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">qr_code_scanner</span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">Smart Check-in</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">Link your booking with the court via QR code scanning framework.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. News Section (Image 2 - Parallax) */}
      <section id="news" className="relative py-24 px-6 md:px-12 lg:px-24 bg-cover bg-fixed bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')` }}>
        <div className="absolute inset-0 bg-black/80 z-0"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="font-display-lg text-[40px] md:text-[64px] font-extrabold text-white tracking-tight">News</h2>
              <p className="text-[18px] text-gray-300 mt-2">Get updated on the latest KMITL Badminton news</p>
            </div>
            <Link href="#" className="font-bold text-white hover:text-[#F26522] transition-colors flex items-center gap-1">
              View all <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-black/80 transition-colors">
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

            <div className="bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:bg-black/80 transition-colors">
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

      {/* 4. Tips Section (Image 3 - Background) */}
      <section id="tips" className="relative py-24 px-6 md:px-12 lg:px-24 bg-[#111] bg-cover bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1518659728514-6d9b0efdc3e0?w=1920&q=80')`, backgroundBlendMode: 'overlay' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="font-display-lg text-[40px] md:text-[64px] font-extrabold text-white tracking-tight">Tips for Players</h2>
              <p className="text-[18px] text-gray-300 mt-2">Check the latest tips to improve your game</p>
            </div>
            <Link href="#" className="font-bold text-white hover:text-[#F26522] transition-colors flex items-center gap-1">
              View all <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-[#1a1a1a]/90 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-colors">
              <span className="text-gray-400 text-[14px] block mb-3">2026/07/16</span>
              <h3 className="font-bold text-[24px] text-white mb-4 leading-snug">Proper Warm-up Routine before entering the court</h3>
              <p className="text-gray-300 text-[15px] leading-relaxed mb-8">
                Did you know that proper warm-up can reduce injury risk by 50%? In this article, we introduce a handy 10-minute routine focusing on ankle and shoulder mobility before you start smashing...
              </p>
              <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">Health & Safety</span>
            </div>

            <div className="bg-[#1a1a1a]/90 backdrop-blur-md p-8 rounded-3xl border border-white/5 hover:border-white/20 transition-colors">
              <span className="text-gray-400 text-[14px] block mb-3">2026/07/10</span>
              <h3 className="font-bold text-[24px] text-white mb-4 leading-snug">Choosing the right string tension</h3>
              <p className="text-gray-300 text-[15px] leading-relaxed mb-8">
                Many beginners make the mistake of using too high tension. Learn why a lower tension (22-24 lbs) might actually give you more power and a larger sweet spot for your clears and smashes...
              </p>
              <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">Equipment</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Documentation & Footer */}
      <footer id="rules" className="bg-black text-white pt-20 pb-10 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-16 mb-8">
            
            <div className="col-span-1 lg:col-span-2">
              <h2 className="font-display-sm text-[28px] font-extrabold mb-6"><span className="text-[#F26522]">KMITL</span> PCC BADMINTON</h2>
              <p className="text-gray-400 max-w-md">
                The premier badminton facility booking system for King Mongkut's Institute of Technology Ladkrabang. Play hard, play fair.
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[18px] mb-6">Rules & Guides</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Booking Basics</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Cancellation Policy</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Court Etiquette</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Membership Fees</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[18px] mb-6">Contact</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">Support Center</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">Report an Issue</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-1">Facebook <span className="material-symbols-outlined text-[14px]">open_in_new</span></Link></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-[14px]">
            <p>© 2026 KMITL PCC Badminton Club</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">Terms and Policies</Link>
              <Link href="#" className="hover:text-white transition-colors">About trademarks</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
