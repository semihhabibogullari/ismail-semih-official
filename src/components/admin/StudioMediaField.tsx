import React, { useState } from 'react';
import { ImagePlus, Film, Link2, Loader2, ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  label: string;
  value?: string;
  onChange: (url: string) => void;
  onCover?: (url: string) => void;
  accept: 'image' | 'video';
}

const inputClass = 'w-full min-w-0 rounded-xl bg-[#0c0c13] border border-white/15 focus:ring-2 focus:ring-[#ff5a1f]/60 outline-none px-3 py-2.5 text-sm text-white placeholder:text-gray-600';

function playerSource(value: string): { kind: 'iframe' | 'video'; url: string } | null {
  if (!value.trim()) return null;
  try {
    const u = new URL(value, window.location.origin);
    if (!['http:', 'https:'].includes(u.protocol)) return null;
    if (/\.(mp4|webm)$/i.test(u.pathname)) return { kind: 'video', url: u.href };
    const h = u.hostname.toLowerCase();
    if (h === 'youtu.be' || h === 'youtube.com' || h.endsWith('.youtube.com') || h.endsWith('.youtube-nocookie.com')) {
      const id = h === 'youtu.be' ? u.pathname.split('/')[1] :
        u.pathname.startsWith('/shorts/') || u.pathname.startsWith('/embed/') ? u.pathname.split('/')[2] : u.searchParams.get('v');
      if (id && /^[\w-]{11}$/.test(id)) return { kind: 'iframe', url: `https://www.youtube-nocookie.com/embed/${id}` };
    }
    if (h === 'vimeo.com' || h === 'player.vimeo.com') {
      const id = u.pathname.match(/(?:video\/)?(\d+)/)?.[1];
      if (id) return { kind: 'iframe', url: `https://player.vimeo.com/video/${id}` };
    }
    if (h === 'open.spotify.com') {
      const match = u.pathname.match(/\/(?:embed\/)?(episode|show|track|album|playlist)\/([\w]+)/);
      if (match) return { kind: 'iframe', url: `https://open.spotify.com/embed/${match[1]}/${match[2]}` };
    }
    if (h === 'instagram.com' || h === 'www.instagram.com') {
      const match = u.pathname.match(/^\/(p|reel|tv)\/([\w-]+)/);
      if (match) return { kind: 'iframe', url: `https://www.instagram.com/${match[1]}/${match[2]}/embed/` };
    }
  } catch {}
  return null;
}

