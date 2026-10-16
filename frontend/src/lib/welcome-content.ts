import api from './api';

export interface WelcomeNewsItem {
  id: string;
  tag: string;
  tag_en?: string;
  date: string;
  title: string;
  title_en?: string;
  body: string;
  body_en?: string;
  category: string;
  category_en?: string;
  image?: string;
}

export interface WelcomeServiceItem {
  id: string;
  icon: string;
  title: string;
  title_en?: string;
  body: string;
  body_en?: string;
}

export interface WelcomeGuideItem {
  step: number;
  icon: string;
  title: string;
  title_en?: string;
  body: string;
  body_en?: string;
}

export interface WelcomeTipItem {
  id: string;
  date: string;
  title: string;
  title_en?: string;
  body: string;
  body_en?: string;
  category: string;
  category_en?: string;
  image?: string;
}

export interface WelcomeRuleItem {
  id: string;
  title: string;
  title_en?: string;
  icon: string;
  items: string[];
  items_en?: string[];
}

export interface WelcomeHeroData {
  headline: string;
  headline_en?: string;
  subtitle: string;
  subtitle_en?: string;
  ctaText: string;
  ctaText_en?: string;
  images: string[];
}

export interface WelcomeContentData {
  hero: WelcomeHeroData;
  services: WelcomeServiceItem[];
  news: WelcomeNewsItem[];
  guide: WelcomeGuideItem[];
  tips: WelcomeTipItem[];
  rules: WelcomeRuleItem[];
}

