/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Instagram,
  Youtube,
  SlidersHorizontal,
  Search,
  Sun,
  Moon,
  Globe,
} from 'lucide-react';
import { Logo } from '../common/Logo';
import { useSite } from '../../context/SiteContext';

export const Navbar: React.FC = () => {
  const {
    data,
    isAuthenticated,
    isDraftMode,
    setIsDraftMode,
    language,
    setLanguage,
    theme,
    setTheme,
    t,
  } = useSite();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const location = useLocation();

  // Scroll detection
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Sort visible menu items
  const menuItems = (data.menu || [])
    .filter((item) => item.visible)
    .sort((a, b) => a.order - b.order);

  const social = data.settings?.socialLinks;

  const toggleLanguage = () => {
    setLanguage(language === 'tr' ? 'en' : 'tr');
  };

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <>
      {/* Draft Mode Banner if active */}
      {isAuthenticated && (
        <div className="bg-[#ff5a1f]/15 border-b border-[#ff5a1f]/30 px-4 py-1.5 text-xs text-center text-[#ff8c42] flex items-center justify-center gap-3">
          <span>
            {isDraftMode ? '⚡ Taslak Önizleme Modundasınız' : '🌐 Canlı Sitedesiniz'}
          </span>
          <button
            onClick={() => setIsDraftMode(!isDraftMode)}
            className="underline font-semibold hover:text-white cursor-pointer"
          >
            {isDraftMode ? 'Canlı Görünüme Geç' : 'Taslak Görünümüne Geç'}
          </button>
          <span className="text-gray-500">|</span>
          <Link to="/admin" className="underline font-semibold hover:text-white flex items-center gap-1">
            <SlidersHorizontal className="w-3 h-3" />
            İsmail Semih Studio
          </Link>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled
            ? 'bg-[#0b0b0f]/90 backdrop-blur-md border-b border-white/10 shadow-lg py-3'
            : 'bg-transparent border-b border-white/5 py-4'
        }`}
      >
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
          {/* Brand Logo Zone */}
          <div className="shrink-0 flex items-center">
            <Logo />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6 xl:gap-7 text-sm font-medium tracking-wide">
            {menuItems.map((item) => (
              <NavLink
                key={item.id}
                to={item.path}
                className={({ isActive }) =>
                  `transition-colors duration-200 relative py-1 text-sm whitespace-nowrap ${
                    isActive
                      ? 'text-[#ff5a1f] font-semibold'
                      : 'text-gray-300 hover:text-white'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    {t(item.label, item.label_en)}
                    {isActive && (
                      <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#ff5a1f] rounded-full" />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          {/* Right Action Zone: Language, Theme, Search, Social, Admin */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* TR | EN Language Switcher */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-gray-200 transition-colors cursor-pointer"
              aria-label="Dil Değiştir (Language Switch)"
              title={language === 'tr' ? 'Switch to English' : "Türkçe'ye Geç"}
            >
              <Globe className="w-3.5 h-3.5 text-[#ff5a1f]" />
              <span className={language === 'tr' ? 'text-[#ff5a1f] font-bold' : 'text-gray-400'}>
                TR
              </span>
              <span className="text-gray-500 text-[10px]">/</span>
              <span className={language === 'en' ? 'text-[#ff5a1f] font-bold' : 'text-gray-400'}>
                EN
              </span>
            </button>

            {/* Dark / Light Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10 transition-colors cursor-pointer"
              aria-label={theme === 'dark' ? 'Açık Temaya Geç' : 'Koyu Temaya Geç'}
              title={theme === 'dark' ? 'Açık Temaya Geç (Light Mode)' : 'Koyu Temaya Geç (Dark Mode)'}
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-indigo-500" />
              )}
            </button>

            {/* Search Trigger */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors focus:outline-none focus:ring-1 focus:ring-[#ff5a1f] cursor-pointer"
              aria-label={t('Arama', 'Search')}
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Social Icons */}
            <div className="hidden sm:flex items-center gap-1.5 border-l border-white/10 pl-2">
              {social?.spotify && (
                <a
                  href={social.spotify}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 text-gray-400 hover:text-[#1db954] hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Spotify Podcast"
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
                  className="p-1.5 text-gray-400 hover:text-[#ff0000] hover:bg-white/5 rounded-lg transition-colors"
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
                  className="p-1.5 text-gray-400 hover:text-[#e4405f] hover:bg-white/5 rounded-lg transition-colors"
                  aria-label="Instagram"
                >
                  <Instagram className="w-4 h-4" />
                </a>
              )}
            </div>

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-300 hover:text-white rounded-lg hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff5a1f] cursor-pointer"
              aria-label={mobileMenuOpen ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Quick Search Drawer */}
        {searchOpen && (
          <div className="bg-[#121218] border-b border-white/10 px-4 py-3 animate-in fade-in slide-in-from-top-2">
            <div className="max-w-[800px] mx-auto flex items-center gap-3">
              <Search className="w-5 h-5 text-[#ff5a1f]" />
              <input
                type="text"
                placeholder={t(
                  'Tiyatro oyunu, podcast, makale veya etkinlik ara...',
                  'Search theater plays, podcasts, articles, or events...'
                )}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
                className="w-full bg-transparent border-0 text-[#f1f1f4] placeholder-gray-500 focus:outline-none text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="text-xs text-gray-400 hover:text-white cursor-pointer"
                >
                  {t('Temizle', 'Clear')}
                </button>
              )}
              <button
                onClick={() => setSearchOpen(false)}
                className="p-1 text-gray-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* Quick search suggestions */}
            {searchQuery && (
              <div className="max-w-[800px] mx-auto mt-2 pt-2 border-t border-white/5 text-xs text-gray-400 flex flex-wrap gap-2">
                <span>{t('Hızlı bağlantılar:', 'Quick links:')}</span>
                <Link to="/etkinlikler" className="text-[#ff5a1f] hover:underline">
                  {t('Etkinlik Takvimi', 'Event Calendar')}
                </Link>
                <span>·</span>
                <Link to="/podcast" className="text-[#ff5a1f] hover:underline">
                  Ben Bir İsmail
                </Link>
                <span>·</span>
                <Link to="/egitimler" className="text-[#ff5a1f] hover:underline">
                  {t('Oyunculuk Atölyeleri', 'Acting Workshops')}
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Mobile Slide-down Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden bg-[#0b0b0f] border-b border-white/10 px-6 py-6 space-y-4 animate-in slide-in-from-top-4 duration-200">
            {/* Language & Theme Controls on Mobile */}
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <span className="text-xs text-gray-400">{t('Görünüm & Dil', 'Theme & Language')}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className="flex items-center gap-1 px-3 py-1 rounded-lg bg-white/5 border border-white/10 text-xs font-semibold text-gray-200"
                >
                  <Globe className="w-3.5 h-3.5 text-[#ff5a1f]" />
                  <span className={language === 'tr' ? 'text-[#ff5a1f]' : 'text-gray-400'}>TR</span>
                  <span className="text-gray-500">/</span>
                  <span className={language === 'en' ? 'text-[#ff5a1f]' : 'text-gray-400'}>EN</span>
                </button>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className="p-1.5 rounded-lg bg-white/5 border border-white/10 text-gray-200"
                >
                  {theme === 'dark' ? (
                    <Sun className="w-4 h-4 text-amber-400" />
                  ) : (
                    <Moon className="w-4 h-4 text-indigo-400" />
                  )}
                </button>
              </div>
            </div>

            <nav className="flex flex-col space-y-3">
              {menuItems.map((item) => (
                <NavLink
                  key={item.id}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    `text-base py-2 border-b border-white/5 transition-colors ${
                      isActive
                        ? 'text-[#ff5a1f] font-semibold pl-2 border-l-2 border-l-[#ff5a1f]'
                        : 'text-gray-300 hover:text-white'
                    }`
                  }
                >
                  {t(item.label, item.label_en)}
                </NavLink>
              ))}
            </nav>

            <div className="pt-4 flex items-center justify-between border-t border-white/10">
              <span className="text-xs text-gray-400">{t('Bizi takip edin', 'Follow us')}</span>
              <div className="flex items-center gap-3">
                {social?.spotify && (
                  <a href={social.spotify} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-1">
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
                    </svg>
                  </a>
                )}
                {social?.youtube && (
                  <a href={social.youtube} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-1">
                    <Youtube className="w-4 h-4" />
                  </a>
                )}
                {social?.instagram && (
                  <a href={social.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white p-1">
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {isAuthenticated ? (
              <Link
                to="/admin"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-[#ff5a1f] text-white font-medium text-center text-sm block"
              >
                İsmail Semih Studio'ya Git
              </Link>
            ) : (
              <Link
                to="/admin/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full mt-2 py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 text-center text-xs block"
              >
                Yönetici Girişi
              </Link>
            )}
          </div>
        )}
      </header>
    </>
  );
};
