/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Veri erişimi: site içeriği (tek SiteData belgesi), sürümler, mesajlar, aboneler, oturumlar.
// Yayındaki içerik ve taslak bellekte tutulur (write-through): ziyaretçi istekleri DB'ye gitmez.
// Tek süreç varsayımı: önbellek yalnızca bu süreçteki yazmalarla güncellenir.
import crypto from 'crypto';
import type { Pool, PoolConnection, RowDataPacket } from 'mysql2/promise';
import { initialSiteData } from '../src/data/initialData';
import { SiteData } from '../src/types';

export const MAX_VERSIONS = 20;

// Site is Turkish-only: drop every legacy "*_en" key (recursively) from any loaded
// SiteData (published, draft, versions, imports) so old data still opens cleanly.
export function stripEnglishKeys<T>(value: T): T {
  if (Array.isArray(value)) return value.map((item) => stripEnglishKeys(item)) as unknown as T;
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      if (key.endsWith('_en')) continue;
      out[key] = stripEnglishKeys(val);
    }
    return out as T;
  }
  return value;
}

// Deep merge helper to ensure backward compatibility with earlier data
export function migrateSiteData(rawExisting: any, defaults: SiteData): SiteData {
  const existing = stripEnglishKeys(rawExisting);
  if (!existing || typeof existing !== 'object') return defaults;

  // Never copy credential fields into public site data, drafts, or versions.
  // Legacy Instagram API fields (token, connected, autoSync) are dropped from stored data.
  const {
    accessToken: _legacyToken, tokenExpiresAt: _legacyExpiry, connected: _legacyConnected, autoSync: _legacyAutoSync,
    ...safeInstagramSettings
  } = existing.settings?.instagramSettings || {};

  return {
    ...defaults,
    ...existing,
    settings: {
      ...defaults.settings,
      ...(existing.settings || {}),
      darkTheme: {
        ...defaults.settings.darkTheme,
        ...(existing.settings?.darkTheme || {}),
      },
      lightTheme: {
        ...defaults.settings.lightTheme,
        ...(existing.settings?.lightTheme || {}),
      },
      typography: {
        ...defaults.settings.typography,
        ...(existing.settings?.typography || {}),
      },
      sliderSettings: {
        ...defaults.settings.sliderSettings,
        ...(existing.settings?.sliderSettings || {}),
      },
      instagramSettings: {
        ...defaults.settings.instagramSettings,
        ...safeInstagramSettings,
      },
    },
    sections: existing.sections && existing.sections.length > 0
      ? (existing.sections.some((s: any) => s.type === 'instagram')
          ? existing.sections
          : [
              ...existing.sections.slice(0, 3),
              defaults.sections.find((s) => s.type === 'instagram')!,
              ...existing.sections.slice(3),
            ].map((s: any, idx: number) => ({ ...s, order: idx + 1 })))
      : defaults.sections,
    instagramPosts: Array.isArray(existing.instagramPosts)
      ? existing.instagramPosts
      : defaults.instagramPosts,
    about: {
      ...defaults.about,
      ...(existing.about && typeof existing.about === 'object' ? existing.about : {}),
      skills: Array.isArray(existing.about?.skills) ? existing.about.skills : defaults.about.skills,
      plays: Array.isArray(existing.about?.plays) ? existing.about.plays : defaults.about.plays,
    },
  };
}

let pool: Pool;
let published: SiteData;
let draft: SiteData;

// Yazmaları sırayla çalıştırır (okuma-değiştirme-yazma yarışlarını önler).
let queue: Promise<unknown> = Promise.resolve();
function serialized<T>(fn: () => Promise<T>): Promise<T> {
  const run = queue.then(fn);
  queue = run.catch(() => undefined);
  return run;
}

async function transaction<T>(fn: (conn: PoolConnection) => Promise<T>): Promise<T> {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const result = await fn(conn);
    await conn.commit();
    return result;
  } catch (err) {
    await conn.rollback().catch(() => undefined);
    throw err;
  } finally {
    conn.release();
  }
}

