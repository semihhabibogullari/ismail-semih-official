/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

export const NewsletterSection: React.FC = () => {
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email || !email.includes('@')) {
      setErrorMessage('Lütfen geçerli bir e-posta adresi giriniz.');
      return;
    }

    if (!consent) {
      setErrorMessage('Lütfen bilgilendirme ve KVKK onay kutusunu işaretleyiniz.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, consent }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSuccessMessage(json.message || 'Bültene kaydınız başarıyla tamamlandı!');
        setEmail('');
        setConsent(false);
      } else {
        setErrorMessage(json.error || 'Kayıt sırasında bir sorun oluştu.');
      }
    } catch (err: any) {
      setErrorMessage('Bağlantı hatası. Lütfen daha sonra tekrar deneyiniz.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section id="bulten" className="w-full py-16" aria-label="E-posta Bülteni">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative rounded-3xl bg-gradient-to-br from-[#151520] via-[#121218] to-[#0b0b0f] border border-white/10 p-8 sm:p-12 lg:p-16 shadow-2xl overflow-hidden">
          {/* Subtle amber ambient glow in corner */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#ff5a1f]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#ff5a1f]/15 border border-[#ff5a1f]/30 text-xs font-semibold text-[#ff8c42] mb-4">
              <Mail className="w-3.5 h-3.5" />
              <span>SANATÇI BÜLTENİ</span>
            </div>

            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
              Sahneden ve Stüdyodan İlk Siz Haberdar Olun
            </h2>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-8">
              Yeni sezon tiyatro biletleri satışa çıktığında, podcast bölümleri yayınlandığında ve
              atölye kayıtları açıldığında doğrudan e-posta kutunuza bilgi gelsin.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-posta adresinizi yazınız..."
                  disabled={isLoading}
                  className="flex-1 px-5 py-3.5 rounded-xl bg-[#0b0b0f] border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] focus:border-transparent transition-all disabled:opacity-50"
                  required
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-7 py-3.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/25 disabled:opacity-50 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Kaydediliyor...</span>
                    </>
                  ) : (
                    <span>Bültene Abone Ol</span>
                  )}
                </button>
              </div>

              {/* KVKK / Consent Checkbox */}
              <div className="flex items-start justify-center gap-2 text-xs text-gray-400 text-left pt-1">
                <input
                  type="checkbox"
                  id="newsletterConsent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-0.5 rounded border-white/20 bg-[#0b0b0f] text-[#ff5a1f] focus:ring-[#ff5a1f] cursor-pointer"
                />
                <label htmlFor="newsletterConsent" className="cursor-pointer select-none">
                  Kişisel Verilerin Korunması Kanunu (KVKK) kapsamında e-posta adresimin bülten ve
                  etkinlik duyuruları için işlenmesini kabul ediyorum.
                </label>
              </div>

              {/* Status feedback */}
              {successMessage && (
                <div className="flex items-center justify-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMessage}</span>
                </div>
              )}

              {errorMessage && (
                <div className="flex items-center justify-center gap-2 text-xs text-red-400 bg-red-950/40 border border-red-800/40 p-3 rounded-xl">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