export const DEFAULT_WELCOME_DATA: WelcomeContentData = {
  hero: {
    headline: 'จองคอร์ทสำหรับประสบการณ์ที่สุดยอด KMITL PCC BADMINTON',
    headline_en: 'Book a court for an ultimate experience KMITL PCC BADMINTON',
    subtitle: 'ระบบจองสนามแบดมินตันแบบวันต่อวันสำหรับนักศึกษาและบุคลากร KMITL เล่นเต็มที่ เล่นอย่างมีน้ำใจ',
    subtitle_en: 'Day-by-day badminton court booking system for KMITL students and staff. Play hard, play fair.',
    ctaText: 'เริ่มใช้งาน',
    ctaText_en: 'Get Started',
    images: [
      'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1920&q=80',
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg/960px-Lee_Chong_Wei_in_the_2012_Summer_Olympics_%283to4_portrait%29.jpg',
      'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYUOMPRdYqlaU4UWU1XQ2jM99-UN3JLKVkoCYYNpLEZm0LMIH_WRkeaO8&s=10'
    ]
  },
  services: [
    {
      id: 'service-booking',
      icon: 'event_available',
      title: 'ระบบจองสนามมาตรฐาน',
      title_en: 'Standard Court Booking System',
      body: 'เปิดให้จองสนามแบดมินตัน 4 คอร์ตแบบวันต่อวัน (Day-by-day) เวลา 08:00–23:00 น. จำกัด 1 บัญชีต่อ 1 ชั่วโมงต่อวัน เพื่อการกระจายสิทธิ์อย่างทั่วถึง',
      body_en: '4 badminton courts available on a day-by-day basis from 08:00 to 23:00. Limited to 1 hour per account per day for fair access across the campus.'
    },
    {
      id: 'service-membership',
      icon: 'card_membership',
      title: 'เชื่อมต่อบัญชีนักศึกษา KMITL',
      title_en: 'KMITL Student ID Integration',
      body: 'เข้าสู่ระบบด้วยรหัสนักศึกษา พร้อมระบบตรวจสอบโควตาประจำวัน และระบบติดตามแต้มการผิดระเบียบ (Strikes) อย่างโปร่งใส',
      body_en: 'Sign in with your KMITL student ID with real-time daily quota verification and transparent strike violation tracking.'
    },
    {
      id: 'service-checkin',
      icon: 'qr_code_scanner',
      title: 'เช็กอินอัจฉริยะผ่าน QR Code',
      title_en: 'Smart QR Code Check-In',
      body: 'ยืนยันตัวตนก่อนลงเล่นด้วยการสแกน QR Code หน้าคอร์ต เปิดให้เช็กอินล่วงหน้าได้ 15 นาที และมีเวลาเช็กอินภายใน 15 นาทีแรก',
      body_en: 'Verify your match by scanning the court QR code upon arrival. Check-in opens 15 minutes before your slot and lasts through the first 15 minutes.'
    }
  ],
  news: [
    {
      id: 'news-1',
      tag: 'ประกาศสำคัญ',
      tag_en: 'Important',
      date: '2026/10/10',
      title: 'เปิดให้บริการสนามแบดมินตัน 4 คอร์ต เวลา 08:00 - 23:00 น.',
      title_en: '4 Badminton Courts Now Open Daily from 08:00 to 23:00',
      body: 'ศูนย์กีฬา KMITL เปิดให้บริการสนามแบดมินตันเต็มรูปแบบ 4 คอร์ต ระบบรองรับการจองแบบวันต่อวัน (Day-by-day) จำกัดสิทธิ์ 1 ครั้งต่อวัน ครั้งละ 1 ชั่วโมง เพื่อให้นักศึกษาทุกคนเข้าถึงได้อย่างเป็นธรรม',
      body_en: 'KMITL Sports Complex is fully operating 4 badminton courts. Day-by-day booking system permits 1 session per day (1 hour) to ensure fair access for all students.',
      category: 'การจองสนาม',
      category_en: 'Court Booking',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80'
    },
    {
      id: 'news-2',
      tag: 'ระเบียบการ',
      tag_en: 'Regulations',
      date: '2026/10/08',
      title: 'ชี้แจงระบบนับแต้มความผิด (Strikes) และการระงับสิทธิ์ 24 ชั่วโมง',
      title_en: 'Clarification on Strikes Tracking and 24-Hour Booking Suspension',
      body: 'หากผู้จองไม่มาเช็กอินภายใน 15 นาทีแรก หรือยกเลิกการจองล่าช้า ระบบจะตัดสิทธิ์และบันทึกความผิด 1 ครั้ง (+1 Strike) หากสะสมครบ 2 ครั้ง บัญชีจะถูกระงับสิทธิ์การจองเป็นเวลา 24 ชั่วโมง โดยระบบจะปลดแบนให้อัตโนมัติ',
      body_en: 'Failure to check in within the first 15 minutes or late cancellation results in 1 strike. Reaching 2 strikes leads to an automatic 24-hour booking suspension.',
      category: 'ระเบียบการใช้งาน',
      category_en: 'Usage Rules',
      image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&q=80'
    }
  ],
  guide: [
    {
      step: 1,
      icon: 'login',
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      title_en: 'Sign In / Register',
      body: 'เข้าสู่ระบบด้วยรหัสนักศึกษา หรือลงทะเบียนด้วยอีเมลสถาบันเพื่อรับสิทธิ์โควตาการจองประจำวัน',
      body_en: 'Log in with your KMITL student ID or register with your institutional email to claim your daily booking quota.'
    },
    {
      step: 2,
      icon: 'event_seat',
      title: 'เลือกสนามและช่วงเวลา',
      title_en: 'Select Court & Slot',
      body: 'เลือกช่วงเวลาที่ต้องการเล่น (08:00 - 23:00 น.) และเลือกสนาม 1-4 โดยระบบเปิดให้จองเฉพาะวันปัจจุบันเท่านั้น',
      body_en: 'Choose your desired play time (08:00 - 23:00) and pick Court 1-4. Bookings are available for the current day only.'
    },
    {
      step: 3,
      icon: 'check_circle',
      title: 'ยืนยันการจอง',
      title_en: 'Confirm Booking',
      body: 'ตรวจสอบสนามและเวลา ระบบจะตัดโควตาประจำวันของคุณ (1 ครั้ง/วัน) และแสดงสถานะ “รอเช็กอิน” ในแดชบอร์ด',
      body_en: 'Verify court details and time. The system deducts your daily quota (1 per day) and sets the status to "Awaiting Check-in".'
    },
    {
      step: 4,
      icon: 'qr_code_scanner',
      title: 'สแกน QR Code เช็กอิน',
      title_en: 'Scan QR Code to Check In',
      body: 'เดินทางมาถึงสนามล่วงหน้า 15 นาที เปิดเว็บแล้วกดปุ่ม “สแกนเช็กอิน” สแกน QR ประจำคอร์ตภายใน 15 นาทีแรกเพื่อเริ่มเล่น',
      body_en: 'Arrive at the court 15 minutes early, tap "Check In", and scan the physical court QR code within the first 15 minutes to begin.'
    }
  ],
  tips: [
    {
      id: 'tip-1',
      date: '2026/10/05',
      title: 'วอร์มอัพข้อต่อและยืดเหยียด 10 นาทีก่อนลงสนาม',
      title_en: '10-Minute Joint Warm-up and Stretching Before Playing',
      body: 'การวอร์มอัพเน้นข้อเท้า เข่า และหัวไหล่ ช่วยเพิ่มความคล่องตัวและลดความเสี่ยงต่อการบาดเจ็บจากการเปลี่ยนทิศทางอย่างรวดเร็ว',
      body_en: 'Focus on ankles, knees, and shoulders to boost agility and prevent sudden directional change injuries during rapid rallies.',
      category: 'สุขภาพและความปลอดภัย',
      category_en: 'Health & Safety',
      image: 'https://images.unsplash.com/photo-1518659728514-6d9b0efdc3e0?w=1200&q=80'
    },
    {
      id: 'tip-2',
      date: '2026/10/01',
      title: 'วิธีรักษาสิทธิ์โควตาและหลีกเลี่ยงแต้ม Strikes',
      title_en: 'Preserving Your Daily Quota and Avoiding Penalty Strikes',
      body: 'หากติดธุระด่วน ให้กดยกเลิกการจองภายใน 15 นาทีแรก ระบบจะคืนโควตาประจำวันให้ทันทีเพื่อนำไปจองรอบอื่น และไม่ถูกบันทึกแต้มความผิด',
      body_en: 'If you have an urgent conflict, cancel within the first 15 minutes of the slot. Your quota is immediately refunded without any strike penalty.',
      category: 'เทคนิคการใช้งาน',
      category_en: 'Usage Tips',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80'
    }
  ],
  rules: [
    {
      id: 'rule-booking',
      title: 'สิทธิ์และระยะเวลาการจอง',
      title_en: 'Booking Privileges & Scheduling',
      icon: 'schedule',
      items: [
        'จำกัดการจอง: บัญชีผู้ใช้แต่ละบัญชีจองได้สูงสุดวันละ 1 ครั้ง ครั้งละ 1 ชั่วโมง (รีเซ็ตโควตาทุกเที่ยงคืน)',
        'นโยบายการจอง: เปิดให้จองแบบวันต่อวัน (เฉพาะวันปัจจุบันเท่านั้น) ตั้งแต่เวลา 08:00 ถึง 23:00 น. ทั้งหมด 4 คอร์ต'
      ],
      items_en: [
        'Booking Limit: Each user account can book at most 1 session per day, 1 hour per session (quotas reset every midnight).',
        'Booking Policy: Day-by-day basis (same-day booking only) from 08:00 to 23:00 across all 4 badminton courts.'
      ]
    },
    {
      id: 'rule-access',
      title: 'การเข้าใช้และเช็กอิน',
      title_en: 'Check-In & Court Access',
      icon: 'how_to_reg',
      items: [
        'การเช็กอิน: สแกน QR Code ประจำคอร์ตเพื่อยืนยันตัวตน เปิดให้เช็กอินล่วงหน้าได้ 15 นาที ก่อนเริ่มรอบ',
        'เวลาเช็กอิน: ต้องเช็กอินภายใน 15 นาทีแรกหลังเวลาเริ่ม หากเกิน 15 นาที ระบบจะตัดรอบอัตโนมัติ (No-Show)'
      ],
      items_en: [
        'Check-In: Scan the physical court QR code to verify. Check-in opens 15 minutes prior to session start.',
        'Check-In Window: Must check in within the first 15 minutes. After 15 minutes, system auto-cancels as No-Show.'
      ]
    },
    {
      id: 'rule-penalties',
      title: 'การยกเลิกและบทลงโทษ (Strikes & Ban)',
      title_en: 'Cancellations & Penalty Strikes',
      icon: 'cancel',
      items: [
        'การยกเลิก: หากยกเลิกภายใน 15 นาทีแรก จะได้รับโควตาคืน (0 ครั้ง) หากยกเลิกช้าจะไม่ได้รับโควตาคืน',
        'บทลงโทษ: ไม่มาเช็กอิน (No-show) หรือยกเลิกช้า บันทึกความผิด 1 ครั้ง ครบ 2 ครั้งระงับสิทธิ์การจอง 24 ชั่วโมง (ปลดแบนอัตโนมัติ)'
      ],
      items_en: [
        'Cancellations: Cancelling within the first 15 minutes refunds your quota with 0 strikes. Late cancellation forfeits quota.',
        'Penalties: No-shows or late cancellations incur 1 strike. Reaching 2 strikes triggers a 24-hour booking suspension (auto-unbanned).'
      ]
    },
    {
      id: 'rule-court',
      title: 'ข้อกำหนดการใช้สนาม',
      title_en: 'Court Rules & Etiquette',
      icon: 'sports_score',
      items: [
        'รองเท้าและเครื่องแต่งกาย: ต้องสวมรองเท้ากีฬาแบดมินตันพื้น Non-marking เท่านั้น เพื่อรักษาสภาพพื้นคอร์ต',
        'มารยาทและการดูแล: ห้ามนำอาหารหรือเครื่องดื่มที่มีน้ำหวานเข้าพื้นที่สนาม และรักษาความสะอาดหลังใช้งาน'
      ],
      items_en: [
        'Footwear: Non-marking badminton court shoes are strictly required to preserve court flooring.',
        'Etiquette: No food or sugary drinks on court surface. Clean up and dispose of rubbish after play.'
      ]
    }
  ]
};

