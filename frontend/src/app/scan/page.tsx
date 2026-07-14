'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';

export default function ScanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
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
      router.push('/');
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Check-in failed');
      setTimeout(() => {
        setScannedResult(null);
        setLoading(false);
        router.push('/');
      }, 3000);
    }
  };

  return (
    <div className="bg-background text-on-background antialiased min-h-screen flex flex-col font-sans">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col p-container-padding">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 mt-4">
          <h1 className="font-display-sm text-[24px] font-bold text-white">Scan QR Code</h1>
          <button 
            className="text-primary font-button text-[14px] font-semibold hover:opacity-80 transition-opacity" 
            onClick={() => router.push('/')}
          >
            Cancel
          </button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-surface p-2 rounded-2xl w-full max-w-sm overflow-hidden shadow-[0_0_30px_rgba(255,107,0,0.2)] border border-primary/30">
            <div id="qr-reader" className="w-full"></div>
          </div>
          
          <div className="mt-8 text-center text-on-surface-variant font-body-md text-[14px]">
            {loading ? (
              <p className="animate-pulse text-primary font-bold">Processing Check-in...</p>
            ) : (
              <p>Point your camera at the QR code on the court to check in.</p>
            )}
          </div>
        </div>
      </div>

      {/* BottomNavBar */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center pt-2 pb-6 px-4 z-50 rounded-t-xl bg-surface-container/90 backdrop-blur-md shadow-[0px_-8px_24px_rgba(0,0,0,0.5)] border-t border-[#2A2A2A]">
        <button onClick={() => router.push('/')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>sports_tennis</span>
          <span className="font-label-md text-[12px] font-semibold">Home</span>
        </button>
        <button onClick={() => router.push('/booking')} className="flex flex-col items-center justify-center text-on-surface-variant hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 0"}}>event_note</span>
          <span className="font-label-md text-[12px] font-semibold">Bookings</span>
        </button>
        <button className="flex flex-col items-center justify-center text-primary font-bold hover:text-primary/80 transition-colors active:scale-90 transition-transform duration-150 gap-1 w-16">
          <span className="material-symbols-outlined" style={{fontVariationSettings: "'FILL' 1"}}>qr_code_scanner</span>
          <span className="font-label-md text-[12px] font-semibold">Scan</span>
        </button>
      </nav>
    </div>
  );
}

