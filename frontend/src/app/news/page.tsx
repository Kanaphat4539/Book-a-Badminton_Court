'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { useLocale } from '@/components/locale-provider';
import { translate as authNewsText } from '@/lib/auth-news-messages.cjs';
import { fetchWelcomeContent, getLocalizedText, type WelcomeNewsItem } from '@/lib/welcome-content';

export default function NewsPage() {
  const router = useRouter();
  const { locale } = useLocale();
  const text = (key: string) => authNewsText(key, locale);

  const [newsList, setNewsList] = useState<WelcomeNewsItem[]>([]);
  const [selectedNews, setSelectedNews] = useState<WelcomeNewsItem | null>(null);

  useEffect(() => {
    fetchWelcomeContent().then((res) => {
      if (res && res.news && res.news.length > 0) {
        setNewsList(res.news);
      }
    });

    const handleContentUpdated = (e: any) => {
      const data = e.detail;
      if (data && data.news && data.news.length > 0) {
        setNewsList(data.news);
      } else {
        fetchWelcomeContent().then((res) => {
          if (res && res.news) setNewsList(res.news);
        });
      }
    };
    window.addEventListener('welcome_content_updated', handleContentUpdated);
    return () => {
      window.removeEventListener('welcome_content_updated', handleContentUpdated);
    };
  }, []);

  return (
    <MainLayout width="full">
      <div className="flex-1 w-full">
        {/* News Section (from landing page) */}
        <section className="relative py-16 px-6 md:px-12 lg:px-24 bg-cover bg-fixed bg-center min-h-[80vh] flex flex-col justify-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')` }}>
          <div className="absolute inset-0 bg-black/80 z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0400] via-transparent to-black/40 z-0"></div>
          <div className="relative z-10 max-w-7xl w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 mt-12">
              <div>
                <h2 className="font-display-lg text-[40px] md:text-[64px] font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                  <span className="material-symbols-outlined text-[48px] md:text-[72px] text-[#F26522]">campaign</span>
                  {text('newsHeading')}
                </h2>
                <p className="text-[18px] text-gray-300 mt-2 font-medium bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">{text('newsIntro')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {newsList.length > 0 ? (
                newsList.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => setSelectedNews(item)}
                    className="group bg-black/60 backdrop-blur-md rounded-3xl border border-white/10 hover:border-[#F26522]/50 hover:bg-black/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(242,101,34,0.15)] hover:-translate-y-1 relative overflow-hidden flex flex-col justify-between"
                  >
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    
                    {item.image && (
                      <div className="h-48 w-full overflow-hidden bg-black/40 relative">
                        <img src={item.image} alt={getLocalizedText(item.title, item.title_en, locale)} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                      </div>
                    )}

                    <div className="p-8 flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start mb-4">
                        <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{getLocalizedText(item.tag, item.tag_en, locale) || (locale === 'th' ? 'ใหม่' : 'New')}</span>
                        <time className="text-gray-400 text-[14px]">{item.date}</time>
                      </div>
                      <h3 className="font-bold text-[22px] text-white mb-4 leading-snug group-hover:text-[#F26522] transition-colors">{getLocalizedText(item.title, item.title_en, locale)}</h3>
                      <p className="text-gray-300 text-[15px] leading-relaxed line-clamp-3 mb-6">
                        {getLocalizedText(item.body, item.body_en, locale)}
                      </p>
                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">{getLocalizedText(item.category, item.category_en, locale)}</span>
                        <span className="text-xs text-[#F26522] font-bold">{text('readMore')}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="group bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-[#F26522]/50 hover:bg-black/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(242,101,34,0.15)] hover:-translate-y-1 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-green-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">{locale === 'th' ? 'ใหม่' : 'New'}</span>
                      <time className="text-gray-400 text-[14px]" dateTime="2026-07-17">2026/07/17</time>
                    </div>
                    <h3 className="font-bold text-[22px] text-white mb-4 leading-snug">{locale === 'th' ? 'ปรับปรุงระเบียบการจองสนาม' : 'Court booking policy update'}</h3>
                    <p className="text-gray-300 text-[15px] leading-relaxed line-clamp-3 mb-6">
                      {locale === 'th' ? 'ระบบจองสนามแบดมินตัน KMITL อัปเดตระเบียบการใช้งาน' : 'KMITL Badminton Court booking system updates terms of service.'}
                    </p>
                    <span className="text-[12px] text-gray-400 bg-white/10 px-3 py-1.5 rounded-lg">{locale === 'th' ? 'การจอง' : 'Booking'}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* Read News Dialog */}
      {selectedNews && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#140900] rounded-3xl overflow-hidden shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] flex flex-col">
            {selectedNews.image && (
              <div className="relative h-60 w-full bg-black">
                <img src={selectedNews.image} alt={getLocalizedText(selectedNews.title, selectedNews.title_en, locale)} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
              </div>
            )}
            <div className="p-6 sm:p-8 overflow-y-auto flex-1">
              <div className="flex items-center justify-between gap-2 mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-[#F26522]/15 text-[#F26522]">{getLocalizedText(selectedNews.category, selectedNews.category_en, locale)}</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">{selectedNews.date}</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white mb-4 leading-snug">{getLocalizedText(selectedNews.title, selectedNews.title_en, locale)}</h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-sm sm:text-base whitespace-pre-line">{getLocalizedText(selectedNews.body, selectedNews.body_en, locale)}</p>
            </div>
            <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/10 flex justify-end bg-gray-50 dark:bg-zinc-900/50">
              <button onClick={() => setSelectedNews(null)} className="px-6 py-2.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-sm hover:opacity-90">{text('closeWindow')}</button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
