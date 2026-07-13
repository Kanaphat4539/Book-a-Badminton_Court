'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
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
    <div className="min-h-screen bg-slate-900 flex flex-col p-4">
      <div className="max-w-md w-full mx-auto flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-8 text-white mt-4">
          <h1 className="text-2xl font-bold">Scan QR Code</h1>
          <Button variant="ghost" className="text-white hover:bg-slate-800 hover:text-white" onClick={() => router.push('/')}>Cancel</Button>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="bg-white p-2 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div id="qr-reader" className="w-full"></div>
          </div>
          
          <div className="mt-8 text-center text-slate-300">
            {loading ? (
              <p className="animate-pulse text-emerald-400">Processing Check-in...</p>
            ) : (
              <p>Point your camera at the QR code on the court to check in.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
