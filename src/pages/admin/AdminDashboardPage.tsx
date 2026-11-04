/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Layers,
  Sliders,
  Calendar,
  Sparkles,
  Instagram,
  Type,
  Palette,
  Bot,
  Languages,
  Image,
  MessageSquare,
  RotateCcw,
  Save,
  Globe,
  Eye,
  LogOut,
  Plus,
  Trash2,
  CheckCircle2,
  ExternalLink,
  Film,
  Download,
  Upload,
  RefreshCw,
  Search,
  Monitor,
  Tablet,
  Smartphone,
  Check,
  ChevronRight,
  Loader2,
  SlidersHorizontal,
  FileText,
  Key,
} from 'lucide-react';
import { useSite, ExperienceMode } from '../../context/SiteContext';
import {
  SiteData,
  HeroSlide,
  EventItem,
  HighlightItem,
  InstagramPost,
  AiConfig,
} from '../../types';
import { AiAssistantDrawer } from '../../components/common/AiAssistantDrawer';

type StudioTab =
  | 'overview'
  | 'layout'
  | 'hero'
  | 'events'
  | 'highlights'
  | 'instagram'
  | 'typography'
  | 'theme'
  | 'ai_settings'
  | 'bilingual'
  | 'brand'
  | 'messages'
  | 'versions';

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

