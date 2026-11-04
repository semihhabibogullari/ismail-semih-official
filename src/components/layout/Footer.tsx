/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { Instagram, Youtube, Mail, MapPin, Phone, Lock } from 'lucide-react';
import { Logo } from '../common/Logo';
import { useSite } from '../../context/SiteContext';

export const Footer: React.FC = () => {
  const { data, isAuthenticated, t } = useSite();
  const settings = data.settings;
  const social = settings?.socialLinks;

  return (
    <footer className="bg-[#0b0b0f] border-t border-white/10 mt-20 pt-16 pb-12 text-sm text-gray-400">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-white/5">
          {/* Col 1: Brand & Bio */}
          <div className="md:col-span-2 space-y-4">
            <Logo customWidth={240} />
            <p className="text-gray-400 text-sm leading-relaxed max-w-md pt-2">
              {t(
                settings?.bioSummary ||
                  'İstanbul çağdaş tiyatro sahnelerinde oyunculuk, reji ve dramaturji çalışmalarını sürdüren; sahne sanatları ile yapay zekâ ve yeni medya pratiklerini harmanlayan tiyatro sanatçısı, yönetmen ve podcast üreticisi.',
                settings?.bioSummary_en ||
                  'Theater artist, director, and podcast producer based in Istanbul, merging contemporary theater stages with AI and new media practices.'
              )}
            </p>
            <div className="flex items-center gap-3 pt-2">
              {social?.spotify && (
                <a
                  href={social.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#151520] border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#1db954] hover:border-[#1db954] transition-colors"
                  aria-label="Spotify"
                >
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                  </svg>
                </a>
              )}
              {social?.youtube && (
                <a
                  href={social.youtube}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#151520] border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#ff0000] hover:border-[#ff0000] transition-colors"
                  aria-label="YouTube"
                >
                  <Youtube className="w-4 h-4" />
                </a>
              )}
              {social?.instagram && (
                <a
                  href={social.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-[#151520] border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#e4405f] hover:border-[#e4405f] transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
              {settings?.contactEmail && (
                <a
                  href={`mailto:${settings.contactEmail}`}
                  className="w-9 h-9 rounded-full bg-[#151520] border border-white/10 flex items-center justify-center text-gray-300 hover:text-[#ff5a1f] hover:border-[#ff5a1f] transition-colors"
                  aria-label="E-posta"
                >
                  <Mail className="w-4 h-4" />
                </a>
              )}
            </div>
          </div>

          {/* Col 2: Hızlı Menü */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider mb-4">
              {t('HIZLI BAĞLANTILAR', 'QUICK LINKS')}
            </h4>
            <ul className="space-y-2.5">
              <li>
                <Link to="/etkinlikler" className="hover:text-[#ff5a1f] transition-colors">
                  {t('Etkinlik Takvimi & Biletler', 'Event Calendar & Tickets')}
                </Link>
              </li>
              <li>
                <Link to="/podcast" className="hover:text-[#ff5a1f] transition-colors">
                  {t('Ben Bir İsmail Podcast', 'Ben Bir Ismail Podcast')}
                </Link>
              </li>
              <li>
                <Link to="/yapay-zeka" className="hover:text-[#ff5a1f] transition-colors">
                  {t('Yapay Zekâ ve Sahne Sanatları', 'Artificial Intelligence & Performing Arts')}
                </Link>
              </li>
              <li>
                <Link to="/egitimler" className="hover:text-[#ff5a1f] transition-colors">
                  {t('Oyunculuk & Atölye Programı', 'Acting & Workshop Program')}
                </Link>
              </li>
              <li>
                <Link to="/hakkimda" className="hover:text-[#ff5a1f] transition-colors">
                  {t('Sanatçı Özgeçmişi (Biyografi)', 'Artist Biography')}
                </Link>
              </li>
              <li>
                <Link to="/iletisim" className="hover:text-[#ff5a1f] transition-colors">
                  {t('İletişim & Proje Teklifleri', 'Contact & Inquiries')}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: İletişim Bilgileri */}
          <div>
            <h4 className="text-white text-sm font-semibold tracking-wider mb-4">
              {t('İLETİŞİM & AJANS', 'CONTACT & AGENCY')}
            </h4>
            <div className="space-y-3">
              {settings?.contactEmail && (
                <div className="flex items-start gap-2.5">
                  <Mail className="w-4 h-4 text-[#ff5a1f] shrink-0 mt-0.5" />
                  <a href={`mailto:${settings.contactEmail}`} className="hover:text-white transition-colors truncate">
                    {settings.contactEmail}
                  </a>
                </div>
              )}
              {settings?.contactPhone && (
                <div className="flex items-center gap-2.5">
                  <Phone className="w-4 h-4 text-[#ff5a1f] shrink-0" />
                  <a href={`tel:${settings.contactPhone}`} className="hover:text-white transition-colors">
                    {settings.contactPhone}
                  </a>
                </div>
              )}
              {settings?.address && (
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-4 h-4 text-[#ff5a1f] shrink-0 mt-0.5" />
                  <span>{t(settings.address, settings.address_en)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>
            {t(
              settings?.copyrightText ||
                `© ${new Date().getFullYear()} İsmail Semih Habiboğulları. Tüm Hakları Saklıdır.`,
              settings?.copyrightText_en ||
                `© ${new Date().getFullYear()} Ismail Semih Habibogullari. All Rights Reserved.`
            )}
          </div>
          <div className="flex items-center gap-6">
            <Link to="/sitemap.xml" target="_blank" className="hover:text-gray-300">
              Sitemap
            </Link>
            <Link to="/robots.txt" target="_blank" className="hover:text-gray-300">
              Robots
            </Link>
            <Link
              to={isAuthenticated ? '/admin' : '/admin/login'}
              className="inline-flex items-center gap-1.5 text-gray-500 hover:text-[#ff5a1f] transition-colors"
            >
              <Lock className="w-3 h-3" />
              <span>{isAuthenticated ? 'İsmail Semih Studio' : 'Yönetici Girişi'}</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};
