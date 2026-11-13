import React, { useCallback, useEffect, useState } from 'react';
import { Download, Loader2, MailOpen, RotateCcw, Trash2 } from 'lucide-react';
import type { ContactMessage, NewsletterSubscriber } from '../../types';

const cardClass = 'rounded-2xl border border-white/10 bg-[#15151c] shadow-lg shadow-black/10';
const smallBtn = 'inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold';

interface BackupRow {
  id: string;
  timestamp: string;
  versionNumber: number;
  note: string;
}

function formatDate(value: string, withTime = false): string {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return withTime ? d.toLocaleString('tr-TR') : d.toLocaleDateString('tr-TR');
}

async function request(url: string, init?: RequestInit): Promise<Response> {
  return fetch(url, { credentials: 'same-origin', ...init });
}

function useLoad<T>(url: string, pick: (json: any) => T[]) {
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await request(url);
      if (!res.ok) throw new Error('Liste alınamadı.');
      setRows(pick(await res.json()));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Liste alınamadı.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);
  useEffect(() => { void reload(); }, [reload]);
  return { rows, setRows, loading, error, reload };
}

function Status({ loading, error, empty, emptyText }: { loading: boolean; error: string; empty: boolean; emptyText: string }) {
  if (loading) return <div className="p-8 grid place-items-center text-gray-400"><Loader2 className="animate-spin" size={20} /></div>;
  if (error) return <p className="p-4 rounded-xl bg-red-950/20 border border-red-600/30 text-red-300 text-sm">{error}</p>;
  if (empty) return <p className={cardClass + ' p-8 text-sm text-gray-400 text-center'}>{emptyText}</p>;
  return null;
}

function ConfirmDelete({ text, onCancel, onConfirm }: { text: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] bg-black/80 flex justify-center items-center px-4">
      <div className={cardClass + ' w-full max-w-md p-6 space-y-4'}>
        <h3 className="text-lg font-bold text-white">{text}</h3>
        <p className="text-sm text-gray-400">Bu işlem geri alınamaz.</p>
        <div className="flex gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-xl bg-white/10">Vazgeç</button>
          <button type="button" onClick={onConfirm} className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold">Evet, Sil</button>
        </div>
      </div>
    </div>
  );
}