export const AdminDashboardPage: React.FC = () => {
  const {
    data,
    saveDraft,
    publishToLive,
    restoreBackup,
    logout,
    isAuthenticated,
    isDraftMode,
    setIsDraftMode,
    hasDraftChanges,
    experienceMode,
    setExperienceMode,
    translateText,
    refreshData,
  } = useSite();

  const navigate = useNavigate();

  // If not authenticated, redirect to /admin/login
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login');
    }
  }, [isAuthenticated, navigate]);

  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [localData, setLocalData] = useState<SiteData>(data);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Sync local draft data when context data updates
  useEffect(() => {
    setLocalData(data);
  }, [data]);

  // AI Assistant Drawer state
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Device Simulator state
  const [simulatorOpen, setSimulatorOpen] = useState(false);
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');

  // Quick Command Search state
  const [searchQuery, setSearchQuery] = useState('');

  // Messages & Subscribers & Backups
  const [messagesList, setMessagesList] = useState<any[]>([]);
  const [subscribersList, setSubscribersList] = useState<any[]>([]);
  const [backupsList, setBackupsList] = useState<any[]>([]);

  // Video auto-preview state
  const [previewInputUrl, setPreviewInputUrl] = useState('');
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  // Instagram Sync state
  const [isSyncingInstagram, setIsSyncingInstagram] = useState(false);
  const [instagramSyncResult, setInstagramSyncResult] = useState<string | null>(null);

  // OpenAI Config state
  const [aiConfig, setAiConfig] = useState<AiConfig>({
    provider: 'openai',
    openaiApiKey: '',
    model: 'gpt-4o',
    costLimitDaily: 5,
    enabledCapabilities: {
      designAssistant: true,
      contentAssistant: true,
      translationAssistant: true,
      seoAssistant: true,
    },
  });
  const [isSavingAiConfig, setIsSavingAiConfig] = useState(false);
  const [aiTestResult, setAiTestResult] = useState<string | null>(null);

  // Publish Modal state
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishNote, setPublishNote] = useState('');

  // Translation in progress tracker
  const [translatingId, setTranslatingId] = useState<string | null>(null);

  // Fetch initial data for messages, backups, ai config
  useEffect(() => {
    fetch('/api/contact/list')
      .then((res) => res.json())
      .then((json) => {
        if (json.messages) setMessagesList(json.messages);
      })
      .catch(() => {});

    fetch('/api/newsletter/list')
      .then((res) => res.json())
      .then((json) => {
        if (json.subscribers) setSubscribersList(json.subscribers);
      })
      .catch(() => {});

    fetch('/api/site/backups')
      .then((res) => res.json())
      .then((json) => {
        if (json.backups) setBackupsList(json.backups);
      })
      .catch(() => {});

    fetch('/api/ai/config')
      .then((res) => res.json())
      .then((json) => {
        if (json.config) setAiConfig(json.config);
      })
      .catch(() => {});
  }, [activeTab]);

  const handleSaveDraft = async () => {
    setIsSaving(true);
    setStatusMessage(null);
    try {
      const res = await saveDraft(localData);
      if (res.success) {
        setStatusMessage({ type: 'success', text: 'Taslak değişiklikleri başarıyla kaydedildi!' });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Hata oluştu.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsSaving(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  const handlePublishConfirm = async () => {
    setIsPublishing(true);
    setStatusMessage(null);
    try {
      await saveDraft(localData);
      const res = await publishToLive(publishNote || 'Canlıya yayınlama');
      if (res.success) {
        setShowPublishModal(false);
        setPublishNote('');
        setStatusMessage({ type: 'success', text: 'Site başarıyla canlıya yayınlandı!' });
      } else {
        setStatusMessage({ type: 'error', text: res.message || 'Yayınlama başarısız.' });
      }
    } catch (e: any) {
      setStatusMessage({ type: 'error', text: e.message });
    } finally {
      setIsPublishing(false);
      setTimeout(() => setStatusMessage(null), 4000);
    }
  };

  // Section Reorder
  const moveSection = (index: number, direction: 'up' | 'down') => {
    const sections = [...(localData.sections || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const temp = sections[index];
    sections[index] = sections[targetIndex];
    sections[targetIndex] = temp;

    const updated = sections.map((sec, idx) => ({ ...sec, order: idx + 1 }));
    setLocalData({ ...localData, sections: updated });
  };

  const toggleSectionVisibility = (id: string) => {
    const updated = (localData.sections || []).map((sec) =>
      sec.id === id ? { ...sec, visible: !sec.visible } : sec
    );
    setLocalData({ ...localData, sections: updated });
  };

  // Video Fetch
  const handleFetchVideoPreview = async () => {
    if (!previewInputUrl) return;
    setIsPreviewLoading(true);
    setPreviewResult(null);
    try {
      const res = await fetch('/api/video/preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: previewInputUrl }),
      });
      const json = await res.json();
      setPreviewResult(json);
    } catch (err: any) {
      setPreviewResult({ success: false, message: 'Bağlantı hatası: ' + err.message });
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleApplyVideoToHighlights = () => {
    if (!previewResult || !previewResult.success) return;
    const newHighlight: HighlightItem = {
      id: `hl_${Date.now()}`,
      title: previewResult.title || 'Yeni Video İçeriği',
      title_en: previewResult.title || 'New Video Feature',
      category: previewResult.platform === 'youtube' ? 'Video / Sahne Arkası' : 'Medya',
      category_en: 'Media & Behind the Scenes',
      description: previewResult.description || 'Önizlemeden eklenen video içeriği.',
      description_en: 'Video feature added from media preview.',
      videoUrl: previewResult.originalUrl,
      embedUrl: previewResult.embedUrl,
      mediaType: 'video',
      imageUrl: previewResult.imageUrl || previewResult.fallbackImageUrl || '/images/highlight_theater.svg',
      linkUrl: previewResult.originalUrl,
      linkText: 'Videoyu İzle',
      linkText_en: 'Watch Video',
      order: (localData.highlights?.length || 0) + 1,
      published: true,
    };
    setLocalData({
      ...localData,
      highlights: [newHighlight, ...(localData.highlights || [])],
    });
    setPreviewInputUrl('');
    setPreviewResult(null);
    setStatusMessage({ type: 'success', text: 'Video öne çıkanlara başarıyla eklendi!' });
  };

  // Instagram Sync Handler
  const handleSyncInstagram = async () => {
    setIsSyncingInstagram(true);
    setInstagramSyncResult(null);
    try {
      const res = await fetch('/api/instagram/sync', { method: 'POST' });
      const json = await res.json();
      if (res.ok && json.success) {
        setInstagramSyncResult(`Senkronizasyon başarılı: ${json.count} gönderi güncellendi.`);
        if (json.posts) {
          setLocalData({ ...localData, instagramPosts: json.posts });
        }
      } else {
        setInstagramSyncResult(json.error || 'Instagram API bağlantısı kurulamadı.');
      }
    } catch (e: any) {
      setInstagramSyncResult('Bağlantı hatası: ' + e.message);
    } finally {
      setIsSyncingInstagram(false);
    }
  };

  // AI Config Save
  const handleSaveAiConfig = async () => {
    setIsSavingAiConfig(true);
    setAiTestResult(null);
    try {
      const res = await fetch('/api/ai/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(aiConfig),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setAiTestResult('✅ OpenAI ayarları başarıyla kaydedildi.');
      } else {
        setAiTestResult('❌ Hata: ' + (json.error || 'Kaydedilemedi.'));
      }
    } catch (e: any) {
      setAiTestResult('❌ Bağlantı hatası: ' + e.message);
    } finally {
      setIsSavingAiConfig(false);
    }
  };

  // AI Translation helper for items
  const handleAutoTranslateEvent = async (ev: EventItem) => {
    setTranslatingId(ev.id);
    try {
      const translatedTitle = await translateText(ev.title, 'theater play title');
      const translatedDesc = await translateText(ev.description, 'theater event description');
      const updated = (localData.events || []).map((item) =>
        item.id === ev.id
          ? {
              ...item,
              title_en: translatedTitle,
              description_en: translatedDesc,
              category_en:
                item.category === 'Tiyatro'
                  ? 'Theater'
                  : item.category === 'Performans'
                  ? 'Performance'
                  : item.category === 'Atölye'
                  ? 'Workshop'
                  : 'Event',
              venue_en: item.venue,
            }
          : item
      );
      setLocalData({ ...localData, events: updated });
      setStatusMessage({ type: 'success', text: `"${ev.title}" İngilizceye çevrildi.` });
    } finally {
      setTranslatingId(null);
    }
  };

  const handleAutoTranslateSlide = async (slide: HeroSlide) => {
    setTranslatingId(slide.id);
    try {
      const translatedTitle = await translateText(slide.title, 'hero title');
      const translatedSubtitle = await translateText(slide.subtitle, 'hero subtitle');
      const translatedBtn = await translateText(slide.buttonText, 'hero button');
      const updated = (localData.heroSlides || []).map((s) =>
        s.id === slide.id
          ? {
              ...s,
              title_en: translatedTitle,
              subtitle_en: translatedSubtitle,
              buttonText_en: translatedBtn,
              category_en: s.category === 'Tiyatro' ? 'Theater' : s.category,
            }
          : s
      );
      setLocalData({ ...localData, heroSlides: updated });
      setStatusMessage({ type: 'success', text: `Slayt İngilizceye çevrildi.` });
    } finally {
      setTranslatingId(null);
    }
  };

  // Navigation Items per Mode
  const getNavItems = () => {
    const commonItems = [
      { id: 'overview', label: 'Genel Bakış & Durum', icon: LayoutDashboard },
      { id: 'layout', label: 'Sayfa Bölüm Sıralaması', icon: Layers },
      { id: 'hero', label: 'Hero Afiş Slider (1200x400)', icon: Sliders },
      { id: 'events', label: 'Etkinlik Takvimi & Biletler', icon: Calendar },
      { id: 'highlights', label: 'Öne Çıkanlar & Video', icon: Sparkles },
      { id: 'instagram', label: 'Instagram Akışı', icon: Instagram },
      { id: 'brand', label: 'Logo & Marka Kimliği', icon: Image },
      { id: 'messages', label: 'Mesajlar & Aboneler', icon: MessageSquare },
    ];

    if (experienceMode === 'easy') {
      return commonItems;
    }

    if (experienceMode === 'advanced') {
      return [
        ...commonItems,
        { id: 'typography', label: 'Tipografi & Font Stüdyosu', icon: Type },
        { id: 'theme', label: 'Renkler & Çift Tema Stüdyosu', icon: Palette },
        { id: 'bilingual', label: 'Çift Dilli İçerik Yönetimi', icon: Languages },
        { id: 'versions', label: 'Sürümler & Yedekleme', icon: RotateCcw },
      ];
    }

    // Expert Mode
    return [
      ...commonItems,
      { id: 'typography', label: 'Tipografi & Font Stüdyosu', icon: Type },
      { id: 'theme', label: 'Renkler & Çift Tema Stüdyosu', icon: Palette },
      { id: 'bilingual', label: 'Çift Dilli İçerik Yönetimi', icon: Languages },
      { id: 'ai_settings', label: 'OpenAI & Yapay Zekâ Ayarları', icon: Bot },
      { id: 'versions', label: 'Sürümler & Yedekleme', icon: RotateCcw },
    ];
  };

  return (
    <div className="min-h-screen bg-[#0b0b0f] text-[#f1f1f4] flex flex-col font-sans">
      {/* Top Studio Bar */}
      <header className="sticky top-0 z-40 bg-[#121218] border-b border-white/10 px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        {/* Brand & Studio Name */}
        <div className="flex items-center gap-3">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#ff5a1f] to-amber-500 flex items-center justify-center text-white font-bold text-xs shadow-md shadow-[#ff5a1f]/20">
              İSH
            </div>
            <div>
              <div className="text-sm font-extrabold text-white tracking-tight flex items-center gap-1.5">
                <span>İSMAİL SEMİH STUDIO</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#ff5a1f]/20 text-[#ff8c42] font-mono">
                  V2
                </span>
              </div>
              <p className="text-[10px] text-gray-400">Görsel Sanatçı Web Sitesi Yönetim Merkezi</p>
            </div>
          </Link>
        </div>

        {/* 3 Experience Modes Toggle: Kolay / Gelişmiş / Uzman */}
        <div className="flex items-center bg-[#151520] p-1 rounded-xl border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setExperienceMode('easy')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              experienceMode === 'easy'
                ? 'bg-[#ff5a1f] text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Sade, hızlı, az tıklamalı içerik yönetimi"
          >
            Kolay Mod
          </button>
          <button
            type="button"
            onClick={() => setExperienceMode('advanced')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              experienceMode === 'advanced'
                ? 'bg-[#ff5a1f] text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="Tipografi, tema paletleri, responsive ve çift dil kontrolleri"
          >
            Gelişmiş Mod
          </button>
          <button
            type="button"
            onClick={() => setExperienceMode('expert')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              experienceMode === 'expert'
                ? 'bg-[#ff5a1f] text-white shadow-sm font-semibold'
                : 'text-gray-400 hover:text-white'
            }`}
            title="OpenAI API anahtarı, Meta Graph API ve ham sistem ayarları"
          >
            Uzman Mod
          </button>
        </div>

        {/* Right Tools: Device Preview, AI Assistant, Save Draft, Publish, Logout */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Device Simulator Trigger */}
          <button
            type="button"
            onClick={() => setSimulatorOpen(!simulatorOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              simulatorOpen
                ? 'bg-[#ff5a1f]/20 border-[#ff5a1f] text-[#ff8c42]'
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
            }`}
            title="Cihaz Önizleme Simülatörü"
          >
            <Monitor className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cihaz Önizleme</span>
          </button>

          {/* AI Assistant Button */}
          <button
            type="button"
            onClick={() => setIsAiDrawerOpen(true)}
            className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 via-[#ff5a1f]/20 to-purple-600/20 hover:from-amber-500/30 hover:to-purple-600/30 border border-[#ff5a1f]/50 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#ff5a1f] animate-pulse" />
            <span>AI ASİSTANIM</span>
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={isSaving}
            className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">Taslağı Kaydet</span>
          </button>

          {/* Publish to Live */}
          <button
            type="button"
            onClick={() => setShowPublishModal(true)}
            disabled={isPublishing}
            className="px-4 py-1.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-[#ff5a1f]/25 transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Canlıya Yayınla</span>
          </button>

          {/* Logout */}
          <button
            type="button"
            onClick={logout}
            className="p-2 text-gray-400 hover:text-red-400 rounded-lg hover:bg-white/5 transition-colors cursor-pointer"
            title="Çıkış Yap"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Status Message */}
      {statusMessage && (
        <div
          className={`px-4 py-2 text-xs text-center font-medium ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950 border-b border-emerald-800 text-emerald-300'
              : 'bg-red-950 border-b border-red-800 text-red-300'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Device Simulator Drawer / Modal if Open */}
      {simulatorOpen && (
        <div className="bg-[#0b0b0f] border-b border-white/10 p-4 transition-all">
          <div className="max-w-[1280px] mx-auto flex flex-col items-center">
            {/* Simulator Controls */}
            <div className="flex items-center justify-between w-full mb-3">
              <div className="flex items-center gap-2 text-xs text-gray-300 font-semibold">
                <Monitor className="w-4 h-4 text-[#ff5a1f]" />
                <span>Canlı Cihaz Önizleme Simülatörü</span>
              </div>
              <div className="flex items-center gap-1 bg-[#151520] p-1 rounded-xl border border-white/10 text-xs">
                <button
                  type="button"
                  onClick={() => setDeviceMode('desktop')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'desktop' ? 'bg-[#ff5a1f] text-white font-semibold' : 'text-gray-400'
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5" />
                  <span>Masaüstü (100%)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('tablet')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'tablet' ? 'bg-[#ff5a1f] text-white font-semibold' : 'text-gray-400'
                  }`}
                >
                  <Tablet className="w-3.5 h-3.5" />
                  <span>Tablet (768px)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeviceMode('mobile')}
                  className={`px-3 py-1 rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    deviceMode === 'mobile' ? 'bg-[#ff5a1f] text-white font-semibold' : 'text-gray-400'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobil (390px)</span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => setSimulatorOpen(false)}
                className="text-xs text-gray-400 hover:text-white"
              >
                Simülatörü Kapat
              </button>
            </div>

            {/* Simulated Frame */}
            <div
              className="bg-black rounded-2xl overflow-hidden border-4 border-[#232332] shadow-2xl transition-all duration-300 w-full"
              style={{
                maxWidth:
                  deviceMode === 'desktop' ? '100%' : deviceMode === 'tablet' ? '768px' : '390px',
                height: '520px',
              }}
            >
              <iframe
                src="/"
                title="Canlı Önizleme"
                className="w-full h-full border-0 bg-[#0b0b0f]"
              />
            </div>
          </div>
        </div>
      )}

      {/* Main Studio Body: Sidebar Navigation + Editor Panel */}
      <div className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Modular Studio Navigation Menu (3 cols) */}
        <aside className="lg:col-span-3 space-y-2">
          {/* Quick Search */}
          <div className="relative mb-3">
            <Search className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Modül veya ayar ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#121218] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]"
            />
          </div>

          <div className="bg-[#121218] p-3 rounded-2xl border border-white/10 space-y-1">
            <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
              <span>STÜDYO MODÜLLERİ</span>
              <span className="text-[#ff5a1f] font-mono capitalize">{experienceMode}</span>
            </div>

            {getNavItems()
              .filter((item) =>
                searchQuery
                  ? item.label.toLowerCase().includes(searchQuery.toLowerCase())
                  : true
              )
              .map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveTab(item.id as StudioTab)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#ff5a1f] text-white shadow-md'
                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </div>
                    {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-80" />}
                  </button>
                );
              })}
          </div>

          {/* Quick AI Tip Card */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-[#151520] to-[#121218] border border-white/10 space-y-2">
            <div className="flex items-center gap-2 text-[#ff5a1f] text-xs font-bold">
              <Sparkles className="w-4 h-4" />
              <span>AI Asistanınız Hazır</span>
            </div>
            <p className="text-[11px] text-gray-400 leading-relaxed">
              Font değiştirmek, renk paletini güncellemek veya İngilizceye çevirmek için sağ üstteki <strong>AI ASİSTANIM</strong> butonuna tıklayın.
            </p>
          </div>
        </aside>

        {/* Right Content Editor Area (9 cols) */}
        <main className="lg:col-span-9 bg-[#121218] p-6 sm:p-8 rounded-2xl border border-white/10 shadow-2xl">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white tracking-tight">Genel Bakış &amp; Yönetim Paneli</h3>
                <p className="text-xs text-gray-400 mt-1">
                  İsmail Semih Habiboğulları web sitesinin güncel durumunu izleyin, hızlı araçları kullanın.
                </p>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400 font-medium">Sahne Takvimi</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {localData.events?.filter((e) => e.published).length || 0}
                  </div>
                  <span className="text-[11px] text-[#ff5a1f] mt-1 block">Yayındaki Temsil</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400 font-medium">Instagram Gönderileri</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {localData.instagramPosts?.filter((p) => p.published).length || 0}
                  </div>
                  <span className="text-[11px] text-[#e1306c] mt-1 block">Akışta Gösterilen</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400 font-medium">Gelen Mesajlar</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {messagesList.filter((m) => !m.read).length}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">Okunmamış İletişim</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400 font-medium">E-posta Bülteni</span>
                  <div className="text-2xl font-bold text-white mt-1">{subscribersList.length}</div>
                  <span className="text-[11px] text-cyan-400 mt-1 block">Kayıtlı Abone</span>
                </div>
              </div>

              {/* System Sync Banner */}
              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#ff5a1f] uppercase tracking-wider">
                      SİSTEM DURUMU
                    </span>
                    <span className="text-xs text-gray-400">·</span>
                    <span className="text-xs text-gray-300 font-mono">
                      Canlı Sürüm: v{data.version || 1}
                    </span>
                  </div>
                  <h4 className="text-base font-bold text-white">
                    {hasDraftChanges
                      ? '⚠️ Kaydedilmemiş veya Canlıya Aktarılmamış Değişiklikler Var'
                      : '✅ Canlı Sürümle Senkronize'}
                  </h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Yaptığınız değişiklikleri önce "Taslağı Kaydet" ile saklayabilir, ardından tek tıkla "Canlıya Yayınla" ile yayınlayabilirsiniz.
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={handleSaveDraft}
                    disabled={isSaving}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>Taslağı Kaydet</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPublishModal(true)}
                    disabled={isPublishing}
                    className="px-5 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Canlıya Yayınla</span>
                  </button>
                </div>
              </div>

              {/* Universal Media Preview Tool */}
              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-[#ff5a1f]" />
                  <h4 className="text-sm font-bold text-white">
                    Universal Medya Bağlantısından Otomatik İçerik Hazırlayıcı
                  </h4>
                </div>
                <p className="text-xs text-gray-400 mb-4">
                  YouTube, Vimeo veya Spotify linkini yapıştırın; kapak görseli, başlık ve gömme kodu anında çekilsin.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... veya https://youtu.be/..."
                    value={previewInputUrl}
                    onChange={(e) => setPreviewInputUrl(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]"
                  />
                  <button
                    type="button"
                    onClick={handleFetchVideoPreview}
                    disabled={isPreviewLoading || !previewInputUrl}
                    className="px-5 py-2.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold transition-colors disabled:opacity-50 shrink-0 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {isPreviewLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Çekiliyor...</span>
                      </>
                    ) : (
                      <span>Önizlemeyi Getir</span>
                    )}
                  </button>
                </div>

                {previewResult && (
                  <div className="mt-4 p-4 rounded-xl bg-[#0b0b0f] border border-white/10 flex flex-col sm:flex-row gap-4 items-start">
                    {previewResult.imageUrl && (
                      <img
                        src={previewResult.imageUrl}
                        alt={previewResult.title}
                        className="w-32 h-20 object-cover rounded-lg shrink-0 bg-black"
                      />
                    )}
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-[#ff5a1f] uppercase tracking-wider block">
                        {previewResult.platform || 'Platform'}
                      </span>
                      <h4 className="text-sm font-bold text-white mt-0.5">
                        {previewResult.title || 'Başlık alınamadı'}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">
                        {previewResult.description}
                      </p>
                      <div className="mt-3 flex items-center gap-3">
                        {previewResult.success ? (
                          <button
                            type="button"
                            onClick={handleApplyVideoToHighlights}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Öne Çıkanlara Ekle</span>
                          </button>
                        ) : (
                          <span className="text-xs text-red-400">{previewResult.message}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: LAYOUT */}
          {activeTab === 'layout' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Sayfa Bölüm Sıralaması</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Ana sayfadaki bölümleri yukarı/aşağı taşıyarak sıralayabilir, dilediğiniz bölümleri gizleyip görünür yapabilirsiniz.
                </p>
              </div>

              <div className="space-y-3">
                {(localData.sections || []).map((sec, index) => (
                  <div
                    key={sec.id}
                    className="p-4 rounded-xl bg-[#151520] border border-white/10 flex items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-lg bg-white/5 text-[#ff5a1f] font-mono text-xs flex items-center justify-center font-bold">
                        0{index + 1}
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white">{sec.title}</h4>
                        <p className="text-xs text-gray-400">{sec.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleSectionVisibility(sec.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                          sec.visible
                            ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-800/40'
                            : 'bg-white/5 text-gray-400'
                        }`}
                      >
                        {sec.visible ? 'Yayında' : 'Gizli'}
                      </button>

                      <button
                        type="button"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Yukarı Taşı"
                      >
                        ▲
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === (localData.sections?.length || 0) - 1}
                        className="p-1.5 rounded-lg bg-white/5 text-gray-300 hover:text-white disabled:opacity-30 cursor-pointer"
                        title="Aşağı Taşı"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: HERO SLIDER */}
          {activeTab === 'hero' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Hero Afiş Slider (1200 × 400)</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    3:1 sinematik oranındaki afiş slaytlarını ve geçiş efektlerini yönetin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const newSlide: HeroSlide = {
                      id: `slide_${Date.now()}`,
                      title: 'Yeni Slayt Başlığı',
                      title_en: 'New Slide Title',
                      subtitle: 'Slayt açıklama metni...',
                      subtitle_en: 'Slide description text...',
                      category: 'Tiyatro',
                      category_en: 'Theater',
                      badge: 'YENİ',
                      badge_en: 'NEW',
                      imageUrl: '/images/hero_slide_1.svg',
                      buttonText: 'Detayları Gör',
                      buttonText_en: 'View Details',
                      buttonLink: '/etkinlikler',
                      order: (localData.heroSlides?.length || 0) + 1,
                      active: true,
                    };
                    setLocalData({
                      ...localData,
                      heroSlides: [...(localData.heroSlides || []), newSlide],
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#ff5a1f] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Slayt Ekle</span>
                </button>
              </div>

              {/* Slider Motion & Transition Settings */}
              <div className="p-4 rounded-xl bg-[#151520] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#ff5a1f]" />
                  <span>Geçiş Efekti &amp; Animasyon Ayarları</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Geçiş Efekti</label>
                    <select
                      value={localData.settings?.sliderSettings?.transitionType || 'kenburns-crossfade'}
                      onChange={(e) => {
                        setLocalData({
                          ...localData,
                          settings: {
                            ...localData.settings,
                            sliderSettings: {
                              ...localData.settings.sliderSettings,
                              transitionType: e.target.value as any,
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    >
                      <option value="kenburns-crossfade">Ken Burns + Crossfade (Sinematik)</option>
                      <option value="crossfade">Crossfade (Yumuşak Geçiş)</option>
                      <option value="fade-zoom">Fade + Zoom (Dinamik)</option>
                      <option value="soft-slide">Soft Slide (Yatay Kayma)</option>
                      <option value="minimal-fade">Minimal Fade</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">
                      Otomatik Slayt Süresi ({localData.settings?.sliderSettings?.autoplayDuration || 5000} ms)
                    </label>
                    <input
                      type="range"
                      min="3000"
                      max="10000"
                      step="500"
                      value={localData.settings?.sliderSettings?.autoplayDuration || 5000}
                      onChange={(e) => {
                        setLocalData({
                          ...localData,
                          settings: {
                            ...localData.settings,
                            sliderSettings: {
                              ...localData.settings.sliderSettings,
                              autoplayDuration: Number(e.target.value),
                            },
                          },
                        });
                      }}
                      className="w-full accent-[#ff5a1f]"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localData.settings?.sliderSettings?.pauseOnHover ?? true}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              sliderSettings: {
                                ...localData.settings.sliderSettings,
                                pauseOnHover: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="rounded accent-[#ff5a1f]"
                      />
                      <span>Fare üzerindeyken duraklat</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Slides List */}
              <div className="space-y-4">
                {(localData.heroSlides || []).map((slide, index) => (
                  <div
                    key={slide.id}
                    className="p-5 rounded-2xl bg-[#151520] border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs font-bold text-[#ff5a1f]">Slayt #{index + 1}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAutoTranslateSlide(slide)}
                          disabled={translatingId === slide.id}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-amber-400 flex items-center gap-1 cursor-pointer"
                          title="Bu slaydı AI ile İngilizceye çevir"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{translatingId === slide.id ? 'Çevriliyor...' : 'İngilizceye Çevir'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (localData.heroSlides || []).filter((s) => s.id !== slide.id);
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Başlık (Türkçe)</label>
                        <input
                          type="text"
                          value={slide.title}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, title: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Başlık (English)</label>
                        <input
                          type="text"
                          value={slide.title_en || ''}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, title_en: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          placeholder="English title..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Açıklama (Türkçe)</label>
                        <textarea
                          rows={2}
                          value={slide.subtitle}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, subtitle: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs resize-none"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Açıklama (English)</label>
                        <textarea
                          rows={2}
                          value={slide.subtitle_en || ''}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, subtitle_en: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          placeholder="English description..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs resize-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Görsel URL (1200x400)</label>
                        <input
                          type="text"
                          value={slide.imageUrl}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, imageUrl: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Buton Metni (TR / EN)</label>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            value={slide.buttonText}
                            onChange={(e) => {
                              const updated = (localData.heroSlides || []).map((s) =>
                                s.id === slide.id ? { ...s, buttonText: e.target.value } : s
                              );
                              setLocalData({ ...localData, heroSlides: updated });
                            }}
                            placeholder="Detaylar"
                            className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                          <input
                            type="text"
                            value={slide.buttonText_en || ''}
                            onChange={(e) => {
                              const updated = (localData.heroSlides || []).map((s) =>
                                s.id === slide.id ? { ...s, buttonText_en: e.target.value } : s
                              );
                              setLocalData({ ...localData, heroSlides: updated });
                            }}
                            placeholder="Details"
                            className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Buton Linki</label>
                        <input
                          type="text"
                          value={slide.buttonLink}
                          onChange={(e) => {
                            const updated = (localData.heroSlides || []).map((s) =>
                              s.id === slide.id ? { ...s, buttonLink: e.target.value } : s
                            );
                            setLocalData({ ...localData, heroSlides: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: EVENTS & TICKETS */}
          {activeTab === 'events' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Etkinlik Takvimi &amp; Biletler</h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Takvim sayfa açılışında istisnasız <strong>HAFTALIK</strong> görünümde başlar. Temsil ve bilet durumlarını yönetin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date();
                    const pad = (n: number) => String(n).padStart(2, '0');
                    const dateStr = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate() + 3)}`;
                    const newEvent: EventItem = {
                      id: `ev_${Date.now()}`,
                      title: 'Yeni Tiyatro Oyunu',
                      title_en: 'New Theater Performance',
                      category: 'Tiyatro',
                      category_en: 'Theater',
                      date: dateStr,
                      time: '20:30',
                      venue: 'Moda Sahnesi',
                      venue_en: 'Moda Sahnesi, Istanbul',
                      address: 'Kadıköy, İstanbul',
                      address_en: 'Kadikoy, Istanbul',
                      description: 'Oyun açıklaması...',
                      description_en: 'Play synopsis...',
                      imageUrl: '/images/event_poster_1.svg',
                      ticketUrl: 'https://biletinial.com',
                      ticketStatus: 'available',
                      price: '₺400',
                      published: true,
                    };
                    setLocalData({
                      ...localData,
                      events: [newEvent, ...(localData.events || [])],
                    });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-[#ff5a1f] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Yeni Etkinlik Ekle</span>
                </button>
              </div>

              <div className="space-y-4">
                {(localData.events || []).map((ev) => (
                  <div
                    key={ev.id}
                    className="p-5 rounded-2xl bg-[#151520] border border-white/10 space-y-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/5 pb-3">
                      <span className="text-xs font-bold text-[#ff5a1f]">
                        {ev.category} · {ev.date} · {ev.time}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleAutoTranslateEvent(ev)}
                          disabled={translatingId === ev.id}
                          className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-xs text-amber-400 flex items-center gap-1 cursor-pointer"
                          title="Bu oyunu AI ile İngilizceye çevir"
                        >
                          <Sparkles className="w-3 h-3" />
                          <span>{translatingId === ev.id ? 'Çevriliyor...' : 'İngilizceye Çevir'}</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (localData.events || []).filter((e) => e.id !== ev.id);
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Oyun Adı (Türkçe)</label>
                        <input
                          type="text"
                          value={ev.title}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, title: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Oyun Adı (English)</label>
                        <input
                          type="text"
                          value={ev.title_en || ''}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, title_en: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          placeholder="Title in English..."
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Tarih</label>
                        <input
                          type="date"
                          value={ev.date}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, date: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Saat</label>
                        <input
                          type="time"
                          value={ev.time}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, time: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Mekân</label>
                        <input
                          type="text"
                          value={ev.venue}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, venue: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Fiyat</label>
                        <input
                          type="text"
                          value={ev.price || ''}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, price: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          placeholder="₺450"
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Bilet Durumu</label>
                        <select
                          value={ev.ticketStatus}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, ticketStatus: e.target.value as any } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        >
                          <option value="available">Biletler Satışta (Available)</option>
                          <option value="sold_out">Tükendi (Sold Out)</option>
                          <option value="free">Ücretsiz (Free)</option>
                          <option value="soon">Yakında Satışta (Coming Soon)</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[11px] text-gray-400 block mb-1">Bilet Satış Bağlantısı</label>
                        <input
                          type="url"
                          value={ev.ticketUrl}
                          onChange={(e) => {
                            const updated = (localData.events || []).map((item) =>
                              item.id === ev.id ? { ...item, ticketUrl: e.target.value } : item
                            );
                            setLocalData({ ...localData, events: updated });
                          }}
                          className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: INSTAGRAM AKIŞI */}
          {activeTab === 'instagram' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Instagram className="w-5 h-5 text-[#e1306c]" />
                    <span>Instagram Akışı &amp; Hesap Entegrasyonu</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Öne Çıkanlar bölümünün hemen altında yer alan yatay Instagram akışını yönetin.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncInstagram}
                    disabled={isSyncingInstagram}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSyncingInstagram ? 'animate-spin' : ''}`} />
                    <span>{isSyncingInstagram ? 'Senkronize Ediliyor...' : 'Otomatik Senkronize Et'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const newPost: InstagramPost = {
                        id: `ig_${Date.now()}`,
                        mediaUrl: '/images/instagram_post_1.svg',
                        permalink: 'https://instagram.com/ismailsemihhabibogullari',
                        caption: 'Yeni prova gününden sahne arkası notları.',
                        caption_en: 'Behind-the-scenes rehearsal notes.',
                        mediaType: 'IMAGE',
                        timestamp: 'Yeni',
                        likesCount: 1250,
                        commentsCount: 34,
                        order: (localData.instagramPosts?.length || 0) + 1,
                        published: true,
                      };
                      setLocalData({
                        ...localData,
                        instagramPosts: [newPost, ...(localData.instagramPosts || [])],
                      });
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#ff5a1f] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Yeni Gönderi Ekle</span>
                  </button>
                </div>
              </div>

              {instagramSyncResult && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs text-amber-300">
                  {instagramSyncResult}
                </div>
              )}

              {/* Instagram Settings Panel */}
              <div className="p-5 rounded-2xl bg-[#151520] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                  Instagram Hesap &amp; Görüntüleme Ayarları
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Kullanıcı Adı</label>
                    <input
                      type="text"
                      value={localData.settings?.instagramSettings?.username || 'ismailsemihhabibogullari'}
                      onChange={(e) => {
                        setLocalData({
                          ...localData,
                          settings: {
                            ...localData.settings,
                            instagramSettings: {
                              ...localData.settings.instagramSettings,
                              username: e.target.value,
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div className="flex items-center pt-4">
                    <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localData.settings?.instagramSettings?.showLikes ?? true}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              instagramSettings: {
                                ...localData.settings.instagramSettings,
                                showLikes: e.target.checked,
                              },
                            },
                          });
                        }}
                        className="rounded accent-[#ff5a1f]"
                      />
                      <span>Beğeni &amp; Yorum Sayılarını Göster</span>
                    </label>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Masaüstü Gösterim Adedi</label>
                    <select
                      value={localData.settings?.instagramSettings?.postCountDesktop || 5}
                      onChange={(e) => {
                        setLocalData({
                          ...localData,
                          settings: {
                            ...localData.settings,
                            instagramSettings: {
                              ...localData.settings.instagramSettings,
                              postCountDesktop: Number(e.target.value),
                            },
                          },
                        });
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    >
                      <option value={4}>4 Kart</option>
                      <option value={5}>5 Kart (Varsayılan)</option>
                      <option value={6}>6 Kart</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Instagram Posts Grid */}
              <div className="space-y-4">
                {(localData.instagramPosts || []).map((post, idx) => (
                  <div
                    key={post.id}
                    className="p-4 rounded-xl bg-[#151520] border border-white/10 flex flex-col sm:flex-row gap-4 items-start"
                  >
                    <img
                      src={post.mediaUrl}
                      alt={post.caption}
                      className="w-24 h-24 object-cover rounded-xl shrink-0 bg-black"
                    />
                    <div className="flex-1 space-y-3 w-full">
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-xs font-bold text-[#ff5a1f]">Gönderi #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (localData.instagramPosts || []).filter((p) => p.id !== post.id);
                            setLocalData({ ...localData, instagramPosts: updated });
                          }}
                          className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Sil</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Açıklama (TR)</label>
                          <input
                            type="text"
                            value={post.caption}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, caption: e.target.value } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Açıklama (EN)</label>
                          <input
                            type="text"
                            value={post.caption_en || ''}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, caption_en: e.target.value } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            placeholder="English caption..."
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Görsel URL</label>
                          <input
                            type="text"
                            value={post.mediaUrl}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, mediaUrl: e.target.value } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Tür</label>
                          <select
                            value={post.mediaType}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, mediaType: e.target.value as any } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          >
                            <option value="IMAGE">Fotoğraf</option>
                            <option value="VIDEO">Reels / Video</option>
                            <option value="CAROUSEL_ALBUM">Albüm (Carousel)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Beğeni Sayısı</label>
                          <input
                            type="number"
                            value={post.likesCount || 0}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, likesCount: Number(e.target.value) } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-400 block mb-1">Yayın Durumu</label>
                          <select
                            value={post.published ? 'true' : 'false'}
                            onChange={(e) => {
                              const updated = (localData.instagramPosts || []).map((p) =>
                                p.id === post.id ? { ...p, published: e.target.value === 'true' } : p
                              );
                              setLocalData({ ...localData, instagramPosts: updated });
                            }}
                            className="w-full px-3 py-1.5 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                          >
                            <option value="true">Yayında</option>
                            <option value="false">Gizli</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: TYPOGRAPHY STUDIO */}
          {activeTab === 'typography' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Type className="w-5 h-5 text-[#ff5a1f]" />
                    <span>Tipografi &amp; Font Stüdyosu</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Google Fonts koleksiyonundan başlık ve gövde fontlarını seçin, Türkçe karakterleri canlı test edin.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLocalData({
                      ...localData,
                      settings: {
                        ...localData.settings,
                        typography: {
                          headingFont: 'Space Grotesk',
                          bodyFont: 'Inter',
                          monoFont: 'JetBrains Mono',
                          baseSize: '16px',
                          headingWeight: '700',
                          bodyWeight: '400',
                          letterSpacing: '-0.02em',
                        },
                      },
                    });
                    setStatusMessage({ type: 'success', text: 'Fontlar varsayılana sıfırlandı.' });
                  }}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-gray-200 text-xs font-medium cursor-pointer"
                >
                  Varsayılana Sıfırla
                </button>
              </div>

              {/* Live Turkish Glyph Test Card */}
              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 space-y-3">
                <span className="text-[10px] font-bold text-[#ff5a1f] uppercase tracking-wider block">
                  CANLI TÜRKÇE KARAKTER TEST ÖNİZLEMESİ
                </span>
                <div
                  style={{
                    fontFamily: `"${localData.settings?.typography?.headingFont || 'Space Grotesk'}", sans-serif`,
                  }}
                  className="text-2xl sm:text-3xl font-bold text-white tracking-tight"
                >
                  İsmail Semih Habiboğulları — Tiyatro &amp; Sanat
                </div>
                <div className="text-sm text-gray-300 font-mono">
                  Türkçe Glifler: ğ · ü · ş · ı · ö · ç · İ · Ğ · Ü · Ş · Ö · Ç
                </div>
              </div>

              {/* Font Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-6 rounded-2xl bg-[#151520] border border-white/10">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">
                    Başlık Fontu (Headings)
                  </label>
                  <select
                    value={localData.settings?.typography?.headingFont || 'Space Grotesk'}
                    onChange={(e) => {
                      setLocalData({
                        ...localData,
                        settings: {
                          ...localData.settings,
                          typography: {
                            ...localData.settings.typography,
                            headingFont: e.target.value,
                          },
                        },
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white text-xs"
                  >
                    <option value="Space Grotesk">Space Grotesk (Varsayılan - Sinematik)</option>
                    <option value="Playfair Display">Playfair Display (Klasik Sahne &amp; Tiyatro)</option>
                    <option value="Cinzel">Cinzel (Dramatik &amp; Heybetli)</option>
                    <option value="Montserrat">Montserrat (Çağdaş &amp; Güçlü)</option>
                    <option value="Outfit">Outfit (Minimalist &amp; Modern)</option>
                    <option value="Syne">Syne (Özgün Sanatçı Tarzı)</option>
                    <option value="Inter">Inter (Temiz &amp; Nötr)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">
                    Gövde Metin Fontu (Body Text)
                  </label>
                  <select
                    value={localData.settings?.typography?.bodyFont || 'Inter'}
                    onChange={(e) => {
                      setLocalData({
                        ...localData,
                        settings: {
                          ...localData.settings,
                          typography: {
                            ...localData.settings.typography,
                            bodyFont: e.target.value,
                          },
                        },
                      });
                    }}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white text-xs"
                  >
                    <option value="Inter">Inter (Varsayılan - Yüksek Okunabilirlik)</option>
                    <option value="Roboto">Roboto (Temiz &amp; Standart)</option>
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="JetBrains Mono">JetBrains Mono (Monospace)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: THEME & COLOR PALETTES */}
          {activeTab === 'theme' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Palette className="w-5 h-5 text-[#ff5a1f]" />
                    <span>Renkler &amp; Çift Tema Stüdyosu</span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    Karanlık (Dark) ve Aydınlık (Light) tema renk paletlerini özelleştirin.
                  </p>
                </div>
              </div>

              {/* Dark Theme Colors */}
              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#ff5a1f]" />
                  <span>Karanlık Tema Paleti (Dark Mode)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Ana Arka Plan</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.darkTheme?.bgPrimary || '#0b0b0f'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              darkTheme: { ...localData.settings.darkTheme, bgPrimary: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.darkTheme?.bgPrimary || '#0b0b0f'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Vurgu Rengi (Accent)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.darkTheme?.accentColor || '#ff5a1f'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              darkTheme: { ...localData.settings.darkTheme, accentColor: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.darkTheme?.accentColor || '#ff5a1f'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Panel Rengi</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.darkTheme?.panelBg || '#151520'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              darkTheme: { ...localData.settings.darkTheme, panelBg: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.darkTheme?.panelBg || '#151520'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Light Theme Colors */}
              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 space-y-4">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-white" />
                  <span>Aydınlık Tema Paleti (Light Mode)</span>
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Ana Arka Plan</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.lightTheme?.bgPrimary || '#f8f8fa'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              lightTheme: { ...localData.settings.lightTheme, bgPrimary: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.lightTheme?.bgPrimary || '#f8f8fa'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Metin Rengi</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.lightTheme?.textPrimary || '#0f172a'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              lightTheme: { ...localData.settings.lightTheme, textPrimary: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.lightTheme?.textPrimary || '#0f172a'}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400 block mb-1">Panel &amp; Kart</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={localData.settings?.lightTheme?.panelBg || '#ffffff'}
                        onChange={(e) => {
                          setLocalData({
                            ...localData,
                            settings: {
                              ...localData.settings,
                              lightTheme: { ...localData.settings.lightTheme, panelBg: e.target.value },
                            },
                          });
                        }}
                        className="w-8 h-8 rounded border-0 cursor-pointer"
                      />
                      <span className="text-xs font-mono text-gray-300">
                        {localData.settings?.lightTheme?.panelBg || '#ffffff'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: OPENAI & AI SETTINGS */}
          {activeTab === 'ai_settings' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Bot className="w-5 h-5 text-[#ff5a1f]" />
                  <span>OpenAI &amp; Yapay Zekâ Asistan Ayarları</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Doğal dil asistanı ve otomatik çeviriler için OpenAI ChatGPT API entegrasyonu.
                </p>
              </div>

              {aiTestResult && (
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs">
                  {aiTestResult}
                </div>
              )}

              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 space-y-6">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-2">
                    OpenAI API Anahtarı (sk-...)
                  </label>
                  <input
                    type="password"
                    placeholder="sk-proj-..."
                    value={aiConfig.openaiApiKey || ''}
                    onChange={(e) => setAiConfig({ ...aiConfig, openaiApiKey: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white text-xs font-mono"
                  />
                  <span className="text-[11px] text-gray-400 mt-1 block">
                    Anahtarınız sunucu tarafında güvenli olarak `/data/ai-config.json` içinde saklanır.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">Model</label>
                    <select
                      value={aiConfig.model || 'gpt-4o'}
                      onChange={(e) => setAiConfig({ ...aiConfig, model: e.target.value })}
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    >
                      <option value="gpt-4o">GPT-4o (Önerilen - Üstün Zekâ &amp; Hızlı)</option>
                      <option value="gpt-4o-mini">GPT-4o Mini (Hafif &amp; Ekonomik)</option>
                      <option value="gpt-4-turbo">GPT-4 Turbo</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Günlük Bütçe Limiti (${aiConfig.costLimitDaily || 5})
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      value={aiConfig.costLimitDaily || 5}
                      onChange={(e) =>
                        setAiConfig({ ...aiConfig, costLimitDaily: Number(e.target.value) })
                      }
                      className="w-full accent-[#ff5a1f]"
                    />
                  </div>
                </div>

                {/* Capabilities toggles */}
                <div className="pt-4 border-t border-white/10 space-y-3">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Aktif Yetenekler
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={aiConfig.enabledCapabilities?.designAssistant ?? true}
                        onChange={(e) =>
                          setAiConfig({
                            ...aiConfig,
                            enabledCapabilities: {
                              ...aiConfig.enabledCapabilities,
                              designAssistant: e.target.checked,
                            },
                          })
                        }
                        className="rounded accent-[#ff5a1f]"
                      />
                      <span>Tasarım &amp; Font Asistanı</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer text-gray-300">
                      <input
                        type="checkbox"
                        checked={aiConfig.enabledCapabilities?.translationAssistant ?? true}
                        onChange={(e) =>
                          setAiConfig({
                            ...aiConfig,
                            enabledCapabilities: {
                              ...aiConfig.enabledCapabilities,
                              translationAssistant: e.target.checked,
                            },
                          })
                        }
                        className="rounded accent-[#ff5a1f]"
                      />
                      <span>İki Dilli Çeviri Asistanı (TR → EN)</span>
                    </label>
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={handleSaveAiConfig}
                    disabled={isSavingAiConfig}
                    className="px-5 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    {isSavingAiConfig ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    <span>OpenAI Ayarlarını Kaydet</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 9: BILINGUAL OVERVIEW */}
          {activeTab === 'bilingual' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Languages className="w-5 h-5 text-[#ff5a1f]" />
                  <span>Çift Dilli İçerik Yönetimi (TR / EN)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  Web sitesi Türkçe ve İngilizce dillerini destekler. Çeviri kapsamını inceleyin.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400">Etkinlikler</span>
                  <div className="text-lg font-bold text-white mt-1">
                    {localData.events?.filter((e) => e.title_en).length} / {localData.events?.length}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">İngilizce Başlık Var</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400">Afiş Slaytları</span>
                  <div className="text-lg font-bold text-white mt-1">
                    {localData.heroSlides?.filter((s) => s.title_en).length} / {localData.heroSlides?.length}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">İngilizce Başlık Var</span>
                </div>
                <div className="p-5 rounded-2xl bg-[#151520] border border-white/5">
                  <span className="text-xs text-gray-400">Instagram Gönderileri</span>
                  <div className="text-lg font-bold text-white mt-1">
                    {localData.instagramPosts?.filter((p) => p.caption_en).length} / {localData.instagramPosts?.length}
                  </div>
                  <span className="text-[11px] text-emerald-400 mt-1 block">İngilizce Açıklama Var</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 10: BRAND & LOGO */}
          {activeTab === 'brand' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Logo &amp; Marka Kimliği</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Logo genişliği, sosyal medya bağlantıları ve biyografi özetini düzenleyin.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#151520] border border-white/10 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Site Başlığı (TR)
                    </label>
                    <input
                      type="text"
                      value={localData.settings?.siteTitle || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData,
                          settings: { ...localData.settings, siteTitle: e.target.value },
                        })
                      }
                      className="w-full px-4 py-2.5 rounded-xl bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">
                      Logo Genişliği ({localData.settings?.logoWidth || 260}px)
                    </label>
                    <input
                      type="range"
                      min="180"
                      max="400"
                      step="10"
                      value={localData.settings?.logoWidth || 260}
                      onChange={(e) =>
                        setLocalData({
                          ...localData,
                          settings: { ...localData.settings, logoWidth: Number(e.target.value) },
                        })
                      }
                      className="w-full accent-[#ff5a1f]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">E-posta</label>
                    <input
                      type="email"
                      value={localData.settings?.contactEmail || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData,
                          settings: { ...localData.settings, contactEmail: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">Telefon</label>
                    <input
                      type="text"
                      value={localData.settings?.contactPhone || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData,
                          settings: { ...localData.settings, contactPhone: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-300 block mb-2">Adres</label>
                    <input
                      type="text"
                      value={localData.settings?.address || ''}
                      onChange={(e) =>
                        setLocalData({
                          ...localData,
                          settings: { ...localData.settings, address: e.target.value },
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 11: MESSAGES & SUBSCRIBERS */}
          {activeTab === 'messages' && (
            <div className="space-y-8">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Gelen İletişim Mesajları</h3>
                <p className="text-xs text-gray-400 mb-4">
                  Ziyaretçilerin web sitesi iletişim formundan gönderdiği mesajlar.
                </p>

                {messagesList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#151520] border border-white/5 text-center text-xs text-gray-400">
                    Henüz gelen bir iletişim mesajı bulunmuyor.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messagesList.map((msg) => (
                      <div
                        key={msg.id}
                        className={`p-5 rounded-2xl border transition-all ${
                          msg.read ? 'bg-[#151520]/70 border-white/5' : 'bg-[#151520] border-[#ff5a1f]/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-2">
                          <div className="flex items-center gap-2">
                            <strong className="text-sm text-white">{msg.name}</strong>
                            <span className="text-xs text-gray-400">({msg.email})</span>
                          </div>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {new Date(msg.date).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <div className="text-xs font-semibold text-[#ff8c42] mb-1">
                          Konu: {msg.subject}
                        </div>
                        <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">
                          {msg.message}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Newsletter subscribers */}
              <div className="pt-6 border-t border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-base font-bold text-white">E-posta Bülteni Aboneleri</h3>
                    <p className="text-xs text-gray-400">
                      Toplam {subscribersList.length} kayıtlı e-posta abonesi.
                    </p>
                  </div>
                  <a
                    href="/api/newsletter/export"
                    download
                    className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV İndir</span>
                  </a>
                </div>

                {subscribersList.length === 0 ? (
                  <div className="p-8 rounded-xl bg-[#151520] border border-white/5 text-center text-xs text-gray-400">
                    Henüz bülten abonesi bulunmuyor.
                  </div>
                ) : (
                  <div className="rounded-xl bg-[#151520] border border-white/10 overflow-hidden text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-[#0b0b0f] text-gray-400 border-b border-white/5">
                        <tr>
                          <th className="p-3">E-posta</th>
                          <th className="p-3">Kayıt Tarihi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {subscribersList.map((sub) => (
                          <tr key={sub.id} className="text-gray-300">
                            <td className="p-3 font-medium text-white">{sub.email}</td>
                            <td className="p-3 text-gray-400 font-mono">
                              {new Date(sub.date).toLocaleDateString('tr-TR')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 12: VERSIONS & BACKUP */}
          {activeTab === 'versions' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-white">Sürümler &amp; Yedekleme Noktaları</h3>
                <p className="text-xs text-gray-400 mt-1">
                  Her "Canlıya Yayınla" işleminde sistem otomatik sürüm snapshot'ı alır.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <a
                  href="/api/site/export"
                  download
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold flex items-center gap-2"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tüm Site Verilerini JSON İndir</span>
                </a>
              </div>

              {/* Backups List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                  Otomatik Sürüm Kayıtları
                </h4>
                {backupsList.length === 0 ? (
                  <div className="p-6 rounded-xl bg-[#151520] border border-white/5 text-center text-xs text-gray-400">
                    Henüz kaydedilmiş bir sürüm yedeği bulunmuyor.
                  </div>
                ) : (
                  backupsList.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-xl bg-[#151520] border border-white/10 flex items-center justify-between gap-4"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-[#ff5a1f]">
                            Sürüm v{bk.versionNumber}
                          </span>
                          <span className="text-xs text-gray-400 font-mono">
                            {bk.timestamp ? new Date(bk.timestamp).toLocaleString('tr-TR') : ''}
                          </span>
                        </div>
                        <p className="text-xs text-gray-300 mt-0.5">{bk.note}</p>
                      </div>

                      <button
                        type="button"
                        onClick={async () => {
                          if (confirm(`v${bk.versionNumber} sürümüne geri dönmek istediğinize emin misiniz?`)) {
                            const res = await restoreBackup(bk.id);
                            if (res.success) {
                              setStatusMessage({ type: 'success', text: res.message || 'Sürüm geri yüklendi.' });
                            }
                          }
                        }}
                        className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-gray-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Bu Sürüme Dön</span>
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* AI Assistant Drawer Component */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        onProposalApplied={() => {
          refreshData();
          setStatusMessage({ type: 'success', text: 'Yapay zekâ önerisi başarıyla uygulandı.' });
        }}
      />

      {/* Publish Confirmation Modal */}
      {showPublishModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#151520] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center gap-2 text-[#ff5a1f] mb-3">
              <Globe className="w-5 h-5" />
              <h3 className="text-base font-bold text-white">Canlıya Yayınla</h3>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed mb-4">
              Yapılan tüm taslak değişiklikleri canlı web sitesine aktarılacak ve önceki sürüm otomatik olarak yedeklenecektir. Onaylıyor musunuz?
            </p>

            <div className="mb-5">
              <label className="text-[11px] text-gray-400 block mb-1">
                Sürüm Açıklaması / Değişiklik Notu (Opsiyonel)
              </label>
              <input
                type="text"
                placeholder="Örn: Yeni tiyatro sezonu tarihleri güncellendi"
                value={publishNote}
                onChange={(e) => setPublishNote(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#0b0b0f] border border-white/10 text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#ff5a1f]"
              />
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowPublishModal(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-300 text-xs font-medium hover:bg-white/15 cursor-pointer"
              >
                İptal
              </button>
              <button
                type="button"
                onClick={handlePublishConfirm}
                disabled={isPublishing}
                className="px-5 py-2 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>Yayınlamayı Onayla</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