const STORAGE_KEY = 'kmitl_welcome_content';

/**
 * Returns localized text according to the user's active locale.
 * If English is selected and an English translation is present, it will be returned;
 * otherwise it gracefully falls back to the Thai (or base) text.
 */
export function getLocalizedText(th?: string, en?: string, locale: string = 'th'): string {
  if (locale === 'en') {
    return (en && en.trim()) ? en : (th || '');
  }
  return (th && th.trim()) ? th : (en || '');
}

/**
 * Translates text via the backend AI / Google translation service,
 * with graceful client-side fallback if the network or backend is unreachable.
 */
export async function translateText(text: string, source = 'th', target = 'en'): Promise<string> {
  if (!text || !text.trim()) return '';

  // 1. Try backend authenticated endpoint
  try {
    const res = await api.post('/welcome/translate', { text, source, target });
    if (res.data && res.data.translation) {
      return res.data.translation;
    }
  } catch (e) {
    console.warn('Backend translation failed, attempting direct fetch fallback', e);
  }

  // 2. Direct client-side fetch fallback
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(source)}&tl=${encodeURIComponent(target)}&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as any;
      if (Array.isArray(data) && Array.isArray(data[0])) {
        return data[0].map((chunk: any) => chunk[0]).join('');
      }
    }
  } catch (e) {
    console.error('Direct translation fallback failed', e);
  }

  return text;
}

