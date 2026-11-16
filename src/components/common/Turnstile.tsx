/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useCallback, useEffect, useRef } from 'react';

// Cloudflare Turnstile (bot protection) for the public forms. The script is loaded on demand,
// only by the components that call useTurnstile(); the site key comes from GET /api/config.
// Without a site key (development without keys) nothing is rendered and no token is sent.

interface TurnstileApi {
  render: (container: HTMLElement, options: Record<string, unknown>) => string;
  reset: (widgetId?: string) => void;
  remove: (widgetId?: string) => void;
}

const SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
let siteKeyPromise: Promise<string | null> | null = null;
let scriptPromise: Promise<TurnstileApi | null> | null = null;

function loadSiteKey(): Promise<string | null> {
  if (!siteKeyPromise) {
    siteKeyPromise = fetch('/api/config')
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => (typeof json?.turnstileSiteKey === 'string' && json.turnstileSiteKey ? json.turnstileSiteKey : null))
      .catch(() => {
        siteKeyPromise = null;
        return null;
      });
  }
  return siteKeyPromise;
}

function loadScript(): Promise<TurnstileApi | null> {
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve) => {
      const existing = (window as any).turnstile as TurnstileApi | undefined;
      if (existing) return resolve(existing);
      const script = document.createElement('script');
      script.src = SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(((window as any).turnstile as TurnstileApi | undefined) ?? null);
      script.onerror = () => {
        scriptPromise = null;
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

export const TURNSTILE_ERROR = 'Robot doğrulaması başarısız, lütfen tekrar deneyin.';

export function useTurnstile() {
  const containerRef = useRef<HTMLDivElement>(null);
  const honeypotRef = useRef<HTMLInputElement>(null);
  const widgetId = useRef<string | null>(null);
  const token = useRef<string | null>(null);
  const waiters = useRef<Array<(value: string | null) => void>>([]);
  const enabled = useRef<boolean | null>(null); // null = still deciding
  // Time since the form was rendered; the server rejects submissions faster than ~2 seconds.
  const renderedAt = useRef(Date.now());

  const settle = useCallback((value: string | null) => {
    token.current = value;
    if (value) {
      const pending = waiters.current;
      waiters.current = [];
      pending.forEach((resolve) => resolve(value));
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const siteKey = await loadSiteKey();
      if (cancelled) return;
      if (!siteKey) {
        enabled.current = false;
        waiters.current.splice(0).forEach((resolve) => resolve(null));
        return;
      }
      enabled.current = true;
      const api = await loadScript();
      if (cancelled || !api || !containerRef.current) return;
      widgetId.current = api.render(containerRef.current, {
        sitekey: siteKey,
        appearance: 'interaction-only',
        theme: 'dark',
        'refresh-expired': 'auto',
        callback: (value: string) => settle(value),
        'expired-callback': () => settle(null),
        'error-callback': () => settle(null),
      });
    })();
    return () => {
      cancelled = true;
      if (widgetId.current) (window as any).turnstile?.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [settle]);

  /** Resolves with the current token (waiting up to 10 s for it), or null when none is available. */
  const getToken = useCallback((): Promise<string | null> => {
    if (token.current) return Promise.resolve(token.current);
    if (enabled.current === false) return Promise.resolve(null);
    return new Promise((resolve) => {
      const timer = window.setTimeout(() => resolve(null), 10000);
      waiters.current.push((value) => {
        window.clearTimeout(timer);
        resolve(value);
      });
    });
  }, []);

  /** Tokens are single use: call after every submit attempt to get a fresh one. */
  const reset = useCallback(() => {
    token.current = null;
    if (widgetId.current) (window as any).turnstile?.reset(widgetId.current);
  }, []);

  /** Extra request fields: elapsed fill time, the token (when Turnstile is active) and the empty honeypot. */
  const botFields = useCallback(async () => {
    const turnstileToken = await getToken();
    return {
      ...(turnstileToken ? { turnstileToken } : {}),
      formElapsedMs: Date.now() - renderedAt.current,
      website: honeypotRef.current?.value ?? '',
    };
  }, [getToken]);

  // Hidden trap field: real visitors never see or fill it, naive bots do (the server then drops the message silently).
  const honeypotProps = {
    ref: honeypotRef,
    type: 'text' as const,
    name: 'website',
    tabIndex: -1,
    autoComplete: 'off',
    'aria-hidden': true as const,
    style: { position: 'absolute' as const, left: '-10000px', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' as const },
  };

  return { containerRef, honeypotProps, botFields, reset };
}

/** Container for the widget. `display: contents` keeps it out of the form's spacing until a challenge needs to show. */
export const TURNSTILE_CONTAINER_CLASS = 'contents';
