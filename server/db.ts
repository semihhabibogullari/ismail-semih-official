/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// MySQL bağlantı havuzu ve basit SQL migration sistemi (ORM yok).
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql, { Pool } from 'mysql2/promise';

const MIGRATIONS_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'migrations');

export interface DbConfig {
  host: string;
  port: number;
  user: string;
  password: string;
  database: string;
}

/** DATABASE_URL=mysql://kullanici:sifre@host:3306/veritabani (kullanıcı/şifre URL-encode edilmiş olmalı). */
export function parseDatabaseUrl(raw: string | undefined): DbConfig {
  if (!raw || !raw.trim()) throw new Error('DATABASE_URL tanımlı değil.');
  let url: URL;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new Error('DATABASE_URL geçerli bir adres değil (biçim: mysql://kullanici:sifre@host:3306/veritabani).');
  }
  if (url.protocol !== 'mysql:' && url.protocol !== 'mariadb:') {
    throw new Error('DATABASE_URL "mysql://" ile başlamalıdır.');
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ''));
  if (!url.hostname || !database) throw new Error('DATABASE_URL sunucu ve veritabanı adı içermelidir.');
  try {
    return {
      host: url.hostname.replace(/^\[|\]$/g, ''),
      port: url.port ? Number(url.port) : 3306,
      user: decodeURIComponent(url.username),
      password: decodeURIComponent(url.password),
      database,
    };
  } catch {
    throw new Error('DATABASE_URL içindeki kullanıcı adı/şifre URL-encode edilmelidir (örn. @ → %40, # → %23).');
  }
}

export function createPool(config: DbConfig | undefined = undefined, withDatabase = true): Pool {
  const cfg = config ?? parseDatabaseUrl(process.env.DATABASE_URL);
  const pool = mysql.createPool({
    host: cfg.host,
    port: cfg.port,
    user: cfg.user,
    password: cfg.password,
    ...(withDatabase ? { database: cfg.database } : {}),
    charset: 'utf8mb4',
    timezone: 'Z',
    waitForConnections: true,
    connectionLimit: 10,
    connectTimeout: 10000,
    enableKeepAlive: true,
  });
  // Her bağlantıda oturum saat dilimi UTC.
  pool.pool.on('connection', (conn) => {
    conn.query("SET time_zone = '+00:00'");
  });
  return pool;
}

export async function pingDb(pool: Pool): Promise<void> {
  await pool.query('SELECT 1');
}

/** Bekleyen migration'ları sırayla uygular (schema_migrations tablosunda izlenir). */
export async function runMigrations(pool: Pool): Promise<string[]> {
  const conn = await pool.getConnection();
  const applied: string[] = [];
  try {
    const [lockRows] = await conn.query<any[]>("SELECT GET_LOCK('ismail_semih_migrations', 30) AS got");
    if (Number(lockRows[0]?.got) !== 1) throw new Error('Migration kilidi alınamadı (başka bir süreç çalıştırıyor olabilir).');
    try {
      await conn.query(
        'CREATE TABLE IF NOT EXISTS schema_migrations (' +
          'version VARCHAR(64) NOT NULL, applied_at DATETIME(3) NOT NULL, PRIMARY KEY (version)' +
          ') ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci',
      );
      const [doneRows] = await conn.query<any[]>('SELECT version FROM schema_migrations');
      const done = new Set(doneRows.map((r) => String(r.version)));
      const files = fs.readdirSync(MIGRATIONS_DIR).filter((f) => /^\d+_.+\.sql$/.test(f)).sort();
      for (const file of files) {
        const version = file.replace(/\.sql$/, '');
        if (done.has(version)) continue;
        const sql = fs.readFileSync(path.resolve(MIGRATIONS_DIR, file), 'utf-8')
          .split(/\r?\n/).filter((line) => !line.trim().startsWith('--')).join('\n');
        for (const statement of sql.split(';').map((s) => s.trim()).filter(Boolean)) {
          await conn.query(statement);
        }
        await conn.query('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)', [version, new Date()]);
        applied.push(version);
      }
    } finally {
      await conn.query("SELECT RELEASE_LOCK('ismail_semih_migrations')").catch(() => undefined);
    }
  } finally {
    conn.release();
  }
  return applied;
}

/** Hata metnini şifre içermeden, anlaşılır bir cümleye çevirir. */
export function describeDbError(err: any): string {
  const code = err?.code || err?.name || 'HATA';
  switch (code) {
    case 'ECONNREFUSED': return 'Veritabanı sunucusuna bağlanılamadı (bağlantı reddedildi). Sunucunun çalıştığını ve DATABASE_URL içindeki adres/portu kontrol edin.';
    case 'ENOTFOUND': return 'Veritabanı sunucusu adı çözümlenemedi. DATABASE_URL içindeki sunucu adını kontrol edin.';
    case 'ETIMEDOUT': return 'Veritabanı sunucusuna bağlanırken zaman aşımı oluştu.';
    case 'ER_ACCESS_DENIED_ERROR': return 'Veritabanı kullanıcı adı veya şifresi hatalı.';
    case 'ER_BAD_DB_ERROR': return 'Veritabanı bulunamadı. DATABASE_URL içindeki veritabanı adını kontrol edin.';
    case 'ER_DBACCESS_DENIED_ERROR': return 'Kullanıcının bu veritabanına erişim yetkisi yok.';
    default: return `Veritabanı hatası (${code}).`;
  }
}
