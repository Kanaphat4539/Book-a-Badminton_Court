'use client';

import { Suspense, useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAxiosError } from 'axios';
import { bookingErrorMessage, formatBookingDate } from '@/lib/booking-page-messages.cjs';
import { selectCourtText, type SelectCourtCopyKey } from '@/lib/select-court-copy.cjs';
import api from '@/lib/api';
import { toast } from 'sonner';
import MainLayout from '@/components/MainLayout';
import { useLocale } from '@/components/locale-provider';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  createBookingConfirmationDetails,
  createTodayBookingDate,
  isBookingSlotSelectable,
} from '@/lib/booking-display';

type Court = {
  id: number;
  name: string;
  description?: string;
  status: string;
  image?: string;
  location?: string;
  bookings?: Array<{
    start_time: string;
    status: string;
  }>;
};

type SelectedBooking = {
  court: Court;
  bookerName: string;
};

function SelectCourtContent() {
  const { locale } = useLocale();
  const t = useCallback((key: SelectCourtCopyKey, ...args: (string | number)[]) => selectCourtText(locale, key, ...args), [locale]);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const dateParam = searchParams.get('date');
  const timeParam = searchParams.get('time');
  
  const [courts, setCourts] = useState<Court[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<SelectedBooking | null>(null);

  const [isAdmin, setIsAdmin] = useState(false);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editCourtImage, setEditCourtImage] = useState('');
  const [editCourtLocation, setEditCourtLocation] = useState('');
  const [updatingCourt, setUpdatingCourt] = useState(false);
  const courtFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const u = JSON.parse(localStorage.getItem('user') || '{}');
      if (u.role === 'ADMIN') setIsAdmin(true);
    } catch {}
  }, []);

  const handleOpenEditCourt = (court: Court, currentImg: string, currentLoc: string) => {
    setEditingCourt(court);
    setEditCourtImage(court.image || currentImg);
    setEditCourtLocation(court.location || currentLoc);
  };

  const handleCourtFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(locale === 'th' ? 'ขนาดไฟล์รูปภาพไม่ควรเกิน 5MB' : 'Image file size must not exceed 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setEditCourtImage(reader.result);
        toast.success(locale === 'th' ? 'โหลดรูปภาพเรียบร้อยแล้ว' : 'Image loaded successfully');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCourt = async () => {
    if (!editingCourt) return;
    setUpdatingCourt(true);
    try {
      await api.patch(`/courts/${editingCourt.id}`, {
        image: editCourtImage,
        location: editCourtLocation,
      });
      setCourts((prev) =>
        prev.map((c) =>
          c.id === editingCourt.id
            ? { ...c, image: editCourtImage, location: editCourtLocation }
            : c
        )
      );
      toast.success(locale === 'th' ? `บันทึกการเปลี่ยนรูปภาพของ ${editingCourt.name} สำเร็จแล้ว!` : `Court image updated successfully for ${editingCourt.name}!`);
      setEditingCourt(null);
    } catch (err: any) {
      console.error(err);
      toast.error(err?.response?.data?.message || (locale === 'th' ? 'ไม่สามารถบันทึกข้อมูลคอร์ทได้' : 'Failed to save court details'));
    } finally {
      setUpdatingCourt(false);
    }
  };

  const displayDateStr = useMemo(() => {
    if (!dateParam || !timeParam) return '';

    return formatBookingDate(dateParam, timeParam, locale);
  }, [dateParam, timeParam, locale]);

  const loadAvailability = useCallback(async (dateStr: string) => {
    const response = await api.get<Court[]>(`/courts/availability?date=${dateStr}`);
    return response.data;
  }, []);

  useEffect(() => {
    if (!dateParam || !timeParam) {
      router.push('/booking');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }

    if (dateParam !== createTodayBookingDate(new Date()).date) {
      toast.error(t('todayPolicyShort'));
      router.replace('/booking');
      return;
    }

    let ignoreResponse = false;

    void loadAvailability(dateParam)
      .then((availableCourts) => {
        if (!ignoreResponse) setCourts(availableCourts);
      })
      .catch(() => {
        if (!ignoreResponse) toast.error(t('loadError'));
      })
      .finally(() => {
        if (!ignoreResponse) setLoading(false);
      });

    return () => {
      ignoreResponse = true;
    };
  }, [dateParam, loadAvailability, router, timeParam, t]);

  const isCourtBookedForSelectedTime = (court: Court) => {
    if (!timeParam) return false;
    const formattedTime = timeParam + ':00';
    return court.bookings?.some((booking) =>
      booking.start_time === formattedTime && (booking.status === 'PENDING' || booking.status === 'CHECKED_IN')
    );
  };

  const openBookingConfirmation = (court: Court) => {
    let bookerName = t('unknownBooker');
    const userJson = localStorage.getItem('user');

    if (userJson) {
      try {
        const user = JSON.parse(userJson) as { name?: string; username?: string };
        bookerName = user.name || user.username || bookerName;
      } catch {
        // Keep the safe fallback when locally cached user data is invalid.
      }
    }

    setSelectedBooking({ court, bookerName });
  };

  const handleBook = async () => {
    if (!timeParam || !dateParam || !selectedBooking) {
      toast.error(t('missingParams'));
      return;
    }

    if (!isBookingSlotSelectable(dateParam, timeParam, new Date())) {
      toast.error(t('slotExpired'));
      setSelectedBooking(null);
      router.replace('/booking');
      return;
    }

    setBookingLoading(true);

    try {
      await api.post('/bookings', {
        courtId: selectedBooking.court.id,
        date: dateParam,
        startTime: timeParam + ':00'
      });

      setSelectedBooking(null);
      toast.success(t('bookingSuccess'));

      // Delay redirect slightly so user sees the success state
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: unknown) {
      const rawMessage = isAxiosError<{ message?: string }>(error) ? error.response?.data?.message : undefined;
        const message = bookingErrorMessage(rawMessage, locale);


      toast.error(message);
      
      void loadAvailability(dateParam)
        .then(setCourts)
        .catch(() => toast.error(t('refreshFailed')));
    } finally {
      setBookingLoading(false);
    }
  };

  const availableCourtsCount = timeParam ? courts.filter(c => !isCourtBookedForSelectedTime(c)).length : 0;
  const totalCourts = courts.length;
  const confirmationDetails = selectedBooking && dateParam && timeParam
    ? createBookingConfirmationDetails({
        date: dateParam,
        time: timeParam,
        courtName: selectedBooking.court.name,
        bookerName: selectedBooking.bookerName,
      }, locale)
    : null;

  return (
    <MainLayout width="full">
      <main className="flex flex-col relative w-full pb-6 bg-surface min-h-screen">
        <div className="mx-auto max-w-7xl flex flex-col w-full px-4 md:px-10 gap-4 md:gap-gutter-lg pb-6 mt-8">
          
          {/* Booking Session Context Bar */}
          <div className="flex items-center justify-between bg-surface-container-low rounded-xl px-3 md:px-card-padding py-2 md:py-gutter-sm shadow-sm gap-2">
            <div className="flex items-center gap-2 md:gap-gutter-sm min-w-0 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed flex items-center justify-center text-on-primary-fixed shrink-0">
                <span className="material-symbols-outlined text-[18px]">schedule</span>
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-label-sm text-[10px] md:text-label-sm text-on-surface-variant font-medium truncate">{t('selectedTime')}</span>
                <span className="font-label-lg text-[12px] md:text-label-lg text-on-surface font-bold truncate">{displayDateStr}</span>
              </div>
            </div>
            <button onClick={() => router.push('/booking')} className="flex items-center justify-center gap-1 px-3 py-1.5 md:px-gutter-sm md:py-1 rounded-full bg-surface-container text-primary font-label-md text-[11px] md:text-label-md shrink-0 hover:bg-surface-container-high active:scale-95 transition-all" type="button">
              <span className="material-symbols-outlined text-[16px]">edit_calendar</span>
              <span className="hidden sm:inline">{t('changeTime')}</span>
            </button>
          </div>

          {/* Page Title & Micro Filter */}
          <div className="flex flex-col gap-2 md:gap-gutter-sm">
            <div className="flex items-baseline justify-between gap-2">
              <h1 className="font-headline-md text-lg md:text-headline-md text-on-surface tracking-tight truncate">{t('chooseCourt')}</h1>
              <span className="font-label-sm text-[10px] md:text-label-sm text-secondary font-bold bg-secondary-container/30 px-2 py-0.5 rounded-full shrink-0">{t('availableCourts', availableCourtsCount)}</span>
            </div>
            <p className="font-body-sm text-[11px] md:text-body-sm text-on-surface-variant">{t('totalCourts', totalCourts)}</p>
            
            {/* Filter Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pt-1 pb-1 scrollbar-hide -mx-4 px-4 md:-mx-margin-screen md:px-margin-screen">
              <button className="px-3.5 py-1.5 rounded-full bg-primary-container text-on-primary font-label-md text-[11px] md:text-label-md shadow-sm shrink-0 flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px]">sports_tennis</span>
                <span>{t('hallName', totalCourts)}</span>
              </button>
              <span className="px-3 py-1.5 rounded-full bg-surface-container-high text-on-surface-variant font-label-md text-[11px] md:text-label-md shrink-0 flex items-center gap-1 whitespace-nowrap">
                <span className="material-symbols-outlined text-[14px] text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                <span>{t('studentQuota')}</span>
              </span>
            </div>
          </div>

          {/* Courts List */}
          <div className="grid grid-cols-1 gap-4 md:gap-gutter-md lg:grid-cols-2">
            {loading ? (
              <p className="text-on-surface-variant text-sm py-4 text-center">{t('loading')}</p>
            ) : courts.map((court, index) => {
              const isBooked = isCourtBookedForSelectedTime(court);
              
              // Map mock images based on index
              const courtImages = [
                "https://lh3.googleusercontent.com/aida-public/AB6AXuAhLmI6WJ6HB7dipoImcI-yYTXW-pTMMJPHjtXgcmMe9wvsgU2-xjBg_wPPPeZCcalvIExmqUwlv6AWtgDrqlkpGH8DPejWjmANIiQmtwaymgJpRVaO3ot2_qJogEGlATnn98Hmv03bhA6vOw7yrteDkYf34SM9vknS5WbX2CJ8r_2JoMn0JhvvopneUB7bM-_929oCXGhLhTjC-dgIou98mcCQpG4ZlivUgLhAJIUP09EpoLEd3LcO",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuCBYUbU_WdVKEifnxDG32AtMOD8jd6gHx6Mr9D2k1QDOnaH_dogMdf14FnilKm5690ke0x2zx1RkDRo_4Z4WjXFAsDVTSE7DjEcsIFAld9-ztK5qN3kwQBKdRcJLeJ4BPcJDqPMOS8fEkA7zGhqvGT4uqM5UoBQY4hNXgkXBU6sC8quyjAgOf0h203Z2imr-oKgKWSdTX8xzmHo7Cm4O77i_KyiwBtSDzwaFKXwIjpKA_2fQCwIkYmk",
                "https://lh3.googleusercontent.com/aida-public/AB6AXuBiwfc8uZdNBwBblIxMMsANZ02DSX8Ic11FRNK0cOyWGEcEvkYMXWRQCe8upBmOAT5KVyPFkTEFrR5PQP_lY9ri31KG-s3ESUrr3EZl0sttxG4Xe6ySiyBe6dn4gZXrvf8JJTXVI9fOhz8RrVgyPcjZ9MasMdOQ2mhmCidqg1WuCRVaTol_oom7smnKk2umHISNInxM0IXmo7bPnWMF0hjihD2OXtlZYUy-jLY6oYkm6ot6SaHSM19Q"
              ];
              const imageSrc = court.image || courtImages[index % courtImages.length];

              const locations = [
                "KMITL Sports Hall • Main",
                "KMITL Sports Hall • West",
                t('indoorLocation'),
                t('northLocation')
              ];
              const locationText = court.location || locations[index % locations.length];

              return (
                <div key={court.id} className={`bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm flex flex-col transition-all hover:shadow-md ${isBooked ? 'opacity-60 grayscale-[50%]' : ''}`}>
                  <div className="relative h-36 md:h-44 w-full">
                    <img className="w-full h-full object-cover" src={imageSrc} alt={`${t('courtAlt')} ${court.name}`} />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                    <div className="absolute top-2 left-2 md:top-3 md:left-3 flex gap-1.5 items-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-label-sm text-[9px] md:text-label-sm font-bold shadow-sm backdrop-blur-md ${isBooked ? 'bg-surface-container-high/95 text-on-surface-variant' : 'bg-secondary-container/95 text-on-secondary-container'}`}>
                        {!isBooked && <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span>}
                        {t(isBooked ? 'booked' : 'ready')}
                      </span>
                      <span className="inline-flex items-center px-2 py-1 rounded-full bg-surface-container-lowest/90 text-on-surface-variant font-label-sm text-[9px] md:text-label-sm backdrop-blur-md">
                        {t('indoor')}
                      </span>
                    </div>

                    {/* Admin Change Court Image Button */}
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditCourt(court, imageSrc, locationText);
                        }}
                        className="absolute top-2 right-2 md:top-3 md:right-3 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/75 hover:bg-[#F26522] text-white text-xs font-bold backdrop-blur-md border border-white/20 shadow-lg transition-all active:scale-95 cursor-pointer"
                        title={locale === 'th' ? "เปลี่ยนรูปภาพหรือสถานที่คอร์ท (Admin Only)" : "Edit court photo or location (Admin Only)"}
                      >
                        <span className="material-symbols-outlined text-[15px]">photo_camera</span>
                        <span>{locale === 'th' ? 'เปลี่ยนรูปคอร์ท' : 'Edit Photo'}</span>
                      </button>
                    )}
                    <div className="absolute bottom-2 left-2 right-2 md:bottom-3 md:left-3 md:right-3 flex items-end justify-between text-white">
                                          <div>
                                            <span className="font-label-sm text-[10px] md:text-label-sm text-white/85 block truncate max-w-[180px] drop-shadow-sm">{locationText}</span>
                                            <h2 className="font-headline-sm text-base md:text-headline-sm text-white font-bold drop-shadow-sm truncate">{court.name}</h2>
                                          </div>
                      <div className="bg-secondary-fixed/95 text-on-secondary-fixed px-2 py-0.5 md:px-2.5 md:py-1 rounded-lg font-label-md text-[10px] md:text-label-md font-bold text-center backdrop-blur-sm shadow-sm shrink-0">
                        FREE
                      </div>
                    </div>
                  </div>
                  <div className="p-3 md:p-card-padding flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-surface-container-lowest">
                    <div className="flex flex-col">
                      <span className="font-label-sm text-[11px] md:text-label-sm text-secondary font-semibold flex items-center gap-1">
                        <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                        {t('studentBenefit')}
                      </span>
                      <span className="font-body-sm text-[10px] md:text-body-sm text-on-surface-variant">{t('dailyFree')}</span>
                    </div>
                    <button 
                      disabled={isBooked || bookingLoading || court.status === 'MAINTENANCE'}
                      onClick={() => openBookingConfirmation(court)}
                      className={`court-select-btn w-full sm:w-auto justify-center px-4 py-2.5 rounded-lg font-label-lg text-[13px] md:text-label-lg text-on-primary-container shadow-sm active:scale-95 transition-all shrink-0 flex items-center gap-1.5 ${
                      isBooked
                                              ? 'bg-surface-container-high text-on-surface-variant cursor-not-allowed shadow-none'
                                              : 'bg-primary-container text-on-primary-container hover:bg-primary hover:text-on-primary hover:-translate-y-0.5 hover:shadow-lg duration-200 ease-out'
                                          }`}
                      type="button"
                    >
                      <span>{t(isBooked ? 'unavailable' : 'bookCourt')}</span>
                      {!isBooked && <span className="material-symbols-outlined text-[16px] md:text-[18px]">arrow_forward</span>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Delightful Information Banner & Reminder */}
          <div className="flex items-start gap-3 bg-surface-container-high rounded-xl p-3 md:p-card-padding mt-1">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0 mt-0.5">
              <span className="material-symbols-outlined text-[18px]">notifications_active</span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="font-label-md text-[11px] md:text-label-md text-on-surface font-bold">{t('reminder')}</span>
              <p className="font-body-sm text-[10px] md:text-body-sm text-on-surface-variant">
                {t('reminderBody')} <span className="font-semibold text-primary">{t('reminderMinutes')}</span> {t('reminderTail')}
              </p>
            </div>
          </div>

        </div>
      </main>

      <Dialog
        open={selectedBooking !== null}
        onOpenChange={(open) => {
          if (!open && !bookingLoading) setSelectedBooking(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t('confirmTitle')}</DialogTitle>
            <DialogDescription>
              {t('confirmDescription')}
            </DialogDescription>
          </DialogHeader>

          {confirmationDetails && (
            <div className="flex flex-col gap-4">
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 rounded-xl bg-surface-container-low p-4 text-sm">
                <dt className="text-on-surface-variant">{t('dateLabel')}</dt>
                <dd className="font-semibold text-on-surface">{confirmationDetails.date}</dd>
                <dt className="text-on-surface-variant">{t('monthLabel')}</dt>
                <dd className="font-semibold text-on-surface">{confirmationDetails.month}</dd>
                <dt className="text-on-surface-variant">{t('courtLabel')}</dt>
                <dd className="font-semibold text-on-surface">{confirmationDetails.court}</dd>
                <dt className="text-on-surface-variant">{t('timeLabel')}</dt>
                <dd className="font-semibold text-on-surface">{confirmationDetails.time}</dd>
                <dt className="text-on-surface-variant">{t('booker')}</dt>
                <dd className="font-semibold text-on-surface">{confirmationDetails.booker}</dd>
              </dl>
              <div className="bg-error-container/30 border border-error/20 p-3 rounded-xl text-sm">
                <h4 className="font-bold text-error flex items-center gap-1.5 mb-1.5">
                  <span className="material-symbols-outlined text-[16px]">gavel</span>
                  {t('importantRules')}
                </h4>
                <ul className="list-disc pl-4 space-y-1 text-on-surface-variant text-[12px] md:text-sm">
                  <li>{t('ruleCheckIn')}</li>
                  <li>{t('ruleNoShow')}</li>
                  <li>{t('ruleShoes')}</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={bookingLoading}
              onClick={() => setSelectedBooking(null)}
              className="rounded-xl px-4 py-2 font-medium hover:bg-surface-container"
            >
              {t('backToChoose')}
            </Button>
            <Button
              type="button"
              disabled={bookingLoading}
              onClick={handleBook}
              className="rounded-xl bg-gradient-to-r from-[#F26522] to-[#E05310] hover:from-[#E05310] hover:to-[#C94709] text-white font-bold text-sm px-5 py-2.5 shadow-[0_4px_16px_rgba(242,101,34,0.35)] dark:shadow-[0_4px_20px_rgba(242,101,34,0.5)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-0 hover:text-white"
            >
              {bookingLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span className="text-white font-bold">{t('booking')}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px] text-white">check_circle</span>
                  <span className="text-white font-bold drop-shadow-sm">{t('confirmBooking')}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Admin Court Edit Modal */}
      <Dialog open={editingCourt !== null} onOpenChange={(open) => !open && setEditingCourt(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#F26522]">photo_camera</span>
              {locale === 'th' ? `แก้ไขรูปภาพ ${editingCourt?.name}` : `Edit Photo: ${editingCourt?.name}`}
            </DialogTitle>
            <DialogDescription>
              {locale === 'th' ? 'สามารถใส่ URL รูปภาพ หรือ อัปโหลดรูปภาพใหม่จากเครื่องของคุณ (Admin Only)' : 'Enter an image URL or upload a new photo from your device (Admin Only)'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col gap-4 py-2">
            {/* Live Image Preview */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-on-surface-variant">
                {locale === 'th' ? 'ตัวอย่างรูปภาพ' : 'Image Preview'}
              </label>
              <div className="relative h-44 w-full rounded-2xl overflow-hidden bg-black/10 border border-outline-variant/40">
                {editCourtImage ? (
                  <img src={editCourtImage} alt="Court Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-on-surface-variant text-xs gap-1">
                    <span className="material-symbols-outlined text-3xl opacity-40">image_not_supported</span>
                    <span>{locale === 'th' ? 'ไม่มีรูปภาพ' : 'No image available'}</span>
                  </div>
                )}
              </div>
            </div>

            {/* File Upload Input & Trigger */}
            <input
              type="file"
              accept="image/*"
              ref={courtFileRef}
              className="hidden"
              onChange={handleCourtFileUpload}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => courtFileRef.current?.click()}
                className="flex-1 py-2 px-3 rounded-xl border border-dashed border-[#F26522] text-[#F26522] hover:bg-[#F26522]/5 text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">upload_file</span>
                {locale === 'th' ? 'เลือกไฟล์รูปจากเครื่อง (Max 5MB)' : 'Select image file (Max 5MB)'}
              </button>
            </div>

            {/* Direct Image URL Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant">
                {locale === 'th' ? 'หรือกรอก Image URL' : 'Or enter Image URL'}
              </label>
              <input
                type="text"
                value={editCourtImage}
                onChange={(e) => setEditCourtImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>

            {/* Location / Zone Input */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold text-on-surface-variant">
                {locale === 'th' ? 'สถานที่ / โซน (Location)' : 'Location / Zone'}
              </label>
              <input
                type="text"
                value={editCourtLocation}
                onChange={(e) => setEditCourtLocation(e.target.value)}
                placeholder={locale === 'th' ? 'เช่น KMITL Sports Hall • Main' : 'e.g. KMITL Sports Hall • Main'}
                className="w-full px-3 py-2 text-xs rounded-xl border border-outline-variant bg-surface-container-low text-on-surface focus:outline-none focus:ring-2 focus:ring-[#F26522]"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={updatingCourt}
              onClick={() => setEditingCourt(null)}
              className="rounded-xl px-4 py-2 font-medium hover:bg-surface-container"
            >
              {locale === 'th' ? 'ยกเลิก' : 'Cancel'}
            </Button>
            <Button
              type="button"
              disabled={updatingCourt}
              onClick={handleSaveCourt}
              className="rounded-xl bg-gradient-to-r from-[#F26522] to-[#E05310] hover:from-[#E05310] hover:to-[#C94709] text-white font-bold text-sm px-5 py-2.5 shadow-[0_4px_16px_rgba(242,101,34,0.35)] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 border-0 hover:text-white"
            >
              {updatingCourt ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  <span>{locale === 'th' ? 'กำลังบันทึก...' : 'Saving...'}</span>
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">save</span>
                  <span>{locale === 'th' ? 'บันทึกรูปภาพคอร์ท' : 'Save Court Details'}</span>
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}

export default function SelectCourtPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <SelectCourtContent />
    </Suspense>
  );
}
