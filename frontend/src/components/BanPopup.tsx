import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api, { isSessionExpiredError } from '@/lib/api';

interface BanStatus {
  isBanned: boolean;
  bannedUntil?: string;
  strikes: number;
}

export function BanPopup() {
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    
    if (!token || !userStr) return;

    try {
      const user = JSON.parse(userStr);
      if (user.role === 'ADMIN') return; // Admins don't get banned
    } catch {
      return;
    }

    const fetchBanStatus = async () => {
      try {
        const res = await api.get('/users/me/ban-status');
        const data = res.data;
        
        setBanStatus(data);
        if (data.isBanned) {
          setOpen(true);
        }
      } catch (err) {
        if (isSessionExpiredError(err)) return;
        console.error('Failed to fetch ban status', err);
      }
    };

    fetchBanStatus();
  }, []);

  if (!banStatus || !banStatus.isBanned) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-error mb-2">
            <span className="material-symbols-outlined text-[32px]">block</span>
            <DialogTitle className="text-xl">บัญชีของคุณถูกระงับการใช้งาน</DialogTitle>
          </div>
          <DialogDescription className="text-on-surface-variant text-base space-y-3 pt-2">
            <p>
              คุณถูกระงับการจองคอร์ทชั่วคราว เนื่องจากมีการทำผิดกฎครบ 2 ครั้ง (เช่น ไม่มาเช็คอิน หรือยกเลิกหลังเวลาที่กำหนด)
            </p>
            <div className="bg-error-container text-on-error-container p-3 rounded-xl border border-error/20 font-medium">
              ระยะเวลาพ้นแบน: <br/>
              {banStatus.bannedUntil ? new Date(banStatus.bannedUntil).toLocaleString('th-TH') : 'ไม่ระบุ'}
            </div>
            <p className="text-sm">
              หลังจากพ้นแบน จำนวนความผิดจะถูกรีเซ็ตเป็น 0 อัตโนมัติ
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            รับทราบ (Acknowledge)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
