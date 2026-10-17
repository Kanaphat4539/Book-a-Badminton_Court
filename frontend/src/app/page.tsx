'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ThemeToggle } from '@/components/theme-toggle';
import { useLocale } from '@/components/locale-provider';
import { LanguageToggle } from '@/components/LanguageToggle';
import { landingMessages, type LandingLocale, type LandingCopy } from '@/lib/landing-messages.cjs';
import { fetchWelcomeContent, getLocalizedText, type WelcomeContentData, type WelcomeNewsItem, type WelcomeTipItem } from '@/lib/welcome-content';

const heroImages = [
  'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1920&q=80',
  'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg/960px-Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg',
  'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYUOMPRdYqlaU4UWU1XQ2jM99-UN3JLKVkoCYYNpLEZm0LMIH_WRkeaO8&s=10'
];

export default function LandingPage() {
  const { locale, setLocale, t } = useLocale();
  const copy = landingMessages[locale as LandingLocale] as LandingCopy;
  const [welcomeData, setWelcomeData] = useState<WelcomeContentData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedNews, setSelectedNews] = useState<WelcomeNewsItem | null>(null);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [currentHeroImage, setCurrentHeroImage] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  const activeHeroImages = welcomeData?.hero?.images?.length ? welcomeData.hero.images : heroImages;

  const nextImage = () => setCurrentHeroImage((prev) => (prev + 1) % activeHeroImages.length);
  const prevImage = () => setCurrentHeroImage((prev) => (prev - 1 + activeHeroImages.length) % activeHeroImages.length);
  const goToImage = (index: number) => setCurrentHeroImage(index);

  useEffect(() => {
    fetchWelcomeContent().then(setWelcomeData);

    const handleContentUpdated = (e: any) => {
      if (e.detail) {
        setWelcomeData(e.detail);
      } else {
        fetchWelcomeContent().then(setWelcomeData);
      }
    };
    window.addEventListener('welcome_content_updated', handleContentUpdated);

    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (u.role === 'ADMIN') setIsAdmin(true);
      } catch {}
    }

    return () => {
      window.removeEventListener('welcome_content_updated', handleContentUpdated);
    };
  }, []);

  useEffect(() => {
    const heroInterval = setInterval(nextImage, 6000);
    return () => clearInterval(heroInterval);
  }, [activeHeroImages.length]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Calculate parallax (Zoom out effect like LINE)
  const heroScale = Math.max(1 - scrollY * 0.0008, 0.75);
  const heroOpacity = Math.max(1 - scrollY * 0.002, 0);
  const heroTranslateY = scrollY * 0.5;
  const heroBorderRadius = Math.min(scrollY * 0.1, 40);

  // Dynamic or dictionary news
  const displayNews: WelcomeNewsItem[] = welcomeData?.news?.length
    ? welcomeData.news
    : [
        {
          id: 'news-default-1',
          tag: t('newsNew'),
          date: '2026/10/10',
          title: t('newsTermsTitle'),
          body: copy.newsTermsBody,
          category: copy.newsCourtCategory,
          image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80'
        },
        {
          id: 'news-default-2',
          tag: t('newsNew'),
          date: '2026/10/08',
          title: t('newsStatsTitle'),
          body: copy.newsStatsBody,
          category: copy.newsDashboardCategory,
          image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&q=80'
        }
      ];

  const displayTips: WelcomeTipItem[] = welcomeData?.tips?.length
    ? welcomeData.tips
    : [
        {
          id: 'tip-default-1',
          date: '2026/10/05',
          title: copy.tipsWarmTitle,
          title_en: '10-Minute Joint Warm-up and Stretching Before Playing',
          body: copy.tipsWarmBody,
          body_en: 'Focus on ankles, knees, and shoulders to boost agility and prevent sudden directional change injuries during rapid rallies.',
          category: copy.tipsWarmCategory,
          category_en: 'Health & Safety',
          image: 'https://images.unsplash.com/photo-1518659728514-6d9b0efdc3e0?w=1200&q=80'
        },
        {
          id: 'tip-default-2',
          date: '2026/10/01',
          title: copy.tipsStringTitle,
          title_en: 'Preserving Your Daily Quota and Avoiding Penalty Strikes',
          body: copy.tipsStringBody,
          body_en: 'If you have urgent errands, cancel within the first 15 minutes to instantly restore your daily quota without strikes.',
          category: copy.tipsStringCategory,
          category_en: 'Rules & Ethics',
          image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80'
        }
      ];

  return (
    <div className="min-h-screen font-sans bg-[#f8f9fa] dark:bg-[#0a0400] text-gray-900 dark:text-gray-100 transition-colors duration-300">

      {/* Floating Admin Quick Edit Button */}
      {isAdmin && (
        <aside aria-label="Admin controls" className="fixed bottom-6 right-6 z-50 animate-bounce">
          <Link
            href="/admin/dashboardwelcome"
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-[#F26522] text-white font-bold shadow-2xl hover:bg-[#d95314] hover:scale-105 active:scale-95 transition-all border border-white/30 backdrop-blur-md"
          >
            <span className="material-symbols-outlined text-[20px]">edit_note</span>
            <span className="text-sm">{copy.editWelcome}</span>
          </Link>
        </aside>
      )}

      {/* Fixed Navbar */}
      <nav className={`fixed top-0 w-full z-50 px-6 md:px-12 lg:px-24 py-4 flex items-center justify-between transition-all duration-300 ${scrolled ? 'bg-black/80 backdrop-blur-md shadow-lg border-b border-white/10' : 'bg-black/20 backdrop-blur-sm border-b border-white/10'}`}>
        <div className="flex items-center gap-12">
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
            <Link href="#services" className="text-white/80 hover:text-white transition-colors">{t('menuServices')}</Link>
            <Link href="#news" className="text-white/80 hover:text-white transition-colors">{copy.menuNews} <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block align-top ml-0.5"></span></Link>
            <Link href="#guide" className="text-white/80 hover:text-white transition-colors">{t('menuGuide')}</Link>
            <Link href="#tips" className="text-white/80 hover:text-white transition-colors">{t('menuTips')}</Link>
            <Link href="#rules" className="text-white/80 hover:text-white transition-colors">{t('menuRules')}</Link>
            {isAdmin && (
              <Link href="/admin/dashboardwelcome" className="text-[#F26522] hover:text-[#ff7e22] font-bold transition-colors flex items-center gap-1">
                <span className="material-symbols-outlined text-[18px]">edit</span> {copy.manageWelcome}
              </Link>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-6">
          <LanguageToggle />
          <Link href="/login" className="hidden md:flex bg-white text-black font-bold text-[14px] px-6 py-2.5 rounded-full hover:bg-gray-200 transition-colors shadow-lg active:scale-95">
            {copy.loginToConsole}
          </Link>
          <button
            aria-label={copy.openMenu}
            className="w-11 h-11 flex items-center justify-center rounded-full text-white hover:bg-white/20 transition-colors"
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
              <span className="font-display-sm text-[20px] font-extrabold text-gray-900 dark:text-orange-50">{t('landingMenu')}</span>
              <button onClick={() => setIsSidebarOpen(false)} className="text-gray-500 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors">
                <span className="material-symbols-outlined text-[28px]">close</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <nav className="flex flex-col gap-6">
                <div className="flex flex-col gap-4">
                  <Link href="#hero" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">{t('menuHome')}</Link>
                  <Link href="#services" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">{t('menuServices')}</Link>
                  <Link href="#news" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center justify-between">{copy.menuNews} <span className="w-2 h-2 rounded-full bg-green-500 inline-block"></span></Link>
                  <Link href="#guide" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">{t('menuGuide')}</Link>
                  <Link href="#tips" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">{t('menuTips')}</Link>
                  <Link href="#rules" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-gray-900 dark:text-orange-50 hover:text-[#F26522] transition-colors border-b border-gray-100 dark:border-gray-800 pb-2">{t('menuRules')}</Link>
                  {isAdmin && (
                    <Link href="/admin/dashboardwelcome" onClick={() => setIsSidebarOpen(false)} className="font-bold text-[18px] text-[#F26522] hover:underline border-b border-gray-100 dark:border-gray-800 pb-2 flex items-center gap-2">
                      <span className="material-symbols-outlined text-[20px]">edit</span> {copy.manageWelcome}
                    </Link>
                  )}
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-[18px] text-gray-900 dark:text-orange-50 mb-3">{t('settings')}</h3>
                  <div className="flex items-center justify-between text-[16px] text-gray-600 dark:text-gray-400 font-medium bg-gray-50 dark:bg-gray-900/50 p-4 rounded-xl">
                    <span>{t('dark')}</span>
                    <ThemeToggle />
                  </div>
                </div>
              </nav>
            </div>

            <div className="p-6 border-t border-gray-100 dark:border-gray-800">
              <Link href="/login" className="w-full bg-gray-900 dark:bg-white text-white dark:text-black font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors shadow-md">
                {copy.loginToConsole}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 1. Hero Section (Scroll-Driven Parallax Slider S06) */}
      <header id="hero" className="relative w-full h-screen overflow-hidden bg-[#f8f9fa] dark:bg-[#0a0400] flex flex-col justify-center">
        {/* Parallax Background Container */}
        <div 
          className="absolute inset-0 w-full h-full transform origin-top transition-all duration-75 ease-out overflow-hidden"
          style={{ 
            transform: `translateY(${heroTranslateY}px) scale(${heroScale})`,
            borderRadius: `${heroBorderRadius}px` 
          }}
        >
          {activeHeroImages.map((img, index) => (
            <div
              key={img}
              className={`absolute inset-0 bg-cover bg-center z-0 transition-all duration-1000 ease-in-out`}
              style={{ 
                backgroundImage: `url('${img}')`,
                opacity: index === currentHeroImage ? 1 : 0,
                transform: index === currentHeroImage ? 'scale(1.05)' : 'scale(1)',
                transition: 'opacity 1s ease-in-out, transform 6s ease-out'
              }}
            />
          ))}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-transparent z-0"></div>

          {/* Overlay Content (Inside shrinking container) */}
          <div 
            className="relative z-10 max-w-7xl w-full mx-auto px-8 md:px-12 lg:px-24 flex flex-col justify-center h-full pt-16"
            style={{ opacity: heroOpacity }}
          >
            <h1 className="font-display-lg text-[42px] sm:text-[56px] md:text-[80px] font-extrabold text-white leading-[1.05] drop-shadow-xl tracking-tight">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F26522] to-yellow-400 filter drop-shadow-md">
                KMITL&nbsp;
              </span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-400 filter drop-shadow-md">
                PCC
              </span>
              <br className="md:hidden" /> BADMINTON
            </h1>
            <p className="text-[20px] sm:text-[26px] md:text-[32px] font-medium text-white/95 drop-shadow-lg mt-3 md:mt-4 mb-8 max-w-3xl leading-snug">
              {getLocalizedText(welcomeData?.hero?.subtitle, welcomeData?.hero?.subtitle_en, locale) || copy.heroConnect}
            </p>
            <Link href="/login" className="font-bold text-[18px] md:text-[22px] text-[#F26522] hover:text-[#ff7e22] transition-all inline-flex items-center gap-2 w-fit bg-white/10 hover:bg-white/20 hover:scale-[1.05] active:scale-[0.98] px-8 py-4 rounded-full backdrop-blur-md border border-white/30 shadow-[0_8px_32px_rgba(0,0,0,0.3)] pointer-events-auto">
              {getLocalizedText(welcomeData?.hero?.ctaText, welcomeData?.hero?.ctaText_en, locale) || copy.heroCta} <span className="material-symbols-outlined font-bold text-[20px] md:text-[24px]">arrow_forward_ios</span>
            </Link>

            {/* Slider Dots */}
            <div className="absolute bottom-12 left-8 md:left-12 lg:left-24 flex gap-3 z-20 pointer-events-auto">
              {activeHeroImages.map((_, idx) => (
                <button 
                  key={idx}
                  onClick={() => goToImage(idx)}
                  className={`transition-all duration-300 rounded-full ${idx === currentHeroImage ? 'w-10 h-2.5 bg-[#F26522]' : 'w-2.5 h-2.5 bg-white/50 hover:bg-white/80'}`}
                  aria-label={`${copy.slideLabel} ${idx + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Slider Controls (Action) */}
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-between px-4 md:px-12 z-20 pointer-events-none">
          <button onClick={prevImage} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all pointer-events-auto active:scale-95 border border-white/20 shadow-lg">
            <span className="material-symbols-outlined text-[32px]">chevron_left</span>
          </button>
          <button onClick={nextImage} className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-white/10 hover:bg-white/30 backdrop-blur-md flex items-center justify-center text-white transition-all pointer-events-auto active:scale-95 border border-white/20 shadow-lg">
            <span className="material-symbols-outlined text-[32px]">chevron_right</span>
          </button>
        </div>
      </header>

      {/* 2. Services Section (Solid Background) */}
      <section id="services" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">{t('menuServices')}</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">{t('serviceIntro')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">
                {welcomeData?.services?.[0]?.icon || 'event_available'}
              </span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.services?.[0]?.title, welcomeData?.services?.[0]?.title_en, locale) || t('courtBookingApi')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {getLocalizedText(welcomeData?.services?.[0]?.body, welcomeData?.services?.[0]?.body_en, locale) || copy.serviceBookingBody}
              </p>
            </div>
            {/* Card 2 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">
                {welcomeData?.services?.[1]?.icon || 'card_membership'}
              </span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.services?.[1]?.title, welcomeData?.services?.[1]?.title_en, locale) || t('membershipLogin')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {getLocalizedText(welcomeData?.services?.[1]?.body, welcomeData?.services?.[1]?.body_en, locale) || copy.serviceMembershipBody}
              </p>
            </div>
            {/* Card 3 */}
            <div className="bg-gray-50 dark:bg-[#140900] p-10 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl group">
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6">
                {welcomeData?.services?.[2]?.icon || 'qr_code_scanner'}
              </span>
              <h3 className="font-bold text-[24px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.services?.[2]?.title, welcomeData?.services?.[2]?.title_en, locale) || t('smartCheckin')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {getLocalizedText(welcomeData?.services?.[2]?.body, welcomeData?.services?.[2]?.body_en, locale) || copy.serviceCheckinBody}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. News Section (Image 2 - Parallax with Image Cards) */}
      <section id="news" className="relative py-24 px-6 md:px-12 lg:px-24 bg-cover bg-fixed bg-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')` }}>
        <div className="absolute inset-0 bg-black/80 z-0"></div>
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
            <div>
              <h2 className="font-display-lg text-[40px] md:text-[64px] font-extrabold text-white tracking-tight">{t('menuNews')}</h2>
              <p className="text-[18px] text-gray-300 mt-2">{t('newsIntro')}</p>
            </div>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin/dashboardwelcome" className="text-xs font-bold px-3 py-1.5 rounded-full bg-[#F26522]/80 text-white hover:bg-[#F26522] transition-colors inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span> {copy.manageNewsImages}
                </Link>
              )}
              <Link href="/news" className="font-bold text-white hover:text-[#F26522] transition-colors flex items-center gap-1">
                {copy.tipsViewAll} <span className="material-symbols-outlined text-[20px]">chevron_right</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayNews.map((item, idx) => (
              <div
                key={item.id || idx}
                onClick={() => setSelectedNews(item)}
                className="group bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 hover:border-[#F26522]/50 hover:bg-black/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(242,101,34,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>

                {item.image && (
                  <div className="h-52 w-full overflow-hidden bg-black/40 relative">
                    <img
                      src={item.image}
                      alt={getLocalizedText(item.title, item.title_en, locale)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    <span className="absolute top-4 left-4 bg-[#F26522] text-white text-[10px] font-black px-2.5 py-1 rounded uppercase tracking-wider shadow">
                      {getLocalizedText(item.tag, item.tag_en, locale) || t('newsNew')}
                    </span>
                    <time className="absolute bottom-3 right-4 text-gray-300 text-[13px] font-medium bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                      {item.date}
                    </time>
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col justify-between">
                  {!item.image && (
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">
                        {getLocalizedText(item.tag, item.tag_en, locale) || t('newsNew')}
                      </span>
                      <span className="text-gray-400 text-[14px]">{item.date}</span>
                    </div>
                  )}
                  <div>
                    <h3 className="font-bold text-[22px] text-white mb-4 leading-snug group-hover:text-[#F26522] transition-colors">
                      {getLocalizedText(item.title, item.title_en, locale)}
                    </h3>
                    <p className="text-gray-300 text-[15px] leading-relaxed line-clamp-3 mb-6">
                      {getLocalizedText(item.body, item.body_en, locale)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-white/5">
                    <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">
                      {getLocalizedText(item.category, item.category_en, locale)}
                    </span>
                    <span className="text-xs text-[#F26522] font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                      {copy.readMoreAction} <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Guide Section */}
      <section id="guide" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 text-center">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">{copy.guideTitle}</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">{copy.guideIntro}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mt-12 pt-6">
            {/* Step 1 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">1</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">
                {welcomeData?.guide?.[0]?.icon || 'login'}
              </span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.guide?.[0]?.title, welcomeData?.guide?.[0]?.title_en, locale) || copy.guideStep1Title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                {getLocalizedText(welcomeData?.guide?.[0]?.body, welcomeData?.guide?.[0]?.body_en, locale) || copy.guideStep1Body}
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">2</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">
                {welcomeData?.guide?.[1]?.icon || 'event_seat'}
              </span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.guide?.[1]?.title, welcomeData?.guide?.[1]?.title_en, locale) || copy.guideStep2Title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                {getLocalizedText(welcomeData?.guide?.[1]?.body, welcomeData?.guide?.[1]?.body_en, locale) || copy.guideStep2Body}
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">3</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">
                {welcomeData?.guide?.[2]?.icon || 'check_circle'}
              </span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.guide?.[2]?.title, welcomeData?.guide?.[2]?.title_en, locale) || copy.guideStep3Title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                {getLocalizedText(welcomeData?.guide?.[2]?.body, welcomeData?.guide?.[2]?.body_en, locale) || copy.guideStep3Body}
              </p>
            </div>

            {/* Step 4 */}
            <div className="relative bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:-translate-y-2 hover:shadow-xl group">
              <div className="absolute -top-6 -left-6 w-12 h-12 bg-gradient-to-br from-[#F26522] to-yellow-400 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-4 border-white dark:border-[#0a0400] group-hover:scale-110 transition-transform">4</div>
              <span className="material-symbols-outlined text-[48px] text-gray-400 group-hover:text-[#F26522] transition-colors mb-6 block">
                {welcomeData?.guide?.[3]?.icon || 'qr_code_scanner'}
              </span>
              <h3 className="font-bold text-[20px] text-gray-900 dark:text-white mb-4">
                {getLocalizedText(welcomeData?.guide?.[3]?.title, welcomeData?.guide?.[3]?.title_en, locale) || copy.guideStep4Title}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-[15px]">
                {getLocalizedText(welcomeData?.guide?.[3]?.body, welcomeData?.guide?.[3]?.body_en, locale) || copy.guideStep4Body}
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
              <h2 className="font-display-lg text-[40px] md:text-[64px] font-extrabold text-white tracking-tight">{copy.tipsTitle}</h2>
              <p className="text-[18px] text-gray-300 mt-2">{copy.tipsIntro}</p>
            </div>
            <Link href="#" className="font-bold text-white hover:text-[#F26522] transition-colors flex items-center gap-1">
              {copy.tipsViewAll} <span className="material-symbols-outlined text-[20px]">chevron_right</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {displayTips.map((tip, idx) => (
              <div
                key={tip.id || idx}
                className="group bg-[#1a1a1a]/90 backdrop-blur-md rounded-3xl border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden flex flex-col justify-between shadow-lg"
              >
                {tip.image && (
                  <div className="h-56 w-full overflow-hidden bg-black/40 relative">
                    <img
                      src={tip.image}
                      alt={getLocalizedText(tip.title, tip.title_en, locale) || ''}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                    {tip.date && (
                      <span className="absolute bottom-3 right-4 text-gray-300 text-[13px] font-medium bg-black/60 backdrop-blur-sm px-2.5 py-1 rounded-md">
                        {tip.date}
                      </span>
                    )}
                  </div>
                )}

                <div className="p-8 flex-1 flex flex-col justify-between">
                  {!tip.image && tip.date && (
                    <span className="text-gray-400 text-[14px] block mb-3">
                      {tip.date}
                    </span>
                  )}
                  <div>
                    <h3 className="font-bold text-[24px] text-white mb-4 leading-snug group-hover:text-[#F26522] transition-colors">
                      {getLocalizedText(tip.title, tip.title_en, locale) || (idx === 0 ? copy.tipsWarmTitle : copy.tipsStringTitle)}
                    </h3>
                    <p className="text-gray-300 text-[15px] leading-relaxed mb-8">
                      {getLocalizedText(tip.body, tip.body_en, locale) || (idx === 0 ? copy.tipsWarmBody : copy.tipsStringBody)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">
                      {getLocalizedText(tip.category, tip.category_en, locale) || (idx === 0 ? copy.tipsWarmCategory : copy.tipsStringCategory)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Rules Section */}
      <section id="rules" className="py-24 px-6 md:px-12 lg:px-24 bg-white dark:bg-[#0a0400]">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16">
            <h2 className="font-display-lg text-[40px] md:text-[56px] font-extrabold text-gray-900 dark:text-white tracking-tight">{copy.rulesTitle}</h2>
            <p className="text-[18px] text-gray-600 dark:text-gray-400 mt-2">{copy.rulesIntro}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Booking Privileges & Time Limits */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">schedule</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">
                  {getLocalizedText(welcomeData?.rules?.[0]?.title, welcomeData?.rules?.[0]?.title_en, locale) || copy.rulesBookingTitle}
                </h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-green-500 shrink-0">check_circle</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[0]?.items_en?.[0]) || welcomeData?.rules?.[0]?.items?.[0] || copy.rulesBookingLimit}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-green-500 shrink-0">check_circle</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[0]?.items_en?.[1]) || welcomeData?.rules?.[0]?.items?.[1] || copy.rulesAdvance}
                  </span>
                </li>
              </ul>
            </div>

            {/* Access & Check-In */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">how_to_reg</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">
                  {getLocalizedText(welcomeData?.rules?.[1]?.title, welcomeData?.rules?.[1]?.title_en, locale) || copy.rulesAccessTitle}
                </h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-blue-500 shrink-0">qr_code_scanner</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[1]?.items_en?.[0]) || welcomeData?.rules?.[1]?.items?.[0] || copy.rulesIdentity}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-red-500 shrink-0">timer</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[1]?.items_en?.[1]) || welcomeData?.rules?.[1]?.items?.[1] || copy.rulesLate}
                  </span>
                </li>
              </ul>
            </div>

            {/* Cancellations & Penalties */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">cancel</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">
                  {getLocalizedText(welcomeData?.rules?.[2]?.title, welcomeData?.rules?.[2]?.title_en, locale) || copy.rulesCancelTitle}
                </h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-orange-500 shrink-0">event_busy</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[2]?.items_en?.[0]) || welcomeData?.rules?.[2]?.items?.[0] || copy.rulesCancellation}
                  </span>
                </li>
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-red-500 shrink-0">warning</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[2]?.items_en?.[1]) || welcomeData?.rules?.[2]?.items?.[1] || copy.rulesPenalty}
                  </span>
                </li>
              </ul>
            </div>

            {/* Court Regulations */}
            <div className="bg-gray-50 dark:bg-[#140900] p-8 rounded-3xl border border-gray-100 dark:border-white/5 hover:border-[#F26522]/50 transition-all hover:shadow-xl">
              <div className="flex items-center gap-4 mb-6">
                <span className="material-symbols-outlined text-[32px] text-[#F26522]">sports_score</span>
                <h3 className="font-bold text-[22px] text-gray-900 dark:text-white">
                  {getLocalizedText(welcomeData?.rules?.[3]?.title, welcomeData?.rules?.[3]?.title_en, locale) || copy.rulesCourtTitle}
                </h3>
              </div>
              <ul className="space-y-4 text-gray-600 dark:text-gray-400">
                <li className="flex gap-3">
                  <span className="material-symbols-outlined text-[24px] text-[#F26522] shrink-0">steps</span>
                  <span className="leading-relaxed">
                    {(locale === 'en' && welcomeData?.rules?.[3]?.items_en?.[0]) || welcomeData?.rules?.[3]?.items?.[0] || copy.rulesFootwear}
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Modal Dialog: Read Full News */}
      {selectedNews && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#140900] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] flex flex-col">
            {selectedNews.image && (
              <div className="relative h-60 w-full bg-black">
                <img
                  src={selectedNews.image}
                  alt={getLocalizedText(selectedNews.title, selectedNews.title_en, locale)}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            )}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F26522]/15 text-[#F26522]">
                  {getLocalizedText(selectedNews.category, selectedNews.category_en, locale)}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                  {selectedNews.date}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 leading-snug">
                {getLocalizedText(selectedNews.title, selectedNews.title_en, locale)}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">
                {getLocalizedText(selectedNews.body, selectedNews.body_en, locale)}
              </p>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/10 flex justify-end bg-gray-50 dark:bg-zinc-900/50">
              <button
                onClick={() => setSelectedNews(null)}
                className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90 transition-opacity"
              >
                {copy.closeWindow}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Documentation & Footer */}
      <footer className="bg-black text-white pt-20 pb-10 px-6 md:px-12 lg:px-24">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 border-b border-white/10 pb-16 mb-8">

            <div className="col-span-1 lg:col-span-2">
              <h2 className="font-display-sm text-[28px] font-extrabold mb-6"><span className="text-[#F26522]">KMITL</span> PCC BADMINTON</h2>
              <p className="text-gray-400 max-w-md">
                {copy.footerDescription}
              </p>
            </div>

            <div>
              <h3 className="font-bold text-[18px] mb-6">{copy.footerRules}</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerBooking}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerCancellation}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerEtiquette}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerFees}</Link></li>
              </ul>
            </div>

            <div>
              <h3 className="font-bold text-[18px] mb-6">{copy.footerContact}</h3>
              <ul className="space-y-4 text-gray-400">
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerSupport}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors">{copy.footerIssue}</Link></li>
                <li><Link href="#" className="hover:text-white transition-colors flex items-center gap-1">Facebook <span className="material-symbols-outlined text-[14px]">open_in_new</span></Link></li>
              </ul>
            </div>

          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-gray-500 text-[14px]">
            <p>© 2026 KMITL PCC Badminton Club</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-white transition-colors">{copy.footerTerms}</Link>
              <Link href="#" className="hover:text-white transition-colors">{copy.footerTrademarks}</Link>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
