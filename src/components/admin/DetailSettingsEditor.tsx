import React from 'react';
import type { DetailAction, DetailFields } from '../../types';

interface Props {
  value: DetailFields;
  onChange: (patch: Partial<DetailFields>) => void;
  ticketUrl?: string;
}

const presets: Array<{ kind: DetailAction['kind']; title: string; en: string; defaultUrl: string }> = [
  { kind: 'ticket', title: 'Bilet Al', en: 'Buy Tickets', defaultUrl: '' },
  { kind: 'contact', title: 'İletişim', en: 'Contact', defaultUrl: '/iletisim' },
  { kind: 'custom', title: 'Özel Buton', en: 'Learn More', defaultUrl: '' },
];

export const DetailSettingsEditor: React.FC<Props> = ({ value, onChange, ticketUrl }) => {
  const current = value.detailActions || [];
  const updateAction = (kind: DetailAction['kind'], patch: Partial<DetailAction>) => {
    const preset = presets.find(p => p.kind === kind)!;
    const existing = current.find(a => a.kind === kind);
    const next: DetailAction = {
      id: kind, kind,
      label: preset.title, label_en: preset.en,
      url: (kind === 'ticket' ? ticketUrl : preset.defaultUrl) || '',
      enabled: false, ...existing, ...patch,
    };
    onChange({ detailActions: [...current.filter(a => a.kind !== kind), next] });
  };

  return (
    <div className="rounded-xl border border-[#ff5a1f]/30 bg-[#0b0b0f]/60 p-4 space-y-4">
      <div>
        <h5 className="text-sm text-white font-bold">Açılır Detay Penceresi (Pop-up)</h5>
        <p className="text-[11px] text-gray-400 mt-1">
          Kart, afiş veya Detayları Gör tıklanınca açılır. Alt butonlar yalnızca burada etkinleştirilirse görünür.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <label className="block text-xs text-gray-300">
          Uzun açıklama (Türkçe)
          <textarea rows={4} value={value.detailDescription || ''} onChange={e => onChange({ detailDescription: e.target.value })}
            placeholder="Boş bırakılırsa normal açıklama kullanılır." className="block mt-1 w-full rounded-lg bg-[#151520] border border-white/15 p-2 text-white resize-y" />
        </label>
        <label className="block text-xs text-gray-300">
          Long description (English)
          <textarea rows={4} value={value.detailDescription_en || ''} onChange={e => onChange({ detailDescription_en: e.target.value })}
            placeholder="Optional English detail" className="block mt-1 w-full rounded-lg bg-[#151520] border border-white/15 p-2 text-white resize-y" />
        </label>
      </div>
      <label className="block text-xs text-gray-300">
        Detay penceresinde video bağlantısı (isteğe bağlı)
        <input value={value.detailVideoUrl || ''} onChange={e => onChange({ detailVideoUrl: e.target.value })}
          placeholder="YouTube, Vimeo, Spotify veya .mp4/.webm bağlantısı"
          className="block mt-1 w-full rounded-lg bg-[#151520] border border-white/15 p-2 text-white" />
      </label>
      <div className="space-y-3">
        <h6 className="text-xs text-white font-bold">İsteğe bağlı işlem butonları</h6>
        {presets.map(preset => {
          const action = current.find(a => a.kind === preset.kind);
          return (
            <div key={preset.kind} className="rounded-lg border border-white/10 p-3 space-y-3">
              <label className="flex items-center gap-2 text-xs text-white font-semibold cursor-pointer">
                <input type="checkbox" checked={action?.enabled === true}
                  onChange={e => updateAction(preset.kind, { enabled: e.target.checked })} className="accent-[#ff5a1f]" />
                {preset.title} butonunu göster
              </label>
              {action?.enabled && (
                <div className="grid sm:grid-cols-2 gap-2">
                  <input aria-label={`${preset.title} Türkçe buton yazısı`} value={action.label}
                    onChange={e => updateAction(preset.kind, { label: e.target.value })}
                    placeholder="Türkçe buton adı" className="rounded-lg bg-[#151520] border border-white/15 px-3 py-2 text-white text-xs" />
                  <input aria-label={`${preset.title} İngilizce buton yazısı`} value={action.label_en || ''}
                    onChange={e => updateAction(preset.kind, { label_en: e.target.value })}
                    placeholder="English button label" className="rounded-lg bg-[#151520] border border-white/15 px-3 py-2 text-white text-xs" />
                  <input aria-label={`${preset.title} hedef bağlantısı`} value={action.url}
                    onChange={e => updateAction(preset.kind, { url: e.target.value })}
                    placeholder={preset.kind === 'ticket' ? 'https://bilet.../...' : '/iletisim veya https://...'}
                    className="sm:col-span-2 rounded-lg bg-[#151520] border border-white/15 px-3 py-2 text-white text-xs" />
                  <p className="sm:col-span-2 text-[10px] text-gray-400">
                    Bağlantı boşsa buton ziyaretçiye gösterilmez.
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
