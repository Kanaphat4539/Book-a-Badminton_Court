'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import { ThemeToggle } from '@/components/theme-toggle';

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/me');
        setMyBookings(response.data);
      } catch (err) {
        toast.error('Failed to load your bookings');
      }
    };
    fetchBookings();
  }, []);

  useEffect(() => {
    // Initialize QR scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(error => {
          console.error("Failed to clear html5QrcodeScanner. ", error);
        });
      }
    };
  }, [myBookings]);

  const onScanSuccess = async (decodedText: string, decodedResult: any) => {
    if (loading || scannedResult) return;
    setScannedResult(decodedText);
    
    // Stop scanning
    if (scannerRef.current) {
      scannerRef.current.clear();
    }

    // Assuming the decodedText is the courtId (e.g. "1")
    const courtId = parseInt(decodedText, 10);
    
    if (isNaN(courtId)) {
      toast.error('Invalid QR Code. Please scan a valid court QR.');
      setScannedResult(null);
      return;
    }

    handleCheckIn(courtId);
  };

  const onScanFailure = (error: any) => {
    // handle scan failure, usually better to ignore and keep scanning
  };

  const handleCheckIn = async (courtId: number) => {
    setLoading(true);
    try {
      // Find the pending booking for this court
      const pendingBooking = myBookings.find(b => b.status === 'PENDING' && b.court.id === courtId);
      
      if (!pendingBooking) {
        throw new Error('You do not have a pending booking for this court right now.');
      }

      await api.post(`/bookings/${pendingBooking.id}/check-in`, { courtId });
      toast.success('Check-in successful! Enjoy your game.');
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Check-in failed');
      setTimeout(() => {
        setScannedResult(null);
        setLoading(false);
        router.push('/dashboard');
      }, 3000);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-50 via-white to-orange-100 dark:from-[#2a1300] dark:via-[#140900] dark:to-[#2a1300] text-on-surface dark:text-orange-50 antialiased min-h-screen flex flex-col font-sans transition-colors duration-300 relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[0%] left-[-10%] w-[500px] h-[500px] bg-primary/10 dark:bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
        <div className="absolute bottom-[0%] right-[-10%] w-[400px] h-[400px] bg-yellow-200/50 dark:bg-yellow-600/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 transition-colors duration-300"></div>
      </div>

      <div className="max-w-md w-full mx-auto flex-1 flex flex-col p-container-padding relative z-10">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <h1 className="font-display-sm text-[24px] font-bold text-gray-900 dark:text-orange-50 transition-colors duration-300">Scan QR Code</h1>
          <div className="flex items-center gap-4">

            <button className="lg:hidden w-11 h-11 flex items-center justify-center rounded-full bg-white/80 dark:bg-[#1a0a00]/80 shadow-sm border border-gray-200 dark:border-[#ff6b00]/20 text-gray-800 dark:text-orange-50 hover:bg-gray-100 dark:hover:bg-[#3a1b00] transition-colors" onClick={() => setIsSidebarOpen(true)}>
              <span className="material-symbols-outlined text-[28px]">menu</span>
            </button>
            <button 
              className="text-primary font-button text-[14px] font-semibold hover:opacity-80 transition-opacity" 
              onClick={() => router.push('/dashboard')}
            >
              Cancel
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white/70 dark:bg-[#1a0a00]/70 backdrop-blur-md p-2 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(255,107,0,0.2)] border border-primary/30 dark:border-[#ff6b00]/30 transition-colors duration-300">
            <div id="qr-reader" className="w-full"></div>
          </div>
          
          <div className="mt-8 text-center text-gray-600 dark:text-orange-200/70 font-body-md text-[14px] transition-colors duration-300">
            {loading ? (
              <p className="animate-pulse text-primary font-bold">Processing Check-in...</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>Point your camera at the QR code on the court to check in.</p>
                <div className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 p-3 rounded-xl border border-orange-200 dark:border-orange-800/30 text-[13px] font-semibold mt-2">
                  <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">info</span>
                  Note: You can only scan the QR code when it is exactly time for your booking.
                </div>
              </div>
            )}
          </div>
        </div>
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
        <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>qr_code_scanner</span>
          <span className="font-label-md text-[12px] font-semibold">Scan</span>
        </button>
        <button onClick={() => router.push('/news')} className="flex flex-col items-center justify-center text-gray-500 dark:text-orange-300/60 hover:text-primary dark:hover:text-primary transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 0" }}>article</span>
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
