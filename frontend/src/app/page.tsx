'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/theme-toggle';

const heroImages = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1920&q=80',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg/960px-Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYUOMPRdYqlaU4UWU1XQ2jM99-UN3JLKVkoCYYNpLEZm0LMIH_WRkeaO8&s=10'
];

export default function LandingPage() {
  const router = useRouter();
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
        <div className="flex items-center gap-6 lg:gap-8">
          <button 
            onClick={() => router.back()} 
            className="hidden md:flex w-10 h-10 items-center justify-center rounded-full text-white bg-white/10 hover:bg-white/20 transition-colors shadow-sm"
            title="Go Back"
          >
            <span className="material-symbols-outlined text-[24px]">arrow_back</span>
          </button>
          
          <Link href="/" className="font-display-sm text-[20px] md:text-[24px] font-extrabold tracking-tight flex items-center gap-2 drop-shadow-md hover:scale-[1.02] transition-transform duration-300">
            <div className="w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden bg-white flex items-center justify-center shadow-sm">
              <img
                alt="KMITL Badminton Logo"
                className="w-full h-full object-cover scale-[1.3] origin-center"
                src="https://dynamic.design.com/preview/logodraft/19a68c63-7360-49b5-81f0-76059ea64263/image/extra-large.en-us.png"
              />
            </div>
            <div className="flex flex-col justify-center leading-[1.1]">
              <div className="text-[18px] md:text-[22px]">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] to-yellow-400">KMITL </span>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300">PCC</span>
              </div>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-300 text-[14px] md:text-[18px] tracking-[0.15em]">BADMINTON</span>
            </div>
          </Link>
          <div className="hidden lg:flex items-center gap-8 font-medium text-[15px]">
            <Link href="#services" className="text-white/80 hover:text-white transition-colors">Services</Link>
            <Link href="#news" className="text-white/80 hover:text-white transition-colors">News <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-top ml-0.5"></span></Link>
            <Link href="#guide" className="text-white/80 hover:text-white transition-colors">Guide</Link>
            <Link href="#tips" className="text-white/80 hover:text-white transition-colors">Tips</Link>
            <Link href="#rules" className="text-white/80 hover:text-white transition-colors">Rules</Link>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <Link href="/login" className="hidden md:flex bg-white text-black font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95">
            Log in to Console
          </Link>
          <button
            className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <span className="material-symbols-outlined text-[28px]">menu</span>
          </button>
          <div className="hidden lg:flex lg:ml-2">
            <ThemeToggle className="w-10 h-10 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors" iconClassName="text-[24px]" />
          </div>
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
                  <Link href="#guide" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">Guide</Link>
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
            Connect with <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] to-yellow-400 dark:from-primary dark:to-[#ffb693] filter drop-shadow-md">
              KMITL&nbsp;
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 dark:from-blue-400 dark:to-cyan-300 filter drop-shadow-md">
              PCC
            </span>
            <br className="md:hidden" /> BADMINTON
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

      {/* 4. Guide Section */}
      <section id="guide" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">How to Use</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">Your quick guide to the KMITL PCC Badminton Booking System</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-6">
            {/* Step 1 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">1</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">login</span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">Log In / Sign Up</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                On the homepage, click <strong>"/ Start Booking"</strong> or <strong>"Log in to Console"</strong> from the menu. Log in with your account. If you don't have one, click <strong>"Sign up"</strong> to register first.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">2</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">event_seat</span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">Book a Court</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                Click the <strong>"Book Court"</strong> button on the Home page. Select your desired time slot:<br />
                <span className="inline-flex items-center gap-1 mt-2"><span className="text-green-500 font-bold">✅ Books</span> = Available</span><br />
                <span className="inline-flex items-center gap-1 mt-1"><span className="text-red-500 font-bold">❌ Unavailable</span> = Fully booked</span>
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">3</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">check_circle</span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">Confirm Booking</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                Once selected, the system returns you to the Home page. The screen will display your booked court and time details, along with a <strong>"Check-in"</strong> button.
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">4</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">qr_code_scanner</span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">Check-in</h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                When it's time for your session, proceed to the counter. Click <strong>"Check-in"</strong> on your Home page and scan the QR Code to verify your identity. You are ready to play!
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Tips Section (Image 3 - Background) */}
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

      {/* 5. Rules Section */}
      <section id="rules" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">Rules & Regulations</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">Please read and follow our court policies to ensure a fair and great experience for everyone.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Booking Privileges & Time Limits */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">schedule</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">Booking Privileges & Time Limits</h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-green-500 shrink-0">check_circle</span>
                  <span className="leading-relaxed"><strong>Booking Limits:</strong> Each user account is allowed a maximum of 1 booking per day, limited to 1 hour per session.</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-green-500 shrink-0">check_circle</span>
                  <span className="leading-relaxed"><strong>Advance Booking:</strong> Bookings can be made up to 1 days in advance (Note: 1-3 days recommended to prevent abandoned bookings).</span>
                </li>
              </ul>
            </div>

            {/* Access & Check-In */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">how_to_reg</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">Access & Check-In</h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-blue-500 shrink-0">qr_code_scanner</span>
                  <span className="leading-relaxed"><strong>Identity Verification:</strong> Users must click the "Check-in" button in the system and scan the QR Code at the counter before using the court.</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-red-500 shrink-0">timer</span>
                  <span className="leading-relaxed"><strong>Late Arrival:</strong> Users must check in within 15 minutes of the scheduled start time. Failure to do so will result in an automatic cancellation (forfeiture), and the slot will be given to walk-in customers.</span>
                </li>
              </ul>
            </div>

            {/* Cancellations & Penalties */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">cancel</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">Cancellations & Penalties</h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-orange-500 shrink-0">event_busy</span>
                  <span className="leading-relaxed"><strong>Cancellation Policy:</strong> If you are unable to attend, you must cancel your booking via the system at least 1 hour in advance.</span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-red-500 shrink-0">warning</span>
                  <span className="leading-relaxed"><strong>Penalties (Blacklist):</strong> Accumulating 2 "No-shows" or failing to cancel within the required timeframe will result in a 7-day suspension of your booking privileges (to ensure fair access for all users).</span>
                </li>
              </ul>
            </div>

            {/* Court Regulations */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">sports_score</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">Court Regulations</h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-[#F26522] shrink-0">steps</span>
                  <span className="leading-relaxed"><strong>Footwear Requirement:</strong> Users must strictly wear non-marking sports shoes designed for badminton to prevent damage to the court surface.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Documentation & Footer */}
      <footer className="bg-black text-white pt-20 pb-10 px-6 md:px-12 lg:px-24">
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
