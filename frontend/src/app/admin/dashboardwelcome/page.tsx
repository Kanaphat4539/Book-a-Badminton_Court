'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';
import { toast } from 'sonner';
import {
  fetchWelcomeContent,
  saveWelcomeContent,
  resetWelcomeContent,
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
  Info
} from 'lucide-react';

export default function EditWelcomeDashboard() {
  const router = useRouter();
  const [data, setData] = useState<WelcomeContentData>(DEFAULT_WELCOME_DATA);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'hero' | 'news' | 'services' | 'guide' | 'tips' | 'rules'>('news');

  // News form state
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState<WelcomeNewsItem>({
    id: '',
    tag: 'ประกาศสำคัญ',
    date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()).replace(/-/g, '/'),
    title: '',
    body: '',
    category: 'การจองสนาม',
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
  }, [router]);

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

  // News Handlers
  const openAddNews = () => {
    setEditingNewsId(null);
    setNewsForm({
      id: `news-${Date.now()}`,
      tag: 'ข่าวใหม่',
      date: new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Bangkok' }).format(new Date()).replace(/-/g, '/'),
      title: '',
      body: '',
      category: 'การจองสนาม',
      image: ''
    });
    setShowNewsModal(true);
  };

  const openEditNews = (item: WelcomeNewsItem) => {
    setEditingNewsId(item.id);
    setNewsForm({ ...item });
    setShowNewsModal(true);
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
    toast.success(editingNewsId ? 'แก้ไขข่าวสารเรียบร้อย' : 'เพิ่มข่าวใหม่เรียบร้อย (อย่าลืมกดบันทึกทั้งหมด)');
  };

  const deleteNewsItem = (id: string) => {
    if (!confirm('ยืนยันลบข่าวนี้?')) return;
    setData((prev) => ({
      ...prev,
      news: prev.news.filter((n) => n.id !== id)
    }));
    toast.success('ลบข่าวเรียบร้อย');
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
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400 mt-1">
                แก้ไขข้อมูลบริการ ข่าวสารพร้อมรูปภาพ กฎระเบียบตามความเป็นจริง และภาพสไลด์หน้าแรก
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
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
              <span className="font-bold">คำแนะนำ:</span> เมื่อแก้ไขเนื้อหาหรือเพิ่มรูปภาพแล้ว ให้กดปุ่ม <strong>“บันทึกการเปลี่ยนแปลง”</strong> สีส้มด้านบน ข้อมูลจะแสดงผลบนหน้าแรกทันที และผู้ใช้ทุกคนจะมองเห็นข้อมูลที่อัปเดตตรงกัน
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
          </div>
        </div>

        {/* Tab 1: ข่าวสาร (News) */}
        {activeTab === 'news' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold">จัดการข่าวสารและประกาศ</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  เพิ่มข่าวใหม่ แก้ไขเนื้อหา และอัปโหลดรูปภาพประกอบข่าว เพื่อแสดงบนหน้าแรกและหน้า /news
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
              {data.news.map((item) => (
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
                    <div className="h-28 bg-gradient-to-r from-orange-500/20 to-amber-500/20 flex items-center justify-between p-6">
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
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 leading-snug">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 leading-relaxed mb-4">
                        {item.body}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex items-center justify-end gap-2">
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
              ))}
            </div>
          </div>
        )}

        {/* Tab 2: Hero & Slide Images */}
        {activeTab === 'hero' && (
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="bg-white dark:bg-[#140900] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#F26522]" /> ข้อความส่วนหัว (Hero Banner)
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    หัวข้อหลัก (Headline)
                  </label>
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
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    คำบรรยายย่อย (Subtitle)
                  </label>
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
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                    ข้อความบนปุ่ม (CTA Button)
                  </label>
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
                </div>
              </div>
            </div>

            {/* Hero Images Management */}
            <div className="bg-white dark:bg-[#140900] p-6 sm:p-8 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-[#F26522]" /> รูปภาพสไลด์แบนเนอร์ (Hero Slides)
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    รูปภาพสไลด์ขนาดใหญ่ด้านบนสุดของหน้าแรก เลื่อนเปลี่ยนอัตโนมัติ
                  </p>
                </div>
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
            <h2 className="text-xl font-bold">แก้ไขข้อมูลบริการ 3 ส่วนหลัก</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {data.services.map((srv, idx) => (
                <div
                  key={srv.id}
                  className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4"
                >
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
                      ชื่อบริการ
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      คำอธิบายบริการ
                    </label>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 4: คู่มือ (Guide) */}
        {activeTab === 'guide' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">แก้ไขขั้นตอนคู่มือการใช้งาน (4 ขั้นตอน)</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {data.guide.map((step, idx) => (
                <div
                  key={step.step}
                  className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4"
                >
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
                      หัวข้อขั้นตอน
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      คำอธิบายวิธีปฏิบัติ
                    </label>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 5: เคล็ดลับ (Tips) */}
        {activeTab === 'tips' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">แก้ไขบทความเคล็ดลับผู้เล่น</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.tips.map((tip, idx) => (
                <div
                  key={tip.id}
                  className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#F26522]/10 text-[#F26522]">
                      {tip.category}
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
                      หัวข้อบทความ
                    </label>
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
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                      เนื้อหาเคล็ดลับ
                    </label>
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
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 6: กฎและข้อกำหนด (Rules) */}
        {activeTab === 'rules' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <h2 className="text-xl font-bold">แก้ไขกฎระเบียบและข้อกำหนดตามระบบจริง</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {data.rules.map((rule, ruleIdx) => (
                <div
                  key={rule.id}
                  className="bg-white dark:bg-[#140900] p-6 rounded-3xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4"
                >
                  <div className="flex items-center gap-3 pb-2 border-b border-gray-100 dark:border-white/5">
                    <span className="material-symbols-outlined text-[28px] text-[#F26522]">
                      {rule.icon}
                    </span>
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
                  </div>

                  <div className="space-y-3">
                    {rule.items.map((item, itemIdx) => (
                      <div key={itemIdx} className="space-y-1">
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400">
                          ข้อที่ {itemIdx + 1}
                        </label>
                        <textarea
                          rows={2}
                          value={item}
                          onChange={(e) => {
                            const newRules = [...data.rules];
                            newRules[ruleIdx].items[itemIdx] = e.target.value;
                            setData({ ...data, rules: newRules });
                          }}
                          className="w-full px-3.5 py-2 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Modal: เพิ่ม/แก้ไข ข่าวสาร พร้อมใส่รูปภาพ */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white dark:bg-[#140900] rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-200 dark:border-white/10 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-[#F26522]" />
              {editingNewsId ? 'แก้ไขข้อมูลข่าว' : 'เพิ่มข่าวประชาสัมพันธ์ใหม่'}
            </h2>

            <form onSubmit={saveNewsItem} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    หมวดหมู่ (Category)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น การจองสนาม, ระเบียบการ"
                    value={newsForm.category}
                    onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    ป้ายสถานะ (Tag)
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ประกาศสำคัญ, ใหม่"
                    value={newsForm.tag}
                    onChange={(e) => setNewsForm({ ...newsForm, tag: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  หัวข้อข่าว (Title)
                </label>
                <input
                  type="text"
                  required
                  placeholder="พิมพ์หัวข้อข่าวที่นี่..."
                  value={newsForm.title}
                  onChange={(e) => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
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
                  เนื้อหาข่าว (Body)
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="เขียนรายละเอียดข่าวสาร..."
                  value={newsForm.body}
                  onChange={(e) => setNewsForm({ ...newsForm, body: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 dark:border-white/10 bg-gray-50 dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                />
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
