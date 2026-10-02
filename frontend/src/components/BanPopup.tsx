import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import api, { isSessionExpiredError } from '@/lib/api';
import { useLocale } from '@/components/locale-provider';
import { playerUiCopy } from '@/lib/player-ui-copy.cjs';

interface BanStatus {
  isBanned: boolean;
  bannedUntil?: string;
  strikes: number;
}

export function BanPopup() {
  const [banStatus, setBanStatus] = useState<BanStatus | null>(null);
  const [open, setOpen] = useState(false);
  const { locale } = useLocale();
  const ui = playerUiCopy[locale];

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

  const bannedUntilText = banStatus.bannedUntil
    ? new Intl.DateTimeFormat(locale === 'th' ? 'th-TH' : 'en-US', {
        timeZone: 'Asia/Bangkok',
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date(banStatus.bannedUntil))
    : ui.banUntilUnknown;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 text-error mb-2">
            <span className="material-symbols-outlined text-[32px]">block</span>
            <DialogTitle className="text-xl">{ui.banTitle}</DialogTitle>
          </div>
          <DialogDescription className="text-on-surface-variant text-base space-y-3 pt-2">
            <p>
              {ui.banBody}
            </p>
            <div className="bg-error-container text-on-error-container p-3 rounded-xl border border-error/20 font-medium">
              {ui.banUntilLabel} <br/>
              {bannedUntilText}
            </div>
            <p className="text-sm">
              {ui.banResetNote}
            </p>
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} className="w-full sm:w-auto">
            {ui.banAcknowledge}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
