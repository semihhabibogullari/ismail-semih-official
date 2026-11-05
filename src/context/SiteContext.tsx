/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { SiteData, AiProposal } from '../types';
import { initialSiteData } from '../data/initialData';

export type LanguageMode = 'tr' | 'en';
export type ThemeMode = 'dark' | 'light';
export type ExperienceMode = 'easy' | 'advanced' | 'expert';

interface SiteContextType {
  data: SiteData;
  isLoading: boolean;
  isDraftMode: boolean;
  setIsDraftMode: (val: boolean) => void;
  hasDraftChanges: boolean;
  isAuthenticated: boolean;
  token: string | null;
  language: LanguageMode;
  setLanguage: (lang: LanguageMode) => void;
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  experienceMode: ExperienceMode;
  setExperienceMode: (mode: ExperienceMode) => void;
  t: (trVal?: string, enVal?: string) => string;
  refreshData: () => Promise<void>;
  saveDraft: (updatedData: Partial<SiteData>) => Promise<{ success: boolean; message?: string }>;
  publishToLive: (note?: string) => Promise<{ success: boolean; message?: string }>;
  restoreBackup: (backupId: string) => Promise<{ success: boolean; message?: string }>;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  // AI Assistant helpers
  sendAiCommand: (command: string) => Promise<{ success: boolean; proposal?: AiProposal; message?: string; error?: string }>;
  applyAiProposal: (proposal: AiProposal) => Promise<{ success: boolean; message?: string }>;
  translateText: (text: string, context?: string) => Promise<string>;
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
  const [token, setToken] = useState<string | null>(null);

  // Persistent Language preference (TR by default)
  const [language, setLanguageState] = useState<LanguageMode>(() => {
    try {
      const saved = localStorage.getItem('ismail_site_lang');
      return saved === 'en' ? 'en' : 'tr';
    } catch {
      return 'tr';
    }
  });

  const setLanguage = (lang: LanguageMode) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('ismail_site_lang', lang);
    } catch {}
  };

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

    // Load Google Font if non-standard font is selected
    const headingFont = typography.headingFont || 'Space Grotesk';
    const bodyFont = typography.bodyFont || 'Inter';

    const fontsToLoad = [headingFont, bodyFont].filter(
      (f) => !['Inter', 'Space Grotesk', 'sans-serif', 'serif', 'monospace'].includes(f)
    );

    if (fontsToLoad.length > 0) {
      const fontQuery = fontsToLoad.map((f) => `family=${f.replace(/ /g, '+')}:wght@400;600;700`).join('&');
      const linkId = 'custom-google-fonts';
      let linkEl = document.getElementById(linkId) as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement('link');
        linkEl.id = linkId;
        linkEl.rel = 'stylesheet';
        document.head.appendChild(linkEl);
      }
      linkEl.href = `https://fonts.googleapis.com/css2?${fontQuery}&display=swap`;
    }

    // Set CSS font family variables
    document.documentElement.style.setProperty('--heading-font', `"${headingFont}", sans-serif`);
    document.documentElement.style.setProperty('--body-font', `"${bodyFont}", sans-serif`);
  }, [data.settings?.typography]);

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

  // Update browser metadata whenever the language or published settings change.
  useEffect(() => {
    const title = t(
      data.seo?.title || data.settings?.siteTitle,
      data.seo?.title_en || data.settings?.siteTitle_en
    );
    if (title) document.title = title;
    const description = t(data.seo?.description, data.seo?.description_en);
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
  }, [data.seo, data.settings?.siteTitle, data.settings?.siteTitle_en, data.settings?.faviconUrl, language, t]);

  // Persistent Admin Experience Mode ('easy' | 'advanced' | 'expert')
  const [experienceMode, setExperienceModeState] = useState<ExperienceMode>(() => {
    try {
      const saved = localStorage.getItem('ismail_admin_mode');
      if (saved === 'advanced' || saved === 'expert') return saved;
      return 'easy';
    } catch {
      return 'easy';
    }
  });

  const setExperienceMode = (mode: ExperienceMode) => {
    setExperienceModeState(mode);
    try {
      localStorage.setItem('ismail_admin_mode', mode);
    } catch {}
  };

  // Translation helper: returns English string if active lang is 'en' and translation exists
  const t = useCallback((trVal?: string, enVal?: string): string => {
    if (language === 'en' && enVal && enVal.trim().length > 0) {
      return enVal;
    }
    return trVal || '';
  }, [language]);

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
      const res = await fetch(endpoint, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
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
  }, [isDraftMode, isAuthenticated, token]);

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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
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
        if (json.token) setToken(json.token);
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
      setToken(null);
      setIsDraftMode(false);
      refreshData();
    }
  };

  // AI Assistant: send natural language command to backend
  const sendAiCommand = async (command: string): Promise<{ success: boolean; proposal?: AiProposal; message?: string; error?: string }> => {
    try {
      const res = await fetch('/api/ai/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ command }),
      });
      const json = await res.json();
      if (res.ok && json.success) {
        return { success: true, proposal: json.proposal, message: json.message };
      }
      return { success: false, error: json.error || 'Yapay zekâ yanıt vermedi.' };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  // AI Assistant: apply an approved proposal to current site draft
  const applyAiProposal = async (proposal: AiProposal): Promise<{ success: boolean; message?: string }> => {
    try {
      const currentDraft = { ...data };
      const { targetComponent, field, newValue } = proposal;

      // Handle target component updates
      if (targetComponent === 'typography') {
        currentDraft.settings = {
          ...currentDraft.settings,
          typography: {
            ...currentDraft.settings.typography,
            [field]: newValue,
          },
        };
      } else if (targetComponent === 'slider') {
        currentDraft.settings = {
          ...currentDraft.settings,
          sliderSettings: {
            ...currentDraft.settings.sliderSettings,
            [field]: newValue,
          },
        };
      } else if (targetComponent === 'theme') {
        currentDraft.settings = {
          ...currentDraft.settings,
          darkTheme: {
            ...currentDraft.settings.darkTheme,
            [field]: newValue,
          },
        };
      } else if (targetComponent === 'brand') {
        currentDraft.settings = {
          ...currentDraft.settings,
          [field]: newValue,
        };
      } else if (targetComponent === 'events') {
        // e.g. bulk update or field update
        if (Array.isArray(newValue)) {
          currentDraft.events = newValue;
        }
      }

      const saveRes = await saveDraft(currentDraft);
      if (saveRes.success) {
        return { success: true, message: 'Yapay zekâ önerisi başarıyla taslağa uygulandı!' };
      }
      return { success: false, message: saveRes.message };
    } catch (err: any) {
      return { success: false, message: err.message };
    }
  };

  // AI Assistant: translation helper
  const translateText = async (text: string, context?: string): Promise<string> => {
    try {
      const res = await fetch('/api/ai/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text, targetLang: 'en', context }),
      });
      const json = await res.json();
      if (res.ok && json.translation) {
        return json.translation;
      }
      return text;
    } catch {
      return text;
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
        token,
        language,
        setLanguage,
        theme,
        setTheme,
        experienceMode,
        setExperienceMode,
        t,
        refreshData,
        saveDraft,
        publishToLive,
        restoreBackup,
        login,
        logout,
        sendAiCommand,
        applyAiProposal,
        translateText,
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
