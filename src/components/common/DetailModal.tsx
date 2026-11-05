import React, { useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Maximize2, CalendarDays, Clock3, MapPin, ExternalLink } from 'lucide-react';
import { useSite } from '../../context/SiteContext';
import type { DetailAction } from '../../types';

export interface DetailModalItem {
  title: string;
  description?: string;
  category?: string;
  imageUrl?: string;
  videoUrl?: string;
  embedUrl?: string;
  actions?: DetailAction[];
  meta?: { label: string; value: string; icon?: 'date' | 'time' | 'place' }[];
}

interface DetailModalProps {
  item: DetailModalItem | null;
  onClose: () => void;
}

function safeLink(raw: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const value = raw.trim();
  if (value.startsWith('/') && !value.startsWith('//')) return value;
  try {
    const url = new URL(value);
    return ['https:', 'http:', 'mailto:', 'tel:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function resolveVideo(videoUrl?: string, embedUrl?: string) {
  const source = (embedUrl || videoUrl || '').trim();
  if (!source) return null;
  try {
    const url = new URL(source, window.location.origin);
    if (!['https:', 'http:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase();
    if (/\.(mp4|webm)$/i.test(url.pathname)) {
      return { type: 'video' as const, src: url.href };
    }
    const youtubeHost = host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com') || host === 'youtube-nocookie.com' || host.endsWith('.youtube-nocookie.com');
    if (youtubeHost) {
      const id = host === 'youtu.be' ? url.pathname.slice(1).split('/')[0] :
        url.pathname.startsWith('/shorts/') || url.pathname.startsWith('/embed/')
          ? url.pathname.split('/')[2] : url.searchParams.get('v');
      if (id && /^[a-zA-Z0-9_-]{11}$/.test(id)) {
        return { type: 'iframe' as const, src: `https://www.youtube-nocookie.com/embed/${id}?rel=0` };
      }
    }
    if (host === 'vimeo.com' || host === 'www.vimeo.com' || host === 'player.vimeo.com') {
      const id = url.pathname.match(/\/(?:video\/)?(\d+)/)?.[1];
      if (id) return { type: 'iframe' as const, src: `https://player.vimeo.com/video/${id}` };
    }
    if (host === 'open.spotify.com') {
      const match = url.pathname.match(/\/(?:embed\/)?(episode|show|track|playlist|album)\/([a-zA-Z0-9]+)/);
      if (match) return { type: 'iframe' as const, src: `https://open.spotify.com/embed/${match[1]}/${match[2]}` };
    }
    if (host === 'instagram.com' || host === 'www.instagram.com') {
      const match = url.pathname.match(/^\/(p|reel|tv)\/([a-zA-Z0-9_-]+)/);
      if (match) return { type: 'iframe' as const, src: `https://www.instagram.com/${match[1]}/${match[2]}/embed/` };
    }
    // Never embed arbitrary web pages inside the site.
    return null;
  } catch {
    return null;
  }
}

export const DetailModal: React.FC<DetailModalProps> = ({ item, onClose }) => {
  const { language, theme } = useSite();
  const closeRef = useRef<HTMLButtonElement>(null);
  const mediaRef = useRef<HTMLDivElement>(null);
  const isDark = theme !== 'light';

  const playableMedia = useMemo(
    () => resolveVideo(item?.videoUrl, item?.embedUrl),
    [item?.videoUrl, item?.embedUrl]
  );

  useEffect(() => {
    if (!item) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
      if (event.key === 'Tab') {
        const dialog = closeRef.current?.closest('[role="dialog"]');
        if (!dialog) return;
        const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], video[controls]')).filter(node => node.getClientRects().length);
        if (!controls.length) return;
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleEscape);
      previousFocus?.focus();
    };
  }, [item, onClose]);

  if (!item) return null;

  const buttons = (item.actions || []).filter(a => a.enabled && safeLink(a.url));
  const fullscreen = async () => {
    try {
      if (mediaRef.current?.requestFullscreen) await mediaRef.current.requestFullscreen();
    } catch {
      // Browser may disallow fullscreen: native player controls remain available.
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section role="dialog" aria-modal="true" aria-labelledby="detail-dialog-title"
        className={`w-full max-w-3xl max-h-[92dvh] overflow-y-auto rounded-2xl border shadow-2xl ${isDark ? 'bg-[#121218] text-white border-white/15' : 'bg-white text-[#171720] border-gray-200'}`}>
        <div className="flex items-start justify-between gap-4 px-5 sm:px-7 py-5 border-b border-current/10">
          <div className="min-w-0">
            {item.category && <p className="text-xs font-semibold text-[#ff5a1f] uppercase tracking-widest mb-1">{item.category}</p>}
            <h2 id="detail-dialog-title" className="text-xl sm:text-2xl font-bold leading-snug">{item.title}</h2>
          </div>
          <button ref={closeRef} type="button" onClick={onClose} aria-label={language === 'en' ? 'Close details' : 'Detayları kapat'}
            className="shrink-0 p-2 rounded-xl hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-[#ff5a1f]">
            <X size={22} />
          </button>
        </div>
        <div className="px-5 sm:px-7 py-5 space-y-5">
          {playableMedia ? (
            <div ref={mediaRef} className="relative aspect-video w-full overflow-hidden rounded-xl bg-black">
              {playableMedia.type === 'video' ? (
                <video src={playableMedia.src} controls playsInline preload="metadata" className="h-full w-full object-contain" />
              ) : (
                <iframe src={playableMedia.src} title={item.title} allowFullScreen
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                  referrerPolicy="strict-origin-when-cross-origin" className="w-full h-full border-0" />
              )}
              <button type="button" onClick={fullscreen} title={language === 'en' ? 'Fullscreen' : 'Tam ekran'}
                className="absolute right-3 top-3 z-10 flex items-center gap-1.5 px-3 py-2 bg-black/75 hover:bg-[#ff5a1f] text-white rounded-lg text-xs font-semibold">
                <Maximize2 size={15} />
                {language === 'en' ? 'Fullscreen' : 'Tam Ekran'}
              </button>
            </div>
          ) : item.imageUrl ? (
            <img src={item.imageUrl} alt={item.title} className="w-full max-h-[370px] object-contain rounded-xl bg-black/5" loading="lazy" />
          ) : null}
          {item.meta?.length ? (
            <div className="flex flex-wrap gap-x-5 gap-y-3 text-sm opacity-80">
              {item.meta.filter(m => m.value).map((m, index) => (
                <span key={index} className="inline-flex items-center gap-2">
                  {m.icon === 'date' ? <CalendarDays size={16} className="text-[#ff5a1f]" /> :
                    m.icon === 'time' ? <Clock3 size={16} className="text-[#ff5a1f]" /> :
                    m.icon === 'place' ? <MapPin size={16} className="text-[#ff5a1f]" /> : null}
                  <span>{m.value}</span>
                </span>
              ))}
            </div>
          ) : null}
          {item.description && <div className="text-sm sm:text-base whitespace-pre-line leading-relaxed opacity-90">{item.description}</div>}
          {buttons.length > 0 && (
            <div className="pt-5 border-t border-current/10 flex flex-wrap gap-3">
              {buttons.map(action => {
                const href = safeLink(action.url)!;
                const external = /^https?:\/\//i.test(href);
                return <a key={action.id} href={href} target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="inline-flex items-center justify-center gap-2 bg-[#ff5a1f] hover:bg-[#ff733b] text-white px-5 py-3 rounded-xl font-semibold text-sm transition-colors">
                  {language === 'en' && action.label_en ? action.label_en : action.label}
                  {external && <ExternalLink size={15} />}
                </a>;
              })}
            </div>
          )}
        </div>
      </section>
    </div>,
    document.body
  );
};
