import api from './api';

export interface WelcomeNewsItem {
  id: string;
  tag: string;
  date: string;
  title: string;
  body: string;
  category: string;
  image?: string;
}

export interface WelcomeServiceItem {
  id: string;
  icon: string;
  title: string;
  body: string;
}

export interface WelcomeGuideItem {
  step: number;
  icon: string;
  title: string;
  body: string;
}

export interface WelcomeTipItem {
  id: string;
  date: string;
  title: string;
  body: string;
  category: string;
  image?: string;
}

export interface WelcomeRuleItem {
  id: string;
  title: string;
  icon: string;
  items: string[];
}

export interface WelcomeContentData {
  hero: {
    headline: string;
    subtitle: string;
    ctaText: string;
    images: string[];
  };
  services: WelcomeServiceItem[];
  news: WelcomeNewsItem[];
  guide: WelcomeGuideItem[];
  tips: WelcomeTipItem[];
  rules: WelcomeRuleItem[];
}

export const DEFAULT_WELCOME_DATA: WelcomeContentData = {
  hero: {
    headline: 'จองคอร์ทสำหรับประสบการณ์ที่สุดยอด KMITL PCC BADMINTON',
    subtitle: 'ระบบจองสนามแบดมินตันแบบวันต่อวันสำหรับนักศึกษาและบุคลากร KMITL เล่นเต็มที่ เล่นอย่างมีน้ำใจ',
    ctaText: 'เริ่มใช้งาน',
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
      body: 'เปิดให้จองสนามแบดมินตัน 4 คอร์ตแบบวันต่อวัน (Day-by-day) เวลา 08:00–23:00 น. จำกัด 1 บัญชีต่อ 1 ชั่วโมงต่อวัน เพื่อการกระจายสิทธิ์อย่างทั่วถึง'
    },
    {
      id: 'service-membership',
      icon: 'card_membership',
      title: 'เชื่อมต่อบัญชีนักศึกษา KMITL',
      body: 'เข้าสู่ระบบด้วยรหัสนักศึกษา พร้อมระบบตรวจสอบโควตาประจำวัน และระบบติดตามแต้มการผิดระเบียบ (Strikes) อย่างโปร่งใส'
    },
    {
      id: 'service-checkin',
      icon: 'qr_code_scanner',
      title: 'เช็กอินอัจฉริยะผ่าน QR Code',
      body: 'ยืนยันตัวตนก่อนลงเล่นด้วยการสแกน QR Code หน้าคอร์ต เปิดให้เช็กอินล่วงหน้าได้ 15 นาที และมีเวลาเช็กอินภายใน 15 นาทีแรก'
    }
  ],
  news: [
    {
      id: 'news-1',
      tag: 'ประกาศสำคัญ',
      date: '2026/10/10',
      title: 'เปิดให้บริการสนามแบดมินตัน 4 คอร์ต เวลา 08:00 - 23:00 น.',
      body: 'ศูนย์กีฬา KMITL เปิดให้บริการสนามแบดมินตันเต็มรูปแบบ 4 คอร์ต ระบบรองรับการจองแบบวันต่อวัน (Day-by-day) จำกัดสิทธิ์ 1 ครั้งต่อวัน ครั้งละ 1 ชั่วโมง เพื่อให้นักศึกษาทุกคนเข้าถึงได้อย่างเป็นธรรม',
      category: 'การจองสนาม',
      image: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=1200&q=80'
    },
    {
      id: 'news-2',
      tag: 'ระเบียบการ',
      date: '2026/10/08',
      title: 'ชี้แจงระบบนับแต้มความผิด (Strikes) และการระงับสิทธิ์ 24 ชั่วโมง',
      body: 'หากผู้จองไม่มาเช็กอินภายใน 15 นาทีแรก หรือยกเลิกการจองล่าช้า ระบบจะตัดสิทธิ์และบันทึกความผิด 1 ครั้ง (+1 Strike) หากสะสมครบ 2 ครั้ง บัญชีจะถูกระงับสิทธิ์การจองเป็นเวลา 24 ชั่วโมง โดยระบบจะปลดแบนให้อัตโนมัติ',
      category: 'ระเบียบการใช้งาน',
      image: 'https://images.unsplash.com/photo-1521537634581-0dced2fee2ef?w=1200&q=80'
    }
  ],
  guide: [
    {
      step: 1,
      icon: 'login',
      title: 'เข้าสู่ระบบ / สมัครสมาชิก',
      body: 'เข้าสู่ระบบด้วยรหัสนักศึกษา หรือลงทะเบียนด้วยอีเมลสถาบันเพื่อรับสิทธิ์โควตาการจองประจำวัน'
    },
    {
      step: 2,
      icon: 'event_seat',
      title: 'เลือกสนามและช่วงเวลา',
      body: 'เลือกช่วงเวลาที่ต้องการเล่น (08:00 - 23:00 น.) และเลือกสนาม 1-4 โดยระบบเปิดให้จองเฉพาะวันปัจจุบันเท่านั้น'
    },
    {
      step: 3,
      icon: 'check_circle',
      title: 'ยืนยันการจอง',
      body: 'ตรวจสอบสนามและเวลา ระบบจะตัดโควตาประจำวันของคุณ (1 ครั้ง/วัน) และแสดงสถานะ “รอเช็กอิน” ในแดชบอร์ด'
    },
    {
      step: 4,
      icon: 'qr_code_scanner',
      title: 'สแกน QR Code เช็กอิน',
      body: 'เดินทางมาถึงสนามล่วงหน้า 15 นาที เปิดเว็บแล้วกดปุ่ม “สแกนเช็กอิน” สแกน QR ประจำคอร์ตภายใน 15 นาทีแรกเพื่อเริ่มเล่น'
    }
  ],
  tips: [
    {
      id: 'tip-1',
      date: '2026/10/05',
      title: 'วอร์มอัพข้อต่อและยืดเหยียด 10 นาทีก่อนลงสนาม',
      body: 'การวอร์มอัพเน้นข้อเท้า เข่า และหัวไหล่ ช่วยเพิ่มความคล่องตัวและลดความเสี่ยงต่อการบาดเจ็บจากการเปลี่ยนทิศทางอย่างรวดเร็ว',
      category: 'สุขภาพและความปลอดภัย',
      image: 'https://images.unsplash.com/photo-1518659728514-6d9b0efdc3e0?w=1200&q=80'
    },
    {
      id: 'tip-2',
      date: '2026/10/01',
      title: 'วิธีรักษาสิทธิ์โควตาและหลีกเลี่ยงแต้ม Strikes',
      body: 'หากติดธุระด่วน ให้กดยกเลิกการจองภายใน 15 นาทีแรก ระบบจะคืนโควตาประจำวันให้ทันทีเพื่อนำไปจองรอบอื่น และไม่ถูกบันทึกแต้มความผิด',
      category: 'เทคนิคการใช้งาน',
      image: 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=1200&q=80'
    }
  ],
  rules: [
    {
      id: 'rule-booking',
      title: 'สิทธิ์และระยะเวลาการจอง',
      icon: 'schedule',
      items: [
        'จำกัดการจอง: บัญชีผู้ใช้แต่ละบัญชีจองได้สูงสุดวันละ 1 ครั้ง ครั้งละ 1 ชั่วโมง (รีเซ็ตโควตาทุกเที่ยงคืน)',
        'นโยบายการจอง: เปิดให้จองแบบวันต่อวัน (เฉพาะวันปัจจุบันเท่านั้น) ตั้งแต่เวลา 08:00 ถึง 23:00 น. ทั้งหมด 4 คอร์ต'
      ]
    },
    {
      id: 'rule-access',
      title: 'การเข้าใช้และเช็กอิน',
      icon: 'how_to_reg',
      items: [
        'การเช็กอิน: สแกน QR Code ประจำคอร์ตเพื่อยืนยันตัวตน เปิดให้เช็กอินล่วงหน้าได้ 15 นาที ก่อนเริ่มรอบ',
        'เวลาเช็กอิน: ต้องเช็กอินภายใน 15 นาทีแรกหลังเวลาเริ่ม หากเกิน 15 นาที ระบบจะตัดรอบอัตโนมัติ (No-Show)'
      ]
    },
    {
      id: 'rule-penalties',
      title: 'การยกเลิกและบทลงโทษ (Strikes & Ban)',
      icon: 'cancel',
      items: [
        'การยกเลิก: หากยกเลิกภายใน 15 นาทีแรก จะได้รับโควตาคืน (0 ครั้ง) หากยกเลิกช้าจะไม่ได้รับโควตาคืน',
        'บทลงโทษ: ไม่มาเช็กอิน (No-show) หรือยกเลิกช้า บันทึกความผิด 1 ครั้ง ครบ 2 ครั้งระงับสิทธิ์การจอง 24 ชั่วโมง (ปลดแบนอัตโนมัติ)'
      ]
    },
    {
      id: 'rule-court',
      title: 'ข้อกำหนดการใช้สนาม',
      icon: 'sports_score',
      items: [
        'รองเท้าและเครื่องแต่งกาย: ต้องสวมรองเท้ากีฬาแบดมินตันพื้น Non-marking เท่านั้น เพื่อรักษาสภาพพื้นคอร์ต',
        'มารยาทและการดูแล: ห้ามนำอาหารหรือเครื่องดื่มที่มีน้ำหวานเข้าพื้นที่สนาม และรักษาความสะอาดหลังใช้งาน'
      ]
    }
  ]
};

const STORAGE_KEY = 'kmitl_welcome_content';

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
