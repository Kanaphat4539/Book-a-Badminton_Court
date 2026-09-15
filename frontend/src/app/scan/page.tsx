'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [scannedResult, setScannedResult] = useState<string | null>(null);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const myBookingsRef = useRef<any[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await api.get('/bookings/me');
        setMyBookings(response.data);
        myBookingsRef.current = response.data;
      } catch (err) {
        toast.error('Failed to load your bookings');
      }
    };
    fetchBookings();
  }, []);

  const isProcessingRef = useRef(false);

  const handleCheckIn = async (courtId: number) => {
    setLoading(true);
    try {
      // Find the pending booking for this court using the ref
      const pendingBooking = myBookingsRef.current.find(b => b.status === 'PENDING' && b.court.id === courtId);
      
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
        isProcessingRef.current = false;
        router.push('/dashboard');
      }, 3000);
    }
  };

  const onScanSuccess = async (decodedText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScannedResult(decodedText);
    
    // Stop scanning
    if (scannerRef.current) {
      scannerRef.current.clear().catch(() => {});
      scannerRef.current = null;
    }

    const courtId = parseInt(decodedText, 10);
    
    if (isNaN(courtId)) {
      toast.error('Invalid QR Code. Please scan a valid court QR.');
      setScannedResult(null);
      isProcessingRef.current = false;
      return;
    }

    handleCheckIn(courtId);
  };

  const onScanFailure = () => {
    // handle scan failure, usually better to ignore and keep scanning
  };

  useEffect(() => {
    // We use a small timeout to ensure the DOM is completely ready
    // and to avoid React 18 strict mode double-invocation races.
    const timer = setTimeout(() => {
      const element = document.getElementById('qr-reader');
      if (!element) return;

      if (!scannerRef.current) {
        scannerRef.current = new Html5QrcodeScanner(
          'qr-reader',
          { fps: 10, qrbox: { width: 250, height: 250 } },
          false
        );
        scannerRef.current.render(onScanSuccess, onScanFailure);
      }
    }, 100);

    return () => {
      clearTimeout(timer);
      if (scannerRef.current) {
        scannerRef.current.clear().catch((error: unknown) => {
          console.error('Failed to clear html5QrcodeScanner. ', error);
        });
        scannerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col px-4 relative z-10">
        
        {/* Sporty Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#F26522] to-yellow-500 p-6 mb-8 mt-4 shadow-[0_8px_24px_rgba(242,101,34,0.3)] flex items-center justify-between">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0"></div>
          <div className="relative z-10 flex flex-col">
            <h1 className="font-headline-lg text-[28px] font-black text-white flex items-center gap-2 drop-shadow-md">
              <span className="material-symbols-outlined text-[32px]">qr_code_scanner</span>
              Scan & Play
            </h1>
            <p className="text-white/90 text-[13px] mt-1 font-medium">Verify your court booking</p>
          </div>
          <div className="relative z-10">
            <button 
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 py-2 rounded-xl font-bold text-[14px] transition-colors border border-white/30 shadow-sm" 
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
    </MainLayout>
  );
}
