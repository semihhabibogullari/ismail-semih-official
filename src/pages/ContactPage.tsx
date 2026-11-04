/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, CheckCircle2, AlertCircle, Loader2, MessageSquare } from 'lucide-react';
import { useSite } from '../context/SiteContext';

export const ContactPage: React.FC = () => {
  const { data } = useSite();
  const settings = data.settings;
  const [searchParams] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Pre-fill subject if navigated with ?egitim=...
  useEffect(() => {
    const egitimParam = searchParams.get('egitim');
    if (egitimParam) {
      setSubject(`Eğitim Başvurusu: ${egitimParam}`);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!name.trim() || !email.trim() || !message.trim()) {
      setError('Lütfen ad, e-posta ve mesaj alanlarını eksiksiz doldurunuz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccess(json.message || 'Mesajınız başarıyla iletildi. En kısa sürede dönüş yapılacaktır.');
        setName('');
        setEmail('');
        setSubject('');
        setMessage('');
      } else {
        setError(json.error || 'Mesaj gönderilemedi. Lütfen tekrar deneyiniz.');
      }
    } catch (err: any) {
      setError('Sunucu bağlantı hatası. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full py-12">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Page Hero */}
        <div className="max-w-3xl mb-12">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wider text-[#ff5a1f] mb-2">
            <MessageSquare className="w-4 h-4" />
            <span>İLETİŞİM & MENAJERLİK</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-bold text-white tracking-tight mb-4">
            İletişim
          </h1>
          <p className="text-gray-300 text-sm sm:text-base leading-relaxed">
            Tiyatro projeleri, reji işbirlikleri, podcast konukluğu, kurumsal atölyeler ve basın talepleri
            için formu doldurabilir ya da doğrudan iletişim kanallarından ulaşabilirsiniz.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left: Contact Info (5 Cols) */}
          <div className="lg:col-span-5 space-y-8">
            <div className="p-8 rounded-2xl bg-[#121218] border border-white/10 space-y-6 shadow-xl">
              <h2 className="text-lg font-bold text-white border-b border-white/10 pb-3">
                Doğrudan İletişim Bilgileri
              </h2>

              <div className="space-y-5 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#151520] border border-white/10 flex items-center justify-center text-[#ff5a1f] shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">E-posta Adresi</span>
                    <a
                      href={`mailto:${settings?.contactEmail || 'semihhabibogullari@gmail.com'}`}
                      className="text-white hover:text-[#ff5a1f] font-medium transition-colors"
                    >
                      {settings?.contactEmail || 'semihhabibogullari@gmail.com'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#151520] border border-white/10 flex items-center justify-center text-[#ff5a1f] shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Telefon / Menajerlik</span>
                    <a
                      href={`tel:${settings?.contactPhone || '+902125550192'}`}
                      className="text-white hover:text-[#ff5a1f] font-medium transition-colors"
                    >
                      {settings?.contactPhone || '+90 (212) 555 0192'}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#151520] border border-white/10 flex items-center justify-center text-[#ff5a1f] shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-gray-400 block mb-0.5">Stüdyo & Çalışma Alanı</span>
                    <span className="text-white font-medium block">
                      {settings?.address || 'Moda & Kadıköy, İstanbul / Türkiye'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Response time commitment card */}
            <div className="p-6 rounded-2xl bg-[#151520]/80 border border-white/5 text-xs text-gray-400 leading-relaxed">
              <strong className="text-gray-200 block mb-1">Geri Dönüş Süresi</strong>
              İletilen tüm mesajlar menajerlik ekibimiz ve sanatçı tarafından doğrudan incelenmekte olup, en geç 48 saat içerisinde geri bildirim sağlanmaktadır.
            </div>
          </div>

          {/* Right: Functional Form (7 Cols) */}
          <div className="lg:col-span-7">
            <div className="p-8 sm:p-10 rounded-2xl bg-[#121218] border border-white/10 shadow-2xl">
              <h2 className="text-xl font-bold text-white mb-6">Mesaj Gönderin</h2>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      Adınız Soyadınız *
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ad Soyad"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-300 mb-2">
                      E-posta Adresiniz *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ornek@alan.com"
                      required
                      disabled={isLoading}
                      className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Konu Başlığı
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Örn: Tiyatro Projesi / Podcast / Atölye Başvurusu"
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-300 mb-2">
                    Mesajınız *
                  </label>
                  <textarea
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Proje detaylarınızı veya iletmek istediklerinizi yazınız..."
                    required
                    disabled={isLoading}
                    className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/10 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] resize-none"
                  />
                </div>

                {success && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-400 text-xs">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>{success}</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>İletiliyor...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Mesajı Gönder</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
