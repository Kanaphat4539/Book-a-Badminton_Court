'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  fetchWelcomeContent,
  saveWelcomeContent,
  resetWelcomeContent,
  translateText,
  translateBatch,
  type WelcomeContentData,
  type WelcomeNewsItem,
  type WelcomeTipItem,
  DEFAULT_WELCOME_DATA
} from '@/lib/welcome-content';
import {
  Sparkles,
  Save,
  RotateCcw,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Upload,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Layers,
  Newspaper,
  BookOpen,
  Lightbulb,
  ShieldAlert,
  Info,
  LayoutGrid,
  Languages,
  Loader2,
  Globe
} from 'lucide-react';

export default function EditWelcomeDashboard() {
  const router = useRouter();
  const [data, setData] = useState<WelcomeContentData>(DEFAULT_WELCOME_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'news' | 'services' | 'guide' | 'tips' | 'rules' | 'courts'>('news');

  // Active editing language per section
  const [heroLang, setHeroLang] = useState<'th' | 'en'>('th');
  const [servicesLang, setServicesLang] = useState<'th' | 'en'>('th');
  const [guideLang, setGuideLang] = useState<'th' | 'en'>('th');
  const [tipsLang, setTipsLang] = useState<'th' | 'en'>('th');
  const [rulesLang, setRulesLang] = useState<'th' | 'en'>('th');

  // Translation busy states
  const [translatingAll, setTranslatingAll] = useState(false);
  const [translatingSection, setTranslatingSection] = useState<string | null>(null);

  // Courts state
  const [courtsList, setCourtsList] = useState<any[]>([]);
  const [savingCourtId, setSavingCourtId] = useState<number | null>(null);

  // News form state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsModalLang, setNewsModalLang] = useState<'th' | 'en'>('th');
  const [translatingNews, setTranslatingNews] = useState(false);
  const [newsForm, setNewsForm] = useState<WelcomeNewsItem>({
    id: '',
    tag: 'ประกาศสำคัญ',
    tag_en: 'Important',
    date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()).replace(/-/g, '/'),
    title: '',
    title_en: '',
    body: '',
    body_en: '',
    category: 'การจองสนาม',
    category_en: 'Court Booking',
    image: ''
  });
  const [showNewsModal, setShowNewsModal] = useState(false);

  // New slide image state
  const [newSlideUrl, setNewSlideUrl] = useState('');
  const slideFileRef = useRef<HTMLInputElement>(null);
  const newsFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (!token || !userStr) {
      router.push('/login');
      return;
    }
    try {
      const user = JSON.parse(userStr);
      if (user.role !== 'ADMIN') {
        toast.error('สิทธิ์การเข้าถึงเฉพาะผู้ดูแลระบบ (Admin Only)');
        router.push('/dashboard');
        return;
      }
    } catch {
      router.push('/login');
      return;
    }

    fetchWelcomeContent().then((loaded) => {
      setData(loaded);
      setLoading(false);
    });

    api.get('/courts').then((res) => {
      if (res.data) setCourtsList(res.data);
    }).catch(() => {});
  }, [router]);

  const handleCourtFileInDashboard = (courtId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('ขนาดไฟล์รูปภาพไม่ควรเกิน 5MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCourtsList((prev) =>
          prev.map((c) => (c.id === courtId ? { ...c, image: reader.result } : c))
        );
        toast.success('โหลดรูปภาพเรียบร้อยแล้ว กด "บันทึกคอร์ท" เพื่อยืนยัน');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveCourtInDashboard = async (court: any) => {
    setSavingCourtId(court.id);
    try {
      await api.patch(`/courts/${court.id}`, {
        image: court.image,
        location: court.location,
        name: court.name,
      });
      toast.success(`บันทึกรูปภาพและข้อมูล ${court.name} เรียบร้อยแล้ว!`);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'ไม่สามารถบันทึกข้อมูลคอร์ทได้');
    } finally {
      setSavingCourtId(null);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await saveWelcomeContent(data);
      setData(saved);
      toast.success('บันทึกการเปลี่ยนแปลงลงฐานข้อมูลจริงเรียบร้อยแล้ว!');
    } catch (e: any) {
      console.error('Save failed:', e);
      const msg = e?.response?.data?.message || e?.message || 'เกิดข้อผิดพลาดในการบันทึกข้อมูล';
      toast.error(`เกิดข้อผิดพลาดในการบันทึก: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('ยืนยันรีเซ็ตเนื้อหาหน้าแรกทั้งหมดกลับเป็นค่าเริ่มต้นของระบบ?')) return;
    setSaving(true);
    try {
      const resetData = await resetWelcomeContent();
      setData(resetData);
      toast.success('รีเซ็ตเนื้อหาในฐานข้อมูลกลับเป็นค่าเริ่มต้นแล้ว');
    } catch (e: any) {
      console.error('Reset failed:', e);
      const msg = e?.response?.data?.message || e?.message || 'เกิดข้อผิดพลาดในการรีเซ็ต';
      toast.error(`รีเซ็ตไม่สำเร็จ: ${msg}`);
    } finally {
      setSaving(false);
    }
  };

  // Master Auto-Translate All
  const handleAutoTranslateAll = async () => {
    if (!confirm('ต้องการให้ระบบแปลเนื้อหาทุกส่วนที่ยังไม่มีภาษาอังกฤษอัตโนมัติหรือไม่? (จะไม่เขียนทับส่วนที่มีการแก้ไขภาษาอังกฤษไว้แล้ว)')) return;
    setTranslatingAll(true);
    toast.info('กำลังดำเนินการแปลเนื้อหาด้วย AI / Google Translate...');
    try {
      const next = JSON.parse(JSON.stringify(data)) as WelcomeContentData;

      // Hero
      if (!next.hero.headline_en?.trim() && next.hero.headline) {
        next.hero.headline_en = await translateText(next.hero.headline);
      }
      if (!next.hero.subtitle_en?.trim() && next.hero.subtitle) {
        next.hero.subtitle_en = await translateText(next.hero.subtitle);
      }
      if (!next.hero.ctaText_en?.trim() && next.hero.ctaText) {
        next.hero.ctaText_en = await translateText(next.hero.ctaText);
      }

      // Services
      for (const s of next.services) {
        if (!s.title_en?.trim() && s.title) s.title_en = await translateText(s.title);
        if (!s.body_en?.trim() && s.body) s.body_en = await translateText(s.body);
      }

      // News
      for (const n of next.news) {
        if (!n.title_en?.trim() && n.title) n.title_en = await translateText(n.title);
        if (!n.body_en?.trim() && n.body) n.body_en = await translateText(n.body);
        if (!n.category_en?.trim() && n.category) n.category_en = await translateText(n.category);
        if (!n.tag_en?.trim() && n.tag) n.tag_en = await translateText(n.tag);
      }

      // Guide
      for (const g of next.guide) {
        if (!g.title_en?.trim() && g.title) g.title_en = await translateText(g.title);
        if (!g.body_en?.trim() && g.body) g.body_en = await translateText(g.body);
      }

      // Tips
      for (const t of next.tips) {
        if (!t.title_en?.trim() && t.title) t.title_en = await translateText(t.title);
        if (!t.body_en?.trim() && t.body) t.body_en = await translateText(t.body);
        if (!t.category_en?.trim() && t.category) t.category_en = await translateText(t.category);
      }

      // Rules
      for (const r of next.rules) {
        if (!r.title_en?.trim() && r.title) r.title_en = await translateText(r.title);
        if (!r.items_en || r.items_en.length !== r.items.length) {
          r.items_en = await translateBatch(r.items);
        }
      }

      setData(next);
      toast.success('แปลเนื้อหาทุกส่วนเป็นภาษาอังกฤษเรียบร้อยแล้ว! อย่าลืมกด "บันทึกการเปลี่ยนแปลง"');
    } catch (e) {
      console.error('Auto translate all error:', e);
      toast.error('การแปลบางส่วนขัดข้อง กรุณาลองใหม่อีกครั้ง');
    } finally {
      setTranslatingAll(false);
    }
  };

  // Image Upload to Base64
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error('ขนาดไฟล์รูปภาพไม่ควรเกิน 2MB');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const res = event.target?.result as string;
      if (res) callback(res);
    };
    reader.readAsDataURL(file);
  };

  // Hero Image Handlers
  const addHeroImage = (url: string) => {
    if (!url.trim()) return;
    setData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        images: [...prev.hero.images, url.trim()]
      }
    }));
    setNewSlideUrl('');
    toast.success('เพิ่มรูปภาพสไลด์แล้ว');
  };

  const removeHeroImage = (index: number) => {
    if (data.hero.images.length <= 1) {
      toast.error('ต้องมีรูปภาพสไลด์อย่างน้อย 1 รูป');
      return;
    }
    setData((prev) => ({
      ...prev,
      hero: {
        ...prev.hero,
        images: prev.hero.images.filter((_, i) => i !== index)
      }
    }));
  };

  // Hero Auto-translate
  const handleTranslateHero = async () => {
    setTranslatingSection('hero');
    try {
      const [hlEn, subEn, ctaEn] = await translateBatch([
        data.hero.headline,
        data.hero.subtitle,
        data.hero.ctaText
      ]);
      setData((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          headline_en: hlEn || prev.hero.headline_en,
          subtitle_en: subEn || prev.hero.subtitle_en,
          ctaText_en: ctaEn || prev.hero.ctaText_en,
        }
      }));
      setHeroLang('en');
      toast.success('แปลส่วน Hero Banner เป็นภาษาอังกฤษเรียบร้อยแล้ว');
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  // News Handlers
  const openAddNews = () => {
    setEditingNewsId(null);
    setNewsModalLang('th');
    setNewsForm({
      id: `news-${Date.now()}`,
      tag: 'ข่าวใหม่',
      tag_en: 'New',
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()).replace(/-/g, '/'),
      title: '',
      title_en: '',
      body: '',
      body_en: '',
      category: 'การจองสนาม',
      category_en: 'Court Booking',
      image: ''
    });
    setShowNewsModal(true);
  };

  const openEditNews = (item: WelcomeNewsItem) => {
    setEditingNewsId(item.id);
    setNewsModalLang('th');
    setNewsForm({
      ...item,
      tag_en: item.tag_en || '',
      title_en: item.title_en || '',
      body_en: item.body_en || '',
      category_en: item.category_en || ''
    });
    setShowNewsModal(true);
  };

  const handleAutoTranslateNewsModal = async () => {
    if (!newsForm.title.trim() && !newsForm.body.trim()) {
      toast.error('กรุณากรอกหัวข้อหรือเนื้อหาข่าวภาษาไทยก่อนแปล');
      return;
    }
    setTranslatingNews(true);
    try {
      const [transTitle, transBody, transCat, transTag] = await translateBatch([
        newsForm.title,
        newsForm.body,
        newsForm.category,
        newsForm.tag
      ]);
      setNewsForm((prev) => ({
        ...prev,
        title_en: transTitle || prev.title_en,
        body_en: transBody || prev.body_en,
        category_en: transCat || prev.category_en,
        tag_en: transTag || prev.tag_en
      }));
      setNewsModalLang('en');
      toast.success('แปลเป็นภาษาอังกฤษสำเร็จ! สลับไปยังแท็บ English ให้ตรวจทานแล้ว');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการแปลภาษา');
    } finally {
      setTranslatingNews(false);
    }
  };

  const saveNewsItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newsForm.title.trim() || !newsForm.body.trim()) {
      toast.error('กรุณากรอกหัวข้อข่าวและเนื้อหาให้ครบถ้วน');
      return;
    }

    setData((prev) => {
      if (editingNewsId) {
        return {
          ...prev,
          news: prev.news.map((n) => (n.id === editingNewsId ? newsForm : n))
        };
      }
      return {
        ...prev,
        news: [newsForm, ...prev.news]
      };
    });
    setShowNewsModal(false);
    toast.success(editingNewsId ? 'แก้ไขข่าวสารเรียบร้อย' : 'เพิ่มข่าวใหม่เรียบร้อย (อย่าลืมกดบันทึกการเปลี่ยนแปลงด้านบน)');
  };

  const deleteNewsItem = (id: string) => {
    if (!confirm('ยืนยันลบข่าวนี้?')) return;
    setData((prev) => ({
      ...prev,
      news: prev.news.filter((n) => n.id !== id)
    }));
    toast.success('ลบข่าวเรียบร้อย');
  };

  // Quick translate single news item from card list
  const handleQuickTranslateNews = async (item: WelcomeNewsItem) => {
    setTranslatingSection(`news-${item.id}`);
    try {
      const [tTitle, tBody, tCat, tTag] = await translateBatch([
        item.title,
        item.body,
        item.category,
        item.tag
      ]);
      setData((prev) => ({
        ...prev,
        news: prev.news.map((n) =>
          n.id === item.id
            ? { ...n, title_en: tTitle, body_en: tBody, category_en: tCat, tag_en: tTag }
            : n
        )
      }));
      toast.success(`แปลข่าว "${item.title.slice(0, 20)}..." เป็นภาษาอังกฤษสำเร็จ`);
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  // Translate Service
  const handleTranslateService = async (index: number) => {
    setTranslatingSection(`srv-${index}`);
    try {
      const srv = data.services[index];
      const [tTitle, tBody] = await translateBatch([srv.title, srv.body]);
      const nextServices = [...data.services];
      nextServices[index] = { ...srv, title_en: tTitle, body_en: tBody };
      setData({ ...data, services: nextServices });
      setServicesLang('en');
      toast.success(`แปลบริการ "${srv.title}" เป็นภาษาอังกฤษเรียบร้อย`);
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  // Translate Guide
  const handleTranslateGuide = async (index: number) => {
    setTranslatingSection(`guide-${index}`);
    try {
      const step = data.guide[index];
      const [tTitle, tBody] = await translateBatch([step.title, step.body]);
      const nextGuide = [...data.guide];
      nextGuide[index] = { ...step, title_en: tTitle, body_en: tBody };
      setData({ ...data, guide: nextGuide });
      setGuideLang('en');
      toast.success(`แปลขั้นตอนที่ ${step.step} เป็นภาษาอังกฤษเรียบร้อย`);
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  // Translate Tip
  const handleTranslateTip = async (index: number) => {
    setTranslatingSection(`tip-${index}`);
    try {
      const tip = data.tips[index];
      const [tTitle, tBody, tCat] = await translateBatch([tip.title, tip.body, tip.category]);
      const nextTips = [...data.tips];
      nextTips[index] = { ...tip, title_en: tTitle, body_en: tBody, category_en: tCat };
      setData({ ...data, tips: nextTips });
      setTipsLang('en');
      toast.success(`แปลเคล็ดลับ "${tip.title.slice(0, 20)}..." เป็นภาษาอังกฤษเรียบร้อย`);
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  // Translate Rule
  const handleTranslateRule = async (index: number) => {
    setTranslatingSection(`rule-${index}`);
    try {
      const rule = data.rules[index];
      const tTitle = await translateText(rule.title);
      const tItems = await translateBatch(rule.items);
      const nextRules = [...data.rules];
      nextRules[index] = { ...rule, title_en: tTitle, items_en: tItems };
      setData({ ...data, rules: nextRules });
      setRulesLang('en');
      toast.success(`แปลกฎ "${rule.title}" เป็นภาษาอังกฤษเรียบร้อย`);
    } catch {
      toast.error('แปลไม่สำเร็จ');
    } finally {
      setTranslatingSection(null);
    }
  };

  if (loading) {
    return (
      <MainLayout width="full">
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#F26522] border-t-transparent" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout width="full">
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#0a0400] text-gray-900 dark:text-gray-100 py-8 px-4 sm:px-8 lg:px-16 transition-colors">
        
        {/* Top Header Bar */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-white/10">
            <div>
              <button
                onClick={() => router.push('/dashboard')}
                className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-[#F26522] dark:text-gray-400 mb-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> กลับสู่แดชบอร์ด
              </button>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-3">
                <span className="p-2 rounded-xl bg-[#F26522]/10 text-[#F26522]">
                  <Sparkles className="w-6 h-6" />
                </span>
                จัดการเนื้อหาหน้าแรก (Welcome / Landing Page)
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-2">
                <Languages className="w-4 h-4 text-emerald-500" />
                <span>รองรับระบบ 2 ภาษา (ไทย - อังกฤษ) พร้อมปุ่มแปลภาษาอัตโนมัติด้วย AI</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={handleAutoTranslateAll}
                disabled={translatingAll || saving}
                title="สแกนและแปลเนื้อหาทุกส่วนที่ยังว่างอยู่เป็นภาษาอังกฤษโดยไม่ทับของเดิม"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 text-sm font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors shadow-sm"
              >
                {translatingAll ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    กำลังแปลทุกส่วน…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    แปลทุกส่วนเป็นอังกฤษ (AI)
                  </>
                )}
              </button>

              <a
                href="/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-900 text-sm font-bold hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4" /> ดูหน้าแรกจริง
              </a>

              <button
                onClick={handleReset}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-300 dark:border-red-900/50 bg-red-50 dark:bg-red-950/20 text-red-600 dark:text-red-400 text-sm font-bold hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> คืนค่าเริ่มต้น
              </button>

              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#F26522] hover:bg-[#d95314] text-white text-sm font-bold shadow-lg shadow-[#F26522]/20 active:scale-95 transition-all"
              >
                <Save className="w-4 h-4" /> {saving ? 'กำลังบันทึก…' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </div>
          </div>

          {/* Quick Notice Banner */}
          <div className="mt-4 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-3 text-amber-800 dark:text-amber-300 text-sm">
            <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <div>
              <span className="font-bold">ระบบแปลภาษา 2 ภาษาแบบเสถียร:</span> คุณสามารถกรอกเนื้อหาทั้ง <strong>🇹🇭 ภาษาไทย</strong> และ <strong>🇬🇧 English</strong> หรือกดปุ่ม <strong>[ ✨ แปลเป็นอังกฤษด้วย AI ]</strong> เพื่อให้ระบบแปลให้อัตโนมัติ จากนั้นกด <strong>“บันทึกการเปลี่ยนแปลง”</strong> เพื่อให้หน้าเว็บสลับภาษาได้ทันที (0ms) ไม่มีค้าง
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto mb-8">
          <div className="flex gap-2 overflow-x-auto pb-2 border-b border-gray-200 dark:border-white/10">
            <button
              onClick={() => setActiveTab('news')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'news'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Newspaper className="w-4 h-4" /> ข่าวสาร & ประชาสัมพันธ์ ({data.news.length})
            </button>
            <button
              onClick={() => setActiveTab('hero')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'hero'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> แบนเนอร์ & สไลด์ภาพ ({data.hero.images.length})
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'services'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Layers className="w-4 h-4" /> บริการ (Services)
            </button>
            <button
              onClick={() => setActiveTab('guide')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'guide'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <BookOpen className="w-4 h-4" /> คู่มือการใช้งาน (Guide)
            </button>
            <button
              onClick={() => setActiveTab('tips')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'tips'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <Lightbulb className="w-4 h-4" /> เคล็ดลับผู้เล่น (Tips)
            </button>
            <button
              onClick={() => setActiveTab('rules')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'rules'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <ShieldAlert className="w-4 h-4" /> กฎและข้อกำหนด (Rules)
            </button>
            <button
              onClick={() => setActiveTab('courts')}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === 'courts'
                  ? 'bg-[#F26522] text-white shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> สนาม & รูปคอร์ท (Courts)
            </button>
          </div>
        </div>

        {/* Tab 1: ข่าวสาร (News) */}
        {activeTab === 'news' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">จัดการข่าวสารและประกาศ (News)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  เพิ่มข่าวใหม่ แก้ไขเนื้อหา พร้อมคำแปลภาษาอังกฤษ เพื่อแสดงบนหน้าแรกและหน้า /news
                </p>
              </div>
              <button
                onClick={openAddNews}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#F26522] text-white font-bold text-sm hover:bg-[#d95314] shadow-md transition-colors"
              >
                <Plus className="w-4 h-4" /> เพิ่มข่าวใหม่
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.news.map((item) => {
                const hasEn = Boolean(item.title_en?.trim());
                const isTranslating = translatingSection === `news-${item.id}`;

                return (
                  <div
                    key={item.id}
                    className="bg-white dark:bg-[#140900] rounded-3xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:border-[#F26522]/40 transition-all flex flex-col"
                  >
                    {/* News Image Preview */}
                    {item.image ? (
                      <div className="relative h-48 w-full bg-black/20 overflow-hidden">
                        <img
                          src={item.image}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-4 left-4 bg-[#F26522] text-white text-xs font-black px-2.5 py-1 rounded-md uppercase">
                          {item.tag || 'ข่าวสาร'}
                        </span>
                        <span className="absolute bottom-3 right-4 bg-black/70 backdrop-blur-md text-white text-xs px-2.5 py-1 rounded-md">
                          {item.date}
                        </span>
                      </div>
                    ) : (
                      <div className="h-24 bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-between p-6">
                        <span className="bg-[#F26522] text-white text-xs font-black px-2.5 py-1 rounded-md uppercase">
                          {item.tag || 'ข่าวสาร'}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                          {item.date}
                        </span>
                      </div>
                    )}

                    <div className="p-6 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300">
                            {item.category}
                          </span>
                          {hasEn ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3" /> มีภาษาอังกฤษ (EN)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full border border-amber-500/20">
                              <AlertTriangle className="w-3 h-3" /> ยังไม่มีภาษาอังกฤษ
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1 leading-snug">
                          {item.title}
                        </h3>

                        {item.title_en && (
                          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium mb-2 italic">
                            EN: {item.title_en}
                          </p>
                        )}

                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
                          {item.body}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-between gap-2">
                        {!hasEn && (
                          <button
                            type="button"
                            onClick={() => handleQuickTranslateNews(item)}
                            disabled={isTranslating}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 transition-colors"
                          >
                            {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            แปลอังกฤษด่วน
                          </button>
                        )}

                        <div className="flex items-center gap-2 ml-auto">
                          <button
                            onClick={() => openEditNews(item)}
                            className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-white/20 text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                          >
                            แก้ไข
                          </button>
                          <button
                            onClick={() => deleteNewsItem(item.id)}
                            className="px-3.5 py-1.5 rounded-lg border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
                          >
                            ลบ
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Hero & Slide Images */}
        {activeTab === 'hero' && (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-white dark:bg-[#140900] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#F26522]" /> ข้อความส่วนหัว (Hero Banner)
                </h2>

                <div className="flex items-center gap-2">
                  <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => setHeroLang('th')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        heroLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      🇹🇭 ภาษาไทย
                    </button>
                    <button
                      type="button"
                      onClick={() => setHeroLang('en')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        heroLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                      }`}
                    >
                      🇬🇧 English
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleTranslateHero}
                    disabled={translatingSection === 'hero'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                  >
                    {translatingSection === 'hero' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                    แปลส่วน Hero ด้วย AI
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      หัวข้อหลัก {heroLang === 'th' ? '(Headline 🇹🇭)' : '(Headline 🇬🇧 English)'}
                    </label>
                  </div>
                  {heroLang === 'th' ? (
                    <input
                      type="text"
                      value={data.hero.headline}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headline: e.target.value }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Book a court for an ultimate experience KMITL PCC BADMINTON"
                      value={data.hero.headline_en || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, headline_en: e.target.value }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      คำบรรยายย่อย {heroLang === 'th' ? '(Subtitle 🇹🇭)' : '(Subtitle 🇬🇧 English)'}
                    </label>
                  </div>
                  {heroLang === 'th' ? (
                    <textarea
                      rows={2}
                      value={data.hero.subtitle}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, subtitle: e.target.value }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  ) : (
                    <textarea
                      rows={2}
                      placeholder="e.g. Day-by-day badminton court booking system for KMITL students and staff."
                      value={data.hero.subtitle_en || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, subtitle_en: e.target.value }
                        }))
                      }
                      className="w-full px-4 py-3 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                      ข้อความบนปุ่ม {heroLang === 'th' ? '(CTA Button 🇹🇭)' : '(CTA Button 🇬🇧 English)'}
                    </label>
                  </div>
                  {heroLang === 'th' ? (
                    <input
                      type="text"
                      value={data.hero.ctaText}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, ctaText: e.target.value }
                        }))
                      }
                      className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Get Started"
                      value={data.hero.ctaText_en || ''}
                      onChange={(e) =>
                        setData((prev) => ({
                          ...prev,
                          hero: { ...prev.hero, ctaText_en: e.target.value }
                        }))
                      }
                      className="w-full sm:w-1/2 px-4 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Hero Images Management */}
            <div className="bg-white dark:bg-[#140900] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ImageIcon className="w-5 h-5 text-[#F26522]" /> รูปภาพสไลด์แบนเนอร์ (Hero Slides)
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  รูปภาพสไลด์ขนาดใหญ่ด้านบนสุดของหน้าแรก เลื่อนเปลี่ยนอัตโนมัติ
                </p>
              </div>

              {/* Add Image Inputs */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  เพิ่มรูปสไลด์ใหม่:
                </span>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="ใส่ URL รูปภาพ (เช่น https://images.unsplash.com/...)"
                    value={newSlideUrl}
                    onChange={(e) => setNewSlideUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                  <button
                    onClick={() => addHeroImage(newSlideUrl)}
                    className="px-5 py-2.5 rounded-xl bg-[#F26522] text-white text-sm font-bold hover:bg-[#d95314] transition-colors shrink-0"
                  >
                    + เพิ่มจาก URL
                  </button>
                  <input
                    type="file"
                    ref={slideFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileUpload(e, addHeroImage)}
                  />
                  <button
                    onClick={() => slideFileRef.current?.click()}
                    className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-800 text-sm font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-2 shrink-0"
                  >
                    <Upload className="w-4 h-4" /> อัปโหลดจากคอมพิวเตอร์
                  </button>
                </div>
              </div>

              {/* Slide Images List */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                {data.hero.images.map((imgUrl, idx) => (
                  <div
                    key={idx}
                    className="group relative rounded-2xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black aspect-video shadow-md"
                  >
                    <img
                      src={imgUrl}
                      alt={`Slide ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end justify-between p-4">
                      <span className="text-white text-xs font-bold bg-black/60 px-2.5 py-1 rounded-md backdrop-blur-sm">
                        สไลด์ที่ {idx + 1}
                      </span>
                      <button
                        onClick={() => removeHeroImage(idx)}
                        className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-700 transition-colors shadow-md"
                        title="ลบรูปนี้"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: บริการ (Services) */}
        {activeTab === 'services' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">แก้ไขข้อมูลบริการ 3 ส่วนหลัก</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  รองรับ 2 ภาษา สามารถกดปุ่มแปลภาษาอังกฤษอัตโนมัติได้รายส่วน
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setServicesLang('th')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    servicesLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇹🇭 ภาษาไทย
                </button>
                <button
                  type="button"
                  onClick={() => setServicesLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    servicesLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.services.map((srv, idx) => {
                const isTranslating = translatingSection === `srv-${idx}`;
                return (
                  <div
                    key={srv.id}
                    className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-[#F26522]">
                          บริการส่วนที่ {idx + 1}
                        </span>
                        <span className="material-symbols-outlined text-[32px] text-[#F26522]">
                          {srv.icon}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          ชื่อบริการ {servicesLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {servicesLang === 'th' ? (
                          <input
                            type="text"
                            value={srv.title}
                            onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[idx].title = e.target.value;
                              setData({ ...data, services: newServices });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Service title in English..."
                            value={srv.title_en || ''}
                            onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[idx].title_en = e.target.value;
                              setData({ ...data, services: newServices });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          คำอธิบาย {servicesLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {servicesLang === 'th' ? (
                          <textarea
                            rows={4}
                            value={srv.body}
                            onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[idx].body = e.target.value;
                              setData({ ...data, services: newServices });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <textarea
                            rows={4}
                            placeholder="Service description in English..."
                            value={srv.body_en || ''}
                            onChange={(e) => {
                              const newServices = [...data.services];
                              newServices[idx].body_en = e.target.value;
                              setData({ ...data, services: newServices });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {srv.title_en ? '✓ มีคำแปล EN แล้ว' : '— ยังไม่มี EN'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateService(idx)}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        แปลส่วนนี้ (AI)
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 4: คู่มือ (Guide) */}
        {activeTab === 'guide' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">แก้ไขขั้นตอนคู่มือการใช้งาน (4 ขั้นตอน)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  คู่มือขั้นตอนการจองสนาม 1-4 พร้อมคำแปลภาษาอังกฤษ
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setGuideLang('th')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    guideLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇹🇭 ภาษาไทย
                </button>
                <button
                  type="button"
                  onClick={() => setGuideLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    guideLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.guide.map((step, idx) => {
                const isTranslating = translatingSection === `guide-${idx}`;
                return (
                  <div
                    key={step.step}
                    className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="w-8 h-8 rounded-full bg-[#F26522] text-white flex items-center justify-center font-bold text-sm shadow">
                          {step.step}
                        </span>
                        <span className="material-symbols-outlined text-[28px] text-gray-400">
                          {step.icon}
                        </span>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          หัวข้อ {guideLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {guideLang === 'th' ? (
                          <input
                            type="text"
                            value={step.title}
                            onChange={(e) => {
                              const newGuide = [...data.guide];
                              newGuide[idx].title = e.target.value;
                              setData({ ...data, guide: newGuide });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Step title in English..."
                            value={step.title_en || ''}
                            onChange={(e) => {
                              const newGuide = [...data.guide];
                              newGuide[idx].title_en = e.target.value;
                              setData({ ...data, guide: newGuide });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          คำอธิบายวิธีปฏิบัติ {guideLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {guideLang === 'th' ? (
                          <textarea
                            rows={5}
                            value={step.body}
                            onChange={(e) => {
                              const newGuide = [...data.guide];
                              newGuide[idx].body = e.target.value;
                              setData({ ...data, guide: newGuide });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <textarea
                            rows={5}
                            placeholder="Step instructions in English..."
                            value={step.body_en || ''}
                            onChange={(e) => {
                              const newGuide = [...data.guide];
                              newGuide[idx].body_en = e.target.value;
                              setData({ ...data, guide: newGuide });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {step.title_en ? '✓ มีคำแปล EN' : '— ยังไม่มี EN'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateGuide(idx)}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        แปลขั้นตอนนี้
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 5: เคล็ดลับ (Tips) */}
        {activeTab === 'tips' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">แก้ไขบทความเคล็ดลับผู้เล่น (Tips)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  เทคนิคและสุขภาพสำหรับนักกีฬาแบดมินตัน
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setTipsLang('th')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tipsLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇹🇭 ภาษาไทย
                </button>
                <button
                  type="button"
                  onClick={() => setTipsLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    tipsLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.tips.map((tip, idx) => {
                const isTranslating = translatingSection === `tip-${idx}`;
                return (
                  <div
                    key={tip.id}
                    className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F26522]/10 text-[#F26522]">
                          {tipsLang === 'th' ? tip.category : (tip.category_en || tip.category)}
                        </span>
                        <span className="text-xs text-gray-400">{tip.date}</span>
                      </div>

                      {tip.image && (
                        <div className="h-36 rounded-xl overflow-hidden bg-black/10">
                          <img src={tip.image} alt={tip.title} className="w-full h-full object-cover" />
                        </div>
                      )}

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          หมวดหมู่ {tipsLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {tipsLang === 'th' ? (
                          <input
                            type="text"
                            value={tip.category}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].category = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Category in English..."
                            value={tip.category_en || ''}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].category_en = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          หัวข้อ {tipsLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {tipsLang === 'th' ? (
                          <input
                            type="text"
                            value={tip.title}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].title = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Tip title in English..."
                            value={tip.title_en || ''}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].title_en = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                          เนื้อหา {tipsLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                        </label>
                        {tipsLang === 'th' ? (
                          <textarea
                            rows={4}
                            value={tip.body}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].body = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                          />
                        ) : (
                          <textarea
                            rows={4}
                            placeholder="Tip details in English..."
                            value={tip.body_en || ''}
                            onChange={(e) => {
                              const newTips = [...data.tips];
                              newTips[idx].body_en = e.target.value;
                              setData({ ...data, tips: newTips });
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {tip.title_en ? '✓ มีคำแปล EN' : '— ยังไม่มี EN'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateTip(idx)}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        แปลเคล็ดลับนี้
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 6: กฎและข้อกำหนด (Rules) */}
        {activeTab === 'rules' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">แก้ไขกฎระเบียบและข้อกำหนดตามระบบจริง</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  เงื่อนไขการจอง การเช็กอิน และแต้มความผิด Strikes
                </p>
              </div>

              <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setRulesLang('th')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    rulesLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇹🇭 ภาษาไทย
                </button>
                <button
                  type="button"
                  onClick={() => setRulesLang('en')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    rulesLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                  }`}
                >
                  🇬🇧 English
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.rules.map((rule, ruleIdx) => {
                const isTranslating = translatingSection === `rule-${ruleIdx}`;
                const itemsList = rulesLang === 'th'
                  ? rule.items
                  : (rule.items_en && rule.items_en.length === rule.items.length ? rule.items_en : rule.items);

                return (
                  <div
                    key={rule.id}
                    className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4 flex flex-col justify-between"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                        <span className="material-symbols-outlined text-[28px] text-[#F26522]">
                          {rule.icon}
                        </span>
                        {rulesLang === 'th' ? (
                          <input
                            type="text"
                            value={rule.title}
                            onChange={(e) => {
                              const newRules = [...data.rules];
                              newRules[ruleIdx].title = e.target.value;
                              setData({ ...data, rules: newRules });
                            }}
                            className="text-lg font-bold bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-[#F26522] rounded px-2 w-full"
                          />
                        ) : (
                          <input
                            type="text"
                            placeholder="Rule category title in English..."
                            value={rule.title_en || ''}
                            onChange={(e) => {
                              const newRules = [...data.rules];
                              newRules[ruleIdx].title_en = e.target.value;
                              setData({ ...data, rules: newRules });
                            }}
                            className="text-lg font-bold bg-transparent text-emerald-600 dark:text-emerald-400 border-none focus:outline-none focus:ring-1 focus:ring-emerald-500 rounded px-2 w-full"
                          />
                        )}
                      </div>

                      <div className="space-y-3">
                        {rule.items.map((_, itemIdx) => (
                          <div key={itemIdx} className="space-y-1">
                            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
                              ข้อที่ {itemIdx + 1} {rulesLang === 'th' ? '(🇹🇭 ไทย)' : '(🇬🇧 English)'}
                            </label>
                            {rulesLang === 'th' ? (
                              <textarea
                                rows={2}
                                value={rule.items[itemIdx]}
                                onChange={(e) => {
                                  const newRules = [...data.rules];
                                  newRules[ruleIdx].items[itemIdx] = e.target.value;
                                  setData({ ...data, rules: newRules });
                                }}
                                className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                              />
                            ) : (
                              <textarea
                                rows={2}
                                placeholder="Rule text in English..."
                                value={rule.items_en?.[itemIdx] || ''}
                                onChange={(e) => {
                                  const newRules = [...data.rules];
                                  if (!newRules[ruleIdx].items_en) {
                                    newRules[ruleIdx].items_en = [...newRules[ruleIdx].items];
                                  }
                                  newRules[ruleIdx].items_en![itemIdx] = e.target.value;
                                  setData({ ...data, rules: newRules });
                                }}
                                className="w-full px-3.5 py-2 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                      <span className="text-[11px] text-gray-400">
                        {rule.title_en ? '✓ มีคำแปล EN' : '— ยังไม่มี EN'}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleTranslateRule(ruleIdx)}
                        disabled={isTranslating}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors"
                      >
                        {isTranslating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        แปลกฎข้อนี้
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 7: สนามและรูปคอร์ท (Courts) */}
        {activeTab === 'courts' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">จัดการรูปภาพและข้อมูลสนาม (Courts 1-4)</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  เปลี่ยนรูปภาพคอร์ท หรือระบุสถานที่/โซน เพื่อแสดงในหน้าเลือกคอร์ท (/booking/select-court)
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {courtsList.map((court) => (
                <div
                  key={court.id}
                  className="bg-white dark:bg-[#140900] rounded-3xl border border-gray-200 dark:border-white/10 p-6 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold bg-[#F26522]/10 text-[#F26522] px-3 py-1 rounded-full">
                      สนามที่ {court.id} ({court.name})
                    </span>
                    <span className="text-xs text-gray-400">
                      {court.status === 'AVAILABLE' ? '🟢 พร้อมใช้งาน' : '🟡 ไม่พร้อมใช้งาน'}
                    </span>
                  </div>

                  <div className="relative h-44 rounded-2xl overflow-hidden bg-black/10 border border-gray-200 dark:border-white/10">
                    <img
                      src={court.image || '/images/pixel_badminton.png'}
                      alt={court.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        ชื่อสนาม (Court Name)
                      </label>
                      <input
                        type="text"
                        value={court.name}
                        onChange={(e) =>
                          setCourtsList((prev) =>
                            prev.map((c) => (c.id === court.id ? { ...c, name: e.target.value } : c))
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        สถานที่ / ตำแหน่งที่ตั้ง (Location)
                      </label>
                      <input
                        type="text"
                        value={court.location || ''}
                        onChange={(e) =>
                          setCourtsList((prev) =>
                            prev.map((c) => (c.id === court.id ? { ...c, location: e.target.value } : c))
                          )
                        }
                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                        อัปโหลดรูปภาพใหม่สำหรับคอร์ทนี้
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleCourtFileInDashboard(court.id, e)}
                        className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-[#F26522]/10 file:text-[#F26522] hover:file:bg-[#F26522]/20 cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="button"
                      disabled={savingCourtId === court.id}
                      onClick={() => handleSaveCourtInDashboard(court)}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-black font-bold text-xs hover:opacity-90 transition-opacity"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {savingCourtId === court.id ? 'กำลังบันทึก…' : 'บันทึกข้อมูลคอร์ทนี้'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal: เพิ่ม/แก้ไข ข่าวสาร พร้อมปุ่มแปลภาษาอัตโนมัติ */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#140900] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-gray-100 dark:border-white/10">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-[#F26522]" />
                {editingNewsId ? 'แก้ไขข้อมูลข่าว' : 'เพิ่มข่าวประชาสัมพันธ์ใหม่'}
              </h2>

              <div className="flex items-center gap-2">
                {/* Language tab for Modal */}
                <div className="flex rounded-xl bg-gray-100 dark:bg-zinc-800 p-1 border border-gray-200 dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => setNewsModalLang('th')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      newsModalLang === 'th' ? 'bg-white dark:bg-zinc-900 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    🇹🇭 ไทย
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewsModalLang('en')}
                    className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                      newsModalLang === 'en' ? 'bg-[#F26522] text-white shadow-sm' : 'text-gray-500'
                    }`}
                  >
                    🇬🇧 English
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAutoTranslateNewsModal}
                  disabled={translatingNews}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-100 transition-colors shadow-sm"
                  title="แปลจากภาษาไทยไปเป็นภาษาอังกฤษและนำไปใส่ในแท็บ English ให้อัตโนมัติ"
                >
                  {translatingNews ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      กำลังแปล…
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      แปลอังกฤษ (AI)
                    </>
                  )}
                </button>
              </div>
            </div>

            <form onSubmit={saveNewsItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    หมวดหมู่ {newsModalLang === 'th' ? '(Category 🇹🇭)' : '(Category 🇬🇧 English)'}
                  </label>
                  {newsModalLang === 'th' ? (
                    <input
                      type="text"
                      required
                      placeholder="เช่น การจองสนาม, ระเบียบการ"
                      value={newsForm.category}
                      onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Court Booking, Policy"
                      value={newsForm.category_en || ''}
                      onChange={(e) => setNewsForm({ ...newsForm, category_en: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    ป้ายสถานะ {newsModalLang === 'th' ? '(Tag 🇹🇭)' : '(Tag 🇬🇧 English)'}
                  </label>
                  {newsModalLang === 'th' ? (
                    <input
                      type="text"
                      placeholder="เช่น ประกาศสำคัญ, ใหม่"
                      value={newsForm.tag}
                      onChange={(e) => setNewsForm({ ...newsForm, tag: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="e.g. Important, New"
                      value={newsForm.tag_en || ''}
                      onChange={(e) => setNewsForm({ ...newsForm, tag_en: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                    />
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  หัวข้อข่าว {newsModalLang === 'th' ? '(Title 🇹🇭)' : '(Title 🇬🇧 English)'}
                </label>
                {newsModalLang === 'th' ? (
                  <input
                    type="text"
                    required
                    placeholder="พิมพ์หัวข้อข่าวภาษาไทยที่นี่..."
                    value={newsForm.title}
                    onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                ) : (
                  <input
                    type="text"
                    placeholder="Headline in English..."
                    value={newsForm.title_en || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, title_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                )}
              </div>

              {/* News Image Upload & Preview */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-zinc-900 border border-gray-200 dark:border-white/10 space-y-3">
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                  รูปภาพประกอบข่าว (News Cover Image)
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder="ใส่ URL รูปภาพข่าว (https://...)"
                    value={newsForm.image || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, image: e.target.value })}
                    className="flex-1 px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-white dark:bg-zinc-800 text-xs focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                  <input
                    type="file"
                    ref={newsFileRef}
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, (base64) => setNewsForm({ ...newsForm, image: base64 }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => newsFileRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/20 bg-white dark:bg-zinc-800 text-xs font-bold hover:bg-gray-100 dark:hover:bg-zinc-700 transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    <Upload className="w-3.5 h-3.5" /> อัปโหลดจากเครื่อง
                  </button>
                </div>

                {newsForm.image && (
                  <div className="relative mt-2 h-36 rounded-xl overflow-hidden border border-gray-200 dark:border-white/10 bg-black">
                    <img
                      src={newsForm.image}
                      alt="News Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setNewsForm({ ...newsForm, image: '' })}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-600 text-white text-xs hover:bg-red-700"
                      title="ลบรูปภาพนี้"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  เนื้อหาข่าว {newsModalLang === 'th' ? '(Body 🇹🇭)' : '(Body 🇬🇧 English)'}
                </label>
                {newsModalLang === 'th' ? (
                  <textarea
                    rows={4}
                    required
                    placeholder="เขียนรายละเอียดข่าวสารภาษาไทย..."
                    value={newsForm.body}
                    onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                ) : (
                  <textarea
                    rows={4}
                    placeholder="Write news content in English..."
                    value={newsForm.body_en || ''}
                    onChange={(e) => setNewsForm({ ...newsForm, body_en: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-emerald-500/30 bg-emerald-50/20 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-white/10">
                <button
                  type="button"
                  onClick={() => setShowNewsModal(false)}
                  className="px-5 py-2 rounded-xl border border-gray-300 dark:border-white/20 text-sm font-bold hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-xl bg-[#F26522] text-white text-sm font-bold hover:bg-[#d95314] shadow-md transition-colors"
                >
                  {editingNewsId ? 'บันทึกการแก้ไข' : 'เพิ่มข่าว'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </MainLayout>
  );
}
