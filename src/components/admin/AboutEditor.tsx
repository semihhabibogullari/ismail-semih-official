import React from 'react';
import { ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react';
import type { AboutContent } from '../../types';
import { StudioMediaField } from './StudioMediaField';

const input = 'w-full min-w-0 rounded-xl border border-white/15 bg-[#0b0b0f] px-3 py-2.5 text-sm text-white placeholder:text-gray-600 outline-none focus:border-[#ff5a1f] focus:ring-1 focus:ring-[#ff5a1f]';
const cardClass = 'rounded-2xl border border-white/10 bg-[#15151c] shadow-lg shadow-black/10';

function Text({ label, value, onChange, multiline, rows = 4 }: {
  label: string; value: string; onChange: (v: string) => void; multiline?: boolean; rows?: number;
}) {
  return (
    <label className="block min-w-0 space-y-1.5">
      <span className="text-xs font-semibold text-gray-300">{label}</span>
      {multiline
        ? <textarea className={input + ' resize-y'} rows={rows} value={value} onChange={(e) => onChange(e.target.value)} />
        : <input className={input} value={value} onChange={(e) => onChange(e.target.value)} />}
    </label>
  );
}

function moveItem<T>(list: T[], index: number, dir: -1 | 1): T[] {
  const target = index + dir;
  if (target < 0 || target >= list.length) return list;
  const copy = [...list];
  [copy[index], copy[target]] = [copy[target], copy[index]];
  return copy;
}

const newId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

export const AboutEditor: React.FC<{ value: AboutContent; onChange: (next: AboutContent) => void }> = ({ value, onChange }) => {
  const patch = (p: Partial<AboutContent>) => onChange({ ...value, ...p });

  const rowTools = (index: number, length: number, onMove: (dir: -1 | 1) => void, onRemove: () => void) => (
    <div className="flex gap-1 shrink-0">
      <button type="button" title="Yukarı" disabled={index === 0} onClick={() => onMove(-1)} className="p-2 bg-white/10 rounded-lg disabled:opacity-30"><ChevronUp size={16} /></button>
      <button type="button" title="Aşağı" disabled={index === length - 1} onClick={() => onMove(1)} className="p-2 bg-white/10 rounded-lg disabled:opacity-30"><ChevronDown size={16} /></button>
      <button type="button" title="Sil" onClick={onRemove} className="p-2 text-red-400 hover:bg-red-950/30 rounded-lg"><Trash2 size={16} /></button>
    </div>
  );

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-bold">Hakkımda Sayfası</h2>
        <p className="text-gray-400 text-sm mt-1">/hakkimda sayfasındaki biyografi, yetkinlikler ve sahne çalışmaları.</p>
      </div>

      <div className={cardClass + ' p-4 sm:p-6 space-y-4'}>
        <h3 className="font-bold">Portre ve Biyografi</h3>
        <div className="grid lg:grid-cols-2 gap-4">
          <StudioMediaField accept="image" label="Portre görseli" value={value.portraitUrl} onChange={(url) => patch({ portraitUrl: url })} />
          <div className="space-y-4">
            <Text label="Portre üstü ad" value={value.portraitName} onChange={(v) => patch({ portraitName: v })} />
            <Text label="Portre üstü unvan" value={value.portraitRole} onChange={(v) => patch({ portraitRole: v })} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Text label="Etiket" value={value.badge} onChange={(v) => patch({ badge: v })} />
          <Text label="Ana başlık" value={value.heading} onChange={(v) => patch({ heading: v })} />
        </div>
        <Text multiline rows={10} label="Biyografi (paragrafları boş satırla ayırın; **kalın** yazmak için yıldız kullanın)" value={value.biography} onChange={(v) => patch({ biography: v })} />
      </div>

      <div className={cardClass + ' p-4 sm:p-6 space-y-4'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Yetkinlikler</h3>
          <button type="button" onClick={() => patch({ skills: [...value.skills, { id: newId('skill'), title: 'Yeni yetkinlik', desc: '' }] })}
            className="px-3 py-2 rounded-xl bg-[#ff5a1f] text-xs font-bold inline-flex items-center gap-2"><Plus size={15} />Yetkinlik Ekle</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Text label="Bölüm başlığı" value={value.skillsTitle} onChange={(v) => patch({ skillsTitle: v })} />
          <Text label="Bölüm alt başlığı" value={value.skillsSubtitle} onChange={(v) => patch({ skillsSubtitle: v })} />
        </div>
        {value.skills.map((s, i) => (
          <div key={s.id} className="rounded-xl border border-white/10 p-3 flex flex-col sm:flex-row gap-3 sm:items-start">
            <div className="grid sm:grid-cols-2 gap-3 flex-1 min-w-0">
              <Text label="Başlık" value={s.title} onChange={(v) => patch({ skills: value.skills.map((x) => (x.id === s.id ? { ...x, title: v } : x)) })} />
              <Text label="Açıklama" value={s.desc} onChange={(v) => patch({ skills: value.skills.map((x) => (x.id === s.id ? { ...x, desc: v } : x)) })} />
            </div>
            {rowTools(i, value.skills.length, (d) => patch({ skills: moveItem(value.skills, i, d) }), () => patch({ skills: value.skills.filter((x) => x.id !== s.id) }))}
          </div>
        ))}
      </div>

      <div className={cardClass + ' p-4 sm:p-6 space-y-4'}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-bold">Sahne ve Reji Çalışmaları</h3>
          <button type="button" onClick={() => patch({ plays: [...value.plays, { id: newId('play'), year: '', title: 'Yeni oyun', role: '', venue: '' }] })}
            className="px-3 py-2 rounded-xl bg-[#ff5a1f] text-xs font-bold inline-flex items-center gap-2"><Plus size={15} />Oyun Ekle</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <Text label="Bölüm başlığı" value={value.playsTitle} onChange={(v) => patch({ playsTitle: v })} />
          <Text label="Bölüm alt başlığı" value={value.playsSubtitle} onChange={(v) => patch({ playsSubtitle: v })} />
        </div>
        {value.plays.map((p, i) => (
          <div key={p.id} className="rounded-xl border border-white/10 p-3 flex flex-col sm:flex-row gap-3 sm:items-start">
            <div className="grid sm:grid-cols-2 gap-3 flex-1 min-w-0">
              <Text label="Yıl / dönem" value={p.year} onChange={(v) => patch({ plays: value.plays.map((x) => (x.id === p.id ? { ...x, year: v } : x)) })} />
              <Text label="Oyun adı" value={p.title} onChange={(v) => patch({ plays: value.plays.map((x) => (x.id === p.id ? { ...x, title: v } : x)) })} />
              <Text label="Rol" value={p.role} onChange={(v) => patch({ plays: value.plays.map((x) => (x.id === p.id ? { ...x, role: v } : x)) })} />
              <Text label="Mekân" value={p.venue} onChange={(v) => patch({ plays: value.plays.map((x) => (x.id === p.id ? { ...x, venue: v } : x)) })} />
            </div>
            {rowTools(i, value.plays.length, (d) => patch({ plays: moveItem(value.plays, i, d) }), () => patch({ plays: value.plays.filter((x) => x.id !== p.id) }))}
          </div>
        ))}
      </div>

      <div className={cardClass + ' p-4 sm:p-6 space-y-4'}>
        <h3 className="font-bold">Sayfa Sonu Davet Kartı</h3>
        <Text label="Başlık" value={value.ctaTitle} onChange={(v) => patch({ ctaTitle: v })} />
        <Text multiline label="Açıklama" value={value.ctaText} onChange={(v) => patch({ ctaText: v })} />
      </div>
    </section>
  );
};
