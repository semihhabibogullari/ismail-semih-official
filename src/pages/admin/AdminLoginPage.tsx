/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { Logo } from '../../components/common/Logo';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useSite();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already authenticated, redirect to /admin
  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/admin');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!password) {
      setError('Lütfen yönetici parolasını giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(password);
      if (result.success) {
        navigate('/admin');
      } else {
        setError(result.error || 'Giriş başarısız. Parolanızı kontrol ediniz.');
      }
    } catch (err: any) {
      setError('Bağlantı hatası oluştu.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center py-16 px-4">
      <div className="max-w-md w-full">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Logo customWidth={240} />
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff5a1f]/15 border border-[#ff5a1f]/30 text-xs font-semibold text-[#ff8c42] mb-2">
            <Lock className="w-3.5 h-3.5" />
            <span>YÖNETİCİ KONTROL PANELİ</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Yönetim Paneli Girişi
          </h1>
          <p className="text-xs text-gray-400 mt-1">
            Site içeriğini, takvimi, podcastleri ve ayarları düzenlemek için giriş yapınız.
          </p>
        </div>

        {/* Login Form Box */}
        <div className="p-8 rounded-2xl bg-[#121218] border border-white/10 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-300 mb-2">
                Yönetici Parolası
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                autoFocus
                disabled={isLoading}
                className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]"
              />
              <span className="text-[11px] text-gray-500 block mt-1.5">
                Yönetici parolanız kurulum sırasında güvenli olarak belirlenir.
              </span>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-950/40 border border-red-800/40 text-red-400 text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-xl bg-[#ff5a1f] hover:bg-[#ff733b] text-white text-sm font-semibold transition-all shadow-lg shadow-[#ff5a1f]/20 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Doğrulanıyor...</span>
                </>
              ) : (
                <>
                  <span>Panele Giriş Yap</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-white/5 text-center">
            <Link to="/" className="text-xs text-gray-400 hover:text-white transition-colors">
              ← Web Sitesine Geri Dön
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
