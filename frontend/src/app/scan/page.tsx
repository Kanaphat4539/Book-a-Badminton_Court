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
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const parsedUser = JSON.parse(userStr);
        if (parsedUser.role === 'ADMIN') {
          router.push('/dashboard');
        }
      } catch (e) {}
    }

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
      const pendingBooking = myBookingsRef.current.find(b => b.status === 'PENDING' && b.court === courtId);
      
      if (!pendingBooking) {
        throw new Error('You do not have a pending booking for this court right now.');
      }

      const bookingId = pendingBooking.booking_id || pendingBooking.id;
      await api.post(`/bookings/${bookingId}/check-in`, { courtId });
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
    <MainLayout width="full">
      <div className="w-full flex-1 flex flex-col relative z-10 pb-10">
        
        {/* Sporty Header (Edge-to-edge) */}
        <div className="relative w-full overflow-hidden bg-gradient-to-r from-[#F26522] to-yellow-500 shadow-[0_8px_24px_rgba(242,101,34,0.3)]">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 z-0"></div>
          <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-white/20 rounded-full blur-3xl pointer-events-none z-0"></div>
          
          <div className="mx-auto max-w-7xl px-6 md:px-10 py-10 relative z-10 flex items-center justify-between">
            <div className="flex flex-col">
              <h1 className="font-headline-lg text-[28px] md:text-[40px] font-black text-white flex items-center gap-2 drop-shadow-md pb-2">
                <span className="material-symbols-outlined text-[32px] md:text-[40px]">qr_code_scanner</span>
                Scan & Play
              </h1>
              <p className="text-white/90 text-[14px] md:text-[16px] mt-1 font-medium">Verify your court booking</p>
            </div>
            <div className="relative z-10">
              <button 
                className="bg-white/20 hover:bg-white/30 backdrop-blur-md text-white px-4 md:px-6 py-2 md:py-3 rounded-xl font-bold text-[14px] md:text-[16px] transition-colors border border-white/30 shadow-sm" 
                onClick={() => router.push('/dashboard')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-md w-full px-4 flex-1 flex flex-col mt-10">

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-surface/70 backdrop-blur-md p-2 rounded-2xl w-full max-w-sm overflow-hidden shadow-lg border border-outline-variant transition-colors duration-300">
            <div id="qr-reader" className="w-full"></div>
          </div>
          
          <div className="mt-8 text-center text-on-surface-variant font-body-md text-[14px] transition-colors duration-300">
            {loading ? (
              <p className="animate-pulse text-primary font-bold">Processing Check-in...</p>
            ) : (
              <div className="flex flex-col gap-2">
                <p>Point your camera at the QR code on the court to check in.</p>
                <div className="bg-surface-container-high text-on-surface p-3 rounded-xl border border-outline-variant text-[13px] font-semibold mt-2">
                  <span className="material-symbols-outlined text-[16px] inline-block align-text-bottom mr-1">info</span>
                  Note: You can only scan the QR code when it is exactly time for your booking.
                </div>
              </div>
            )}
          </div>
        </div>
        </div>
      </div>
    </MainLayout>
  );
}
