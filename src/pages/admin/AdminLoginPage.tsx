/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, ArrowRight, AlertCircle, Loader2, KeyRound, ExternalLink } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import { Logo } from '../../components/common/Logo';

export const AdminLoginPage: React.FC = () => {
  const { login, isAuthenticated } = useSite();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
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

    if (!username.trim() || !password) {
      setError('Kullanıcı adı ve şifrenizi giriniz.');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(username.trim(), password);
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
              <label htmlFor="admin-username" className="block text-xs font-semibold text-gray-300 mb-2">Kullanıcı Adı</label>
              <input id="admin-username" type="text" autoComplete="username" autoCapitalize="none"
                value={username} onChange={e=>setUsername(e.target.value)} placeholder="Kullanıcı adınızı girin"
                autoFocus disabled={isLoading} required
                className="w-full px-4 py-3 rounded-xl bg-[#0b0b0f] border border-white/15 text-white placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]" />
            </div>
            <div>
              <label htmlFor="admin-password" className="block text-xs font-semibold text-gray-300 mb-2">
                Şifre
              </label>
              <input
                id="admin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                disabled={isLoading}
                required
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
            <details className="rounded-xl border border-white/10 bg-[#0b0b0f]/70 p-4 text-gray-300 group">
              <summary className="cursor-pointer select-none flex items-center gap-2 text-xs font-semibold hover:text-white focus-visible:outline-[#ff5a1f]">
                <KeyRound className="w-4 h-4 text-[#ff8c42]" />
                Kullanıcı adını veya şifreni hatırlamıyor musun?
              </summary>
              <div className="mt-3 space-y-2 text-xs leading-relaxed text-gray-400">
                <p>Kullanıcı adı: <strong className="text-gray-200">ismailsemih</strong> (sunucuda değiştirilmediyse).</p>
                <p>Şifre otomatik olarak siteye yazılmaz. GitHub Codespaces'te <strong>ADMIN_PASSWORD</strong> adındaki gizli ayardan yönetilir.</p>
                <p>GitHub ayarlarında yeni ve benzersiz bir şifre belirle, <strong>ismail-semih-official</strong> deposuna erişim ver ve Codespace'i durdurup yeniden başlat.</p>
                <a href="https://github.com/settings/codespaces" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#ff8c42] hover:underline">
                  Codespaces şifre ayarını aç <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p>Çok sayıda hatalı giriş yaptıysan son denemenden itibaren en az 5 dakika bekle. Bu sayfa şifreni göremez veya sıfırlayamaz.</p>
              </div>
            </details>

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
