'use client';

import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function NewsPage() {
  const router = useRouter();

  return (
    <MainLayout>
      <div className="flex-1 w-full pb-24">
        {/* News Section (from landing page) */}
        <section className="relative py-16 px-6 md:px-12 lg:px-24 bg-cover bg-fixed bg-center min-h-[80vh] flex flex-col justify-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1920&q=80')` }}>
          <div className="absolute inset-0 bg-black/80 z-0"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0400] via-transparent to-black/40 z-0"></div>
          <div className="relative z-10 max-w-7xl w-full mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6 mt-12">
              <div>
                <h2 className="font-display-lg text-[40px] md:text-[64px] font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                  <span className="material-symbols-outlined text-[48px] md:text-[72px] text-[#F26522]">campaign</span>
                  Latest News
                </h2>
                <p className="text-[18px] text-gray-300 mt-2 font-medium bg-white/10 w-fit px-4 py-1.5 rounded-full backdrop-blur-md border border-white/10">Get updated on the latest KMITL Badminton news</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="group bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-[#F26522]/50 hover:bg-black/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(242,101,34,0.15)] hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
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

              <div className="group bg-black/60 backdrop-blur-md p-8 rounded-3xl border border-white/10 hover:border-[#F26522]/50 hover:bg-black/80 transition-all duration-300 cursor-pointer shadow-lg hover:shadow-[0_8px_30px_rgba(242,101,34,0.15)] hover:-translate-y-1 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#F26522] to-yellow-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-500"></div>
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
    </MainLayout>
  );
}