type Queryable = Pick<Pool, 'query'>;

export async function writeDocument(db: Queryable, kind: 'published' | 'draft', data: SiteData): Promise<void> {
  const json = JSON.stringify(data);
  const version = Number.isInteger(data.version) ? data.version : 1;
  const now = new Date();
  await db.query(
    'INSERT INTO site_documents (kind, data, `version`, updated_at) VALUES (?, ?, ?, ?) ' +
      'ON DUPLICATE KEY UPDATE data = ?, `version` = ?, updated_at = ?',
    [kind, json, version, now, json, version, now],
  );
}

export async function pruneVersions(db: Queryable): Promise<void> {
  await db.query(
    'DELETE FROM content_versions WHERE id NOT IN (' +
      'SELECT id FROM (SELECT id FROM content_versions ORDER BY created_at DESC, id DESC LIMIT ?) AS keep_rows)',
    [MAX_VERSIONS],
  );
}

/** Tablolar boşsa yayın ve taslak initialSiteData'dan tohumlanır; sonra belgeler belleğe alınır. */
export async function initStore(p: Pool): Promise<void> {
  pool = p;
  const [rows] = await pool.query<RowDataPacket[]>('SELECT kind, data FROM site_documents');
  const stored = new Map<string, string>(rows.map((r) => [String(r.kind), String(r.data)]));
  const parse = (kind: string, fallback: SiteData): SiteData => {
    const raw = stored.get(kind);
    if (raw === undefined) return fallback;
    try {
      return migrateSiteData(JSON.parse(raw), fallback);
    } catch {
      throw new Error(`site_documents tablosundaki "${kind}" belgesi geçerli JSON değil.`);
    }
  };
  if (!stored.has('published')) {
    published = migrateSiteData(initialSiteData, initialSiteData);
    await writeDocument(pool, 'published', published);
  } else {
    published = parse('published', initialSiteData);
  }
  if (!stored.has('draft')) {
    draft = { ...published };
    await writeDocument(pool, 'draft', draft);
  } else {
    draft = parse('draft', published);
  }
}

export const getPublished = (): SiteData => published;
export const getDraft = (): SiteData => draft;

/** Taslağı değiştirir: mutator mevcut taslağı alır, yeni taslağı döndürür. */
export function updateDraft(mutator: (current: SiteData) => SiteData): Promise<SiteData> {
  return serialized(async () => {
    const next = mutator(draft);
    await writeDocument(pool, 'draft', next);
    draft = next;
    return draft;
  });
}

/** Sürüm snapshot'ı + yayın + taslak güncelleme + eski sürüm temizliği tek transaction'da. */
export function publishDraft(note: string): Promise<SiteData> {
  return serialized(async () => {
    const oldVersion = published.version || 1;
    const now = new Date();
    const next: SiteData = { ...draft, version: oldVersion + 1, updatedAt: now.toISOString() };
    const nextDraft: SiteData = { ...next };
    await transaction(async (conn) => {
      await conn.query(
        'INSERT INTO content_versions (id, version_number, note, data, created_at) VALUES (?, ?, ?, ?, ?)',
        [`version_v${oldVersion}_${now.getTime()}`, oldVersion, note.slice(0, 255), JSON.stringify(published), now],
      );
      await writeDocument(conn, 'published', next);
      await writeDocument(conn, 'draft', nextDraft);
      await pruneVersions(conn);
    });
    published = next;
    draft = nextDraft;
    return published;
  });
}

export interface VersionInfo { id: string; timestamp: string; versionNumber: number; note: string }

export async function listVersions(): Promise<VersionInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, version_number, note, created_at FROM content_versions ORDER BY created_at DESC, id DESC',
  );
  return rows.map((r) => ({
    id: String(r.id),
    timestamp: new Date(r.created_at).toISOString(),
    versionNumber: Number(r.version_number),
    note: String(r.note) || 'Otomatik Sürüm Yedeklemesi',
  }));
}