export const MessagesPanel: React.FC<{ onUnreadChange?: (count: number) => void }> = ({ onUnreadChange }) => {
  const { rows, setRows, loading, error } = useLoad<ContactMessage>('/api/contact/list', (j) => j.messages || []);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const unread = rows.filter((m) => !m.read).length;
  useEffect(() => { if (!loading && !error) onUnreadChange?.(unread); }, [unread, loading, error, onUnreadChange]);

  const markRead = async (id: string) => {
    setActionError('');
    const res = await request('/api/contact/mark-read', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (res.ok) setRows((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    else setActionError('Okundu olarak işaretlenemedi.');
  };
  const remove = async (id: string) => {
    setPendingDelete(null);
    setActionError('');
    const res = await request('/api/contact/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (res.ok) setRows((prev) => prev.filter((m) => m.id !== id));
    else setActionError('Mesaj silinemedi.');
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Gelen Mesajlar</h2>
        <p className="text-gray-400 text-sm mt-1">
          İletişim formundan gelen mesajlar. {rows.length > 0 && <span className="text-[#ff8c42]">{unread} okunmamış</span>}
        </p>
      </div>
      {actionError && <p className="p-3 rounded-xl bg-red-950/20 border border-red-600/30 text-red-300 text-sm">{actionError}</p>}
      <Status loading={loading} error={error} empty={!loading && !error && rows.length === 0} emptyText="Henüz gelen bir mesaj yok." />
      <div className="space-y-3">
        {rows.map((m) => (
          <article key={m.id} className={`${cardClass} p-5 ${m.read ? '' : 'border-[#ff5a1f]/50'}`}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold text-white">{m.name} <span className="text-xs font-normal text-gray-400">({m.email})</span></p>
                <p className="text-xs font-semibold text-[#ff8c42] mt-1">Konu: {m.subject}</p>
              </div>
              <span className="text-xs text-gray-400 font-mono">{formatDate(m.date, true)}</span>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line mt-3">{m.message}</p>
            <div className="flex flex-wrap gap-2 mt-4">
              {!m.read && (
                <button type="button" onClick={() => void markRead(m.id)} className={smallBtn + ' bg-white/10 hover:bg-white/15'}>
                  <MailOpen size={15} />Okundu İşaretle
                </button>
              )}
              <button type="button" onClick={() => setPendingDelete(m.id)} className={smallBtn + ' bg-red-950/40 text-red-400 hover:bg-red-900/40'}>
                <Trash2 size={15} />Sil
              </button>
            </div>
          </article>
        ))}
      </div>
      {pendingDelete && <ConfirmDelete text="Mesajı silmek istiyor musunuz?" onCancel={() => setPendingDelete(null)} onConfirm={() => void remove(pendingDelete)} />}
    </section>
  );
};

export const SubscribersPanel: React.FC = () => {
  const { rows, setRows, loading, error } = useLoad<NewsletterSubscriber>('/api/newsletter/list', (j) => j.subscribers || []);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');

  const remove = async (id: string) => {
    setPendingDelete(null);
    setActionError('');
    const res = await request('/api/newsletter/delete', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }),
    });
    if (res.ok) setRows((prev) => prev.filter((s) => s.id !== id));
    else setActionError('Abone silinemedi.');
  };

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Bülten Aboneleri</h2>
          <p className="text-gray-400 text-sm mt-1">Toplam {rows.length} kayıtlı e-posta adresi.</p>
        </div>
        <a href="/api/newsletter/export" download className={smallBtn + ' bg-white/10 hover:bg-white/15'}>
          <Download size={15} />CSV İndir
        </a>
      </div>
      {actionError && <p className="p-3 rounded-xl bg-red-950/20 border border-red-600/30 text-red-300 text-sm">{actionError}</p>}
      <Status loading={loading} error={error} empty={!loading && !error && rows.length === 0} emptyText="Henüz bülten abonesi yok." />
      {rows.length > 0 && (
        <div className={cardClass + ' overflow-x-auto'}>
          <table className="w-full text-left text-sm">
            <thead className="text-gray-400 border-b border-white/10 text-xs">
              <tr><th className="p-3">E-posta</th><th className="p-3">Kayıt Tarihi</th><th className="p-3 w-12"><span className="sr-only">İşlem</span></th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((s) => (
                <tr key={s.id} className="text-gray-300">
                  <td className="p-3 font-medium text-white break-all">{s.email}</td>
                  <td className="p-3 text-gray-400 font-mono text-xs">{formatDate(s.date)}</td>
                  <td className="p-3">
                    <button type="button" title="Aboneyi sil" onClick={() => setPendingDelete(s.id)} className="p-2 rounded-lg text-red-400 hover:bg-red-950/30"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pendingDelete && <ConfirmDelete text="Aboneyi silmek istiyor musunuz?" onCancel={() => setPendingDelete(null)} onConfirm={() => void remove(pendingDelete)} />}
    </section>
  );
};

export const VersionsPanel: React.FC<{
  isDirty: boolean;
  onRestore: (backupId: string) => Promise<{ success: boolean; message?: string }>;
}> = ({ isDirty, onRestore }) => {
  const { rows, loading, error } = useLoad<BackupRow>('/api/site/backups', (j) => j.backups || []);
  const [pendingRestore, setPendingRestore] = useState<BackupRow | null>(null);
  const [result, setResult] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const restore = async (row: BackupRow) => {
    setPendingRestore(null);
    setBusy(true);
    const r = await onRestore(row.id);
    setBusy(false);
    setResult({ ok: r.success, text: r.message || (r.success ? 'Sürüm taslak olarak geri yüklendi.' : 'Geri yükleme başarısız.') });
  };

  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-xl font-bold">Sürüm Geçmişi</h2>
        <p className="text-gray-400 text-sm mt-1">Her yayında önceki canlı sürüm yedeklenir. Geri yükleme yalnızca taslağı değiştirir; canlıya almak için ayrıca Yayınla'ya basın.</p>
      </div>
      {result && <p role="status" className={`p-3 rounded-xl text-sm border ${result.ok ? 'bg-emerald-950/20 border-emerald-600/30 text-emerald-300' : 'bg-red-950/20 border-red-600/30 text-red-300'}`}>{result.text}</p>}
      <Status loading={loading} error={error} empty={!loading && !error && rows.length === 0} emptyText="Henüz kayıtlı bir sürüm yok. İlk yayından sonra burada görünür." />
      <div className="space-y-3">
        {rows.map((b) => (
          <div key={b.id} className={cardClass + ' p-4 flex flex-wrap items-center justify-between gap-3'}>
            <div>
              <p className="text-sm font-bold text-[#ff8c42]">Sürüm v{b.versionNumber} <span className="ml-2 text-xs font-mono font-normal text-gray-400">{formatDate(b.timestamp, true)}</span></p>
              <p className="text-sm text-gray-300 mt-0.5">{b.note}</p>
            </div>
            <button type="button" disabled={busy} onClick={() => setPendingRestore(b)} className={smallBtn + ' bg-white/10 hover:bg-white/15 disabled:opacity-50'}>
              <RotateCcw size={15} />Taslağa Geri Yükle
            </button>
          </div>
        ))}
      </div>
      {pendingRestore && (
        <div role="dialog" aria-modal="true" className="fixed inset-0 z-[80] bg-black/80 flex justify-center items-center px-4">
          <div className={cardClass + ' w-full max-w-md p-6 space-y-4'}>
            <h3 className="text-lg font-bold text-white">v{pendingRestore.versionNumber} sürümü taslağa yüklensin mi?</h3>
            <p className="text-sm text-gray-400">
              Mevcut taslağın üzerine yazılır.{isDirty && <b className="text-amber-300"> Kaydedilmemiş düzenlemeleriniz de kaybolur.</b>}
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setPendingRestore(null)} className="px-4 py-2 rounded-xl bg-white/10">Vazgeç</button>
              <button type="button" onClick={() => void restore(pendingRestore)} className="px-4 py-2 rounded-xl bg-[#ff5a1f] text-white font-bold">Geri Yükle</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
