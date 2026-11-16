/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SiteData } from '../types';
import { initialSiteData } from '../data/initialData';
import { loadSelectableFont } from '../utils/fonts';

export type ThemeMode = 'dark' | 'light';

interface SiteContextType {
  data: SiteData;
  isLoading: boolean;
  isDraftMode: boolean;
  setIsDraftMode: (val: boolean) => void;
  hasDraftChanges: boolean;
  isAuthenticated: boolean;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  refreshData: () => Promise<void>;
  saveDraft: (updatedData: Partial<SiteData>) => Promise<{ success: boolean; message?: string }>;
  publishToLive: (note?: string) => Promise<{ success: boolean; message?: string }>;
  restoreBackup: (backupId: string) => Promise<{ success: boolean; message?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const SiteContext = createContext<SiteContextType | undefined>(undefined);

export function SiteProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SiteData>(initialSiteData);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isDraftMode, setIsDraftMode] = useState<boolean>(() =>
    new URLSearchParams(window.location.search).get('studio_preview') === 'draft'
  );
  const [hasDraftChanges, setHasDraftChanges] = useState<boolean>(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  // Persistent Theme preference (Dark by default)
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('ismail_site_theme');
      return saved === 'light' ? 'light' : 'dark';
    } catch {
      return 'dark';
    }
  });

  const setTheme = (newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem('ismail_site_theme', newTheme);
    } catch {}
  };

  // Apply theme to document HTML element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.remove('light');
      root.classList.add('dark');
    }
  }, [theme]);

  // Apply dynamic typography from data.settings.typography
  useEffect(() => {
    const typography = data.settings?.typography;
    if (!typography) return;

    const headingFont = typography.headingFont || 'Space Grotesk';
    const bodyFont = typography.bodyFont || 'Inter';

    const sectionFonts = (data.sections || []).flatMap(section =>
      [section.appearance?.headingFont, section.appearance?.bodyFont]
    ).filter((font): font is string => typeof font === 'string' && font.length > 0);
    // Self-hosted fonts: the defaults are declared in src/fonts.css, the others load on demand.
    [...new Set([headingFont, bodyFont, ...sectionFonts])].forEach(loadSelectableFont);

    // Set CSS font family variables
    document.documentElement.style.setProperty('--heading-font', `"${headingFont}", sans-serif`);
    document.documentElement.style.setProperty('--body-font', `"${bodyFont}", sans-serif`);
  }, [data.settings?.typography, data.sections]);

  // Keep published brand colors in sync with the public pages. Restrict CSS
  // inputs to valid hex colors instead of interpolating arbitrary user strings.
  useEffect(() => {
    const palette = theme === 'light' ? data.settings?.lightTheme : data.settings?.darkTheme;
    if (!palette) return;
    const root = document.documentElement;
    const tokens: Record<string, string> = {
      '--bg-primary': palette.bgPrimary,
      '--bg-secondary': palette.bgSecondary,
      '--bg-panel': palette.panelBg,
      '--accent': palette.accentColor,
      '--text-primary': palette.textPrimary,
      '--text-secondary': palette.textSecondary,
    };
    for (const [name, value] of Object.entries(tokens)) {
      if (typeof value === 'string' && /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value)) {
        root.style.setProperty(name, value);
      }
    }
    const size = data.settings?.typography?.baseSize;
    if (typeof size === 'string' && /^(1[2-9]|2[0-4])px$/.test(size)) {
      root.style.setProperty('--body-base-size', size);
    }
  }, [data.settings?.darkTheme, data.settings?.lightTheme, data.settings?.typography?.baseSize, theme]);

  // Update browser metadata whenever the published settings change.
  useEffect(() => {
    const title = data.seo?.title || data.settings?.siteTitle || '';
    if (title) document.title = title;
    const description = data.seo?.description || '';
    const ensureMeta = (name: string, content: string, attr: 'name' | 'property' = 'name') => {
      let node = document.querySelector<HTMLMetaElement>(`meta[${attr}="${name}"]`);
      if (!node) {
        node = document.createElement('meta');
        node.setAttribute(attr, name);
        document.head.appendChild(node);
      }
      node.content = content;
    };
    if (description) {
      ensureMeta('description', description);
      ensureMeta('og:description', description, 'property');
    }
    if (title) ensureMeta('og:title', title, 'property');
    ensureMeta('robots', data.seo?.robotsIndex === false ? 'noindex, nofollow' : 'index, follow');
    const icon = data.settings?.faviconUrl;
    if (typeof icon === 'string' && icon) {
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      try {
        const url = new URL(icon, window.location.origin);
        if (['https:', 'http:'].includes(url.protocol)) favicon.href = url.href;
      } catch {}
    }
  }, [data.seo, data.settings?.siteTitle, data.settings?.faviconUrl]);

  // Check auth status on mount
  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch('/api/auth/status');
      if (res.ok) {
        const json = await res.json();
        setIsAuthenticated(json.isAuthenticated);
      }
    } catch {
      setIsAuthenticated(false);
    }
  }, []);

  // Fetch site data
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const endpoint = isDraftMode && isAuthenticated ? '/api/site/draft' : '/api/site';
      const res = await fetch(endpoint);
      if (res.ok) {
        const json = await res.json();
        if (json.data) {
          setData(json.data);
          if (json.hasDraftChanges !== undefined) {
            setHasDraftChanges(json.hasDraftChanges);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching site data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isDraftMode, isAuthenticated]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Save current changes to draft
  const saveDraft = async (updatedData: Partial<SiteData>): Promise<{ success: boolean; message?: string }> => {
    try {
      const merged: SiteData = {
        ...data,
        ...updatedData,
        updatedAt: new Date().toISOString(),
      };
      const res = await fetch('/api/site/draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(merged),
      });
      const json = await res.json();
      if (res.ok) {
        setData(merged);
        setHasDraftChanges(true);
        return { success: true, message: json.message || 'Taslak kaydedildi.' };
      }
      return { success: false, message: json.error || 'Taslak kaydedilemedi.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Publish draft to live
  const publishToLive = async (note?: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/site/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ note }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.data) setData(json.data);
        setHasDraftChanges(false);
        return { success: true, message: json.message || 'Canlıya yayınlandı.' };
      }
      return { success: false, message: json.error || 'Yayınlama başarısız.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // Restore backup
  const restoreBackup = async (backupId: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const res = await fetch('/api/site/restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupId }),
      });
      const json = await res.json();
      if (res.ok) {
        if (json.data) setData(json.data);
        setHasDraftChanges(true);
        return { success: true, message: json.message };
      }
      return { success: false, message: json.error || 'Geri yükleme başarısız.' };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setIsAuthenticated(true);
        return { success: true };
      }
      return { success: false, error: json.error || 'Giriş başarısız.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } finally {
      setIsAuthenticated(false);
      setIsDraftMode(false);
      refreshData();
    }
  };

  return (
    <SiteContext.Provider
      value={{
        data,
        isLoading,
        isDraftMode,
        setIsDraftMode,
        hasDraftChanges,
        isAuthenticated,
        theme,
        setTheme,
        refreshData,
        saveDraft,
        publishToLive,
        restoreBackup,
        login,
        logout,
      }}
    >
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  const context = useContext(SiteContext);
  if (!context) {
    throw new Error('useSite must be used within a SiteProvider');
  }
  return context;
}