export async function getVersion(id: string): Promise<{ versionNumber: number; data: any } | null> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT version_number, data FROM content_versions WHERE id = ?', [id],
  );
  if (!rows.length) return null;
  const versionNumber = Number(rows[0].version_number);
  try {
    return { versionNumber, data: JSON.parse(String(rows[0].data)) };
  } catch {
    return { versionNumber, data: null };
  }
}

// --- Mesajlar ---
export interface MessageRecord { id: string; name: string; email: string; subject: string; message: string; date: string; read: boolean }

const newId = (prefix: string) => `${prefix}_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;

export async function addMessage(m: { name: string; email: string; subject: string; message: string }): Promise<void> {
  await pool.query(
    'INSERT INTO messages (id, name, email, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, 0, ?)',
    [newId('msg'), m.name, m.email, m.subject, m.message, new Date()],
  );
}

export async function listMessages(): Promise<MessageRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, name, email, subject, message, is_read, created_at FROM messages ORDER BY created_at DESC, id DESC',
  );
  return rows.map((r) => ({
    id: String(r.id), name: String(r.name), email: String(r.email), subject: String(r.subject),
    message: String(r.message), date: new Date(r.created_at).toISOString(), read: Boolean(r.is_read),
  }));
}

export async function markMessageRead(id: unknown): Promise<void> {
  if (typeof id !== 'string') return;
  await pool.query('UPDATE messages SET is_read = 1 WHERE id = ?', [id]);
}

export async function deleteMessage(id: unknown): Promise<void> {
  if (typeof id !== 'string') return;
  await pool.query('DELETE FROM messages WHERE id = ?', [id]);
}

// --- Aboneler ---
export interface SubscriberRecord { id: string; email: string; date: string; confirmed: boolean }

/** Yeni kayıtsa true, e-posta zaten varsa false döner. */
export async function addSubscriber(email: string): Promise<boolean> {
  const now = new Date();
  try {
    await pool.query(
      'INSERT INTO subscribers (id, email, consent_at, created_at) VALUES (?, ?, ?, ?)',
      [newId('sub'), email.toLowerCase(), now, now],
    );
    return true;
  } catch (err: any) {
    if (err?.code === 'ER_DUP_ENTRY') return false;
    throw err;
  }
}

export async function listSubscribers(): Promise<SubscriberRecord[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT id, email, created_at FROM subscribers ORDER BY created_at DESC, id DESC',
  );
  return rows.map((r) => ({ id: String(r.id), email: String(r.email), date: new Date(r.created_at).toISOString(), confirmed: true }));
}

export async function deleteSubscriber(id: string): Promise<void> {
  await pool.query('DELETE FROM subscribers WHERE id = ?', [id]);
}

// --- Oturumlar (ham token değil, sha256 özeti saklanır) ---
const hashToken = (token: string) => crypto.createHash('sha256').update(token).digest('hex');

export async function createSession(token: string, expiresAt: Date): Promise<void> {
  await pool.query(
    'INSERT INTO admin_sessions (token_hash, expires_at, created_at) VALUES (?, ?, ?)',
    [hashToken(token), expiresAt, new Date()],
  );
}

export async function sessionIsValid(token: string): Promise<boolean> {
  const [rows] = await pool.query<RowDataPacket[]>(
    'SELECT 1 AS ok FROM admin_sessions WHERE token_hash = ? AND expires_at > ?',
    [hashToken(token), new Date()],
  );
  return rows.length > 0;
}

export async function deleteSession(token: string): Promise<void> {
  await pool.query('DELETE FROM admin_sessions WHERE token_hash = ?', [hashToken(token)]);
}

export async function purgeExpiredSessions(): Promise<void> {
  await pool.query('DELETE FROM admin_sessions WHERE expires_at <= ?', [new Date()]);
}