/**
 * Batch translation helper to translate multiple strings simultaneously.
 */
export async function translateBatch(texts: string[], source = 'th', target = 'en'): Promise<string[]> {
  if (!texts || !Array.isArray(texts)) return [];
  try {
    const res = await api.post('/welcome/translate', { texts, source, target });
    if (res.data && Array.isArray(res.data.translations)) {
      return res.data.translations;
    }
  } catch (e) {
    console.warn('Backend batch translation failed, falling back to sequential', e);
  }
  return Promise.all(texts.map((t) => translateText(t, source, target)));
}

export async function fetchWelcomeContent(): Promise<WelcomeContentData> {
  // Always query backend database first so changes reflect for all users in real time
  try {
    const response = await api.get('/welcome');
    if (response.data && response.data.hero) {
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(response.data));
      }
      return response.data;
    }
  } catch (error) {
    console.warn('Welcome API call failed, attempting offline cache fallback', error);
  }

  // Fallback to local storage if network is down or offline
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem(STORAGE_KEY);
    if (local) {
      try {
        const parsed = JSON.parse(local);
        if (parsed && parsed.hero && parsed.news) {
          return parsed;
        }
      } catch (e) {
        console.warn('Failed to parse local welcome data', e);
      }
    }
  }

  return DEFAULT_WELCOME_DATA;
}

export async function saveWelcomeContent(data: WelcomeContentData): Promise<WelcomeContentData> {
  // Save directly to backend database via PUT /welcome
  const response = await api.put('/welcome', data);
  const savedData = response.data || data;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(savedData));
    window.dispatchEvent(new CustomEvent('welcome_content_updated', { detail: savedData }));
  }

  return savedData;
}

export async function resetWelcomeContent(): Promise<WelcomeContentData> {
  // Reset in backend database via POST /welcome/reset
  const response = await api.post('/welcome/reset');
  const resetData = response.data || DEFAULT_WELCOME_DATA;

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(resetData));
    window.dispatchEvent(new CustomEvent('welcome_content_updated', { detail: resetData }));
  }

  return resetData;
}