export const StudioMediaField: React.FC<Props> = ({ label, value = '', onChange, onCover, accept }) => {
  const [busy, setBusy] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [preview, setPreview] = useState<{ title?: string; imageUrl?: string; fallbackImageUrl?: string; embedUrl?: string; platform?: string } | null>(null);
  const [error, setError] = useState('');
  const player = accept === 'video' ? playerSource(value) : null;

  const uploadFile = async (file?: File) => {
    if (!file) return;
    const allowed = accept === 'image' ? ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'] : ['video/mp4', 'video/webm'];
    if (!allowed.includes(file.type)) { setError('Desteklenmeyen dosya türü. JPG, PNG, WebP, GIF, AVIF, MP4 veya WebM kullanın.'); return; }
    if (file.size > 30 * 1024 * 1024) { setError('Dosya 30 MB sınırını aşıyor.'); return; }
    const form = new FormData();
    form.append('file', file);
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/media/upload', { method: 'POST', body: form, credentials: 'same-origin' });
      const json = await response.json();
      if (!response.ok || !json.file?.url) throw new Error(json.error || 'Dosya yüklenemedi.');
      onChange(json.file.url);
      setPreview(null);
    } catch (e) { setError(e instanceof Error ? e.message : 'Yükleme başarısız.'); }
    finally { setBusy(false); }
  };

  const previewLink = async () => {
    if (!value) return;
    setPreviewLoading(true); setError('');
    try {
      const response = await fetch('/api/video/preview', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: value }),
      });
      const json = await response.json();
      if (!response.ok || !json.success) throw new Error(json.error || json.message || 'Bağlantı önizlenemiyor.');
      setPreview(json);
    } catch (e) { setError(e instanceof Error ? e.message : 'Önizleme bulunamadı.'); }
    finally { setPreviewLoading(false); }
  };

  return (
    <div className="rounded-2xl border border-white/10 p-4 bg-[#101017] space-y-3">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <span className="font-semibold text-white text-sm flex items-center gap-2">
          {accept === 'image' ? <ImagePlus size={16} className="text-[#ff5a1f]" /> : <Film size={16} className="text-[#ff5a1f]" />}
          {label}
        </span>
        <label className="cursor-pointer inline-flex gap-2 items-center rounded-xl border border-[#ff5a1f]/50 hover:bg-[#ff5a1f]/15 px-3 py-2 text-[#ffab80] text-xs font-semibold">
          {busy ? <Loader2 size={15} className="animate-spin" /> : <ImagePlus size={15} />}
          {busy ? 'Yükleniyor' : 'Dosya Yükle'}
          <input type="file" accept={accept === 'image' ? 'image/jpeg,image/png,image/webp,image/gif,image/avif' : 'video/mp4,video/webm'}
            disabled={busy} className="sr-only" onChange={e => { void uploadFile(e.target.files?.[0]); e.target.value = ''; }} />
        </label>
      </div>
      <div className="flex gap-2 items-center">
        <Link2 size={16} className="shrink-0 text-gray-500" />
        <input value={value} onChange={e => { onChange(e.target.value); setPreview(null); setError(''); }}
          aria-label={label + ' bağlantısı'} className={inputClass}
          placeholder={accept === 'image' ? 'Görsel URL veya dosya bağlantısı...' : 'YouTube, Vimeo, Reels veya MP4 / WebM linki...'} />
      </div>
      {value && (
        <div className="space-y-3">
          {accept === 'image' ? (
            <div className="aspect-video max-h-56 rounded-xl bg-black/40 overflow-hidden flex items-center justify-center">
              <img src={value} alt="Görsel önizleme" loading="lazy" className="max-w-full max-h-56 object-contain"
                onError={() => setError('Görsel görüntülenemedi, bağlantıyı kontrol edin.')} />
            </div>
          ) : player ? (
            <div className="aspect-video max-h-72 rounded-xl overflow-hidden bg-black">
              {player.kind === 'video' ? <video src={player.url} controls preload="metadata" className="w-full h-full object-contain" />
                : <iframe src={player.url} allowFullScreen title={label + ' önizleme'} loading="lazy" className="w-full h-full border-0"
                  allow="autoplay; encrypted-media; picture-in-picture; fullscreen" />}
            </div>
          ) : (
            <p className="text-gray-400 text-xs">Bu bağlantı için doğrudan oynatıcı desteklenmiyor. Aşağıdan kapak görselini deneyin.</p>
          )}
          {accept === 'video' && (
            <button type="button" onClick={previewLink} disabled={previewLoading}
              className="text-xs flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/15 text-white disabled:opacity-60">
              {previewLoading ? <Loader2 size={14} className="animate-spin" /> : <ExternalLink size={14} />}
              Bağlantıdan Kapak ve Başlık Bul
            </button>
          )}
        </div>
      )}
      {preview && (
        <div className="flex gap-3 rounded-xl border border-emerald-500/30 p-3 bg-emerald-900/10">
          {(preview.imageUrl || preview.fallbackImageUrl) && <img src={preview.imageUrl || preview.fallbackImageUrl} alt="" className="w-28 h-20 object-cover rounded-lg bg-black" />}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="text-white text-xs font-semibold">{preview.title || 'Önizleme'}</p>
            <p className="text-xs text-gray-400">{preview.platform || 'Medya'}</p>
            {onCover && (preview.imageUrl || preview.fallbackImageUrl) && (
              <button type="button" onClick={() => onCover(preview.imageUrl || preview.fallbackImageUrl || '')}
                className="inline-flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-xs font-semibold">
                <CheckCircle2 size={13} /> Kapak Olarak Kullan
              </button>
            )}
          </div>
        </div>
      )}
      {error && <p role="alert" className="text-amber-400 flex gap-2 items-start text-xs"><AlertCircle size={14} className="shrink-0 mt-0.5" />{error}</p>}
      <p className="text-[11px] text-gray-500">Dosya üst sınırı 30 MB. Video servisleri erişime izin verirse önizlenir; bağlantının kendisi içerikle birlikte kaydedilir.</p>
    </div>
  );
};
