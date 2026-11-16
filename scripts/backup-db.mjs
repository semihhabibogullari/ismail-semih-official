// MySQL/MariaDB yedeği: DATABASE_URL'i ayrıştırır, mysqldump çalıştırır, .sql.gz üretir, son 14 yedeği tutar.
// Kullanım (cron): node scripts/backup-db.mjs
// Ortam: DATABASE_URL (zorunlu), BACKUP_DIR (varsayılan ./backups), BACKUP_KEEP (varsayılan 14),
//        MYSQLDUMP_BIN (varsayılan mysqldump), MYSQLDUMP_EXTRA_ARGS (örn. "--no-tablespaces").
// Şifre komut satırına yazılmaz; MYSQL_PWD ortam değişkeniyle iletilir. Hata olursa çıkış kodu 1'dir.
import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { createGzip } from 'node:zlib';
import { pipeline } from 'node:stream/promises';

try { await import('dotenv/config'); } catch { /* dotenv yoksa ortam değişkenleri yeterli */ }

function fail(message) {
  console.error('YEDEK HATASI: ' + message);
  process.exit(1);
}

if (!process.env.DATABASE_URL) fail('DATABASE_URL tanımlı değil.');
let url;
try { url = new URL(process.env.DATABASE_URL); } catch { fail('DATABASE_URL geçerli bir adres değil.'); }
const dbName = decodeURIComponent(url.pathname.replace(/^\//, ''));
const user = decodeURIComponent(url.username);
if (!dbName || !/^[A-Za-z0-9_$.-]+$/.test(dbName)) fail('Veritabanı adı çözümlenemedi.');
if (!user) fail('DATABASE_URL içinde kullanıcı adı yok.');

const keep = Math.max(1, Number(process.env.BACKUP_KEEP) || 14);
const dir = path.resolve(process.env.BACKUP_DIR || 'backups');
fs.mkdirSync(dir, { recursive: true, mode: 0o700 });

const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\..*/, '').replace('T', '-');
const finalPath = path.join(dir, `db-${dbName}-${stamp}.sql.gz`);
const partialPath = finalPath + '.partial';

const args = [
  '--host=' + url.hostname, '--port=' + (url.port || '3306'), '--user=' + user,
  '--single-transaction', '--quick', '--routines', '--default-character-set=utf8mb4',
  ...(process.env.MYSQLDUMP_EXTRA_ARGS ? process.env.MYSQLDUMP_EXTRA_ARGS.split(/\s+/).filter(Boolean) : []),
  dbName,
];
const dump = spawn(process.env.MYSQLDUMP_BIN || 'mysqldump', args, {
  env: { ...process.env, MYSQL_PWD: decodeURIComponent(url.password) },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let stderr = '';
dump.stderr.on('data', (d) => { stderr += String(d); });
const exited = new Promise((resolve) => {
  dump.on('error', (e) => resolve({ spawnError: e }));
  dump.on('close', (code) => resolve({ code }));
});

try {
  await pipeline(dump.stdout, createGzip(), fs.createWriteStream(partialPath, { mode: 0o600 }));
  const result = await exited;
  if (result.spawnError) throw new Error('mysqldump çalıştırılamadı (' + (result.spawnError.code || 'bilinmeyen') + '). Kurulu ve PATH içinde mi?');
  if (result.code !== 0) throw new Error('mysqldump hata kodu ' + result.code + ': ' + stderr.trim().split('\n').slice(-3).join(' | ').replace(/password[^|]*/gi, '***'));
  if (fs.statSync(partialPath).size < 100) throw new Error('Yedek dosyası beklenenden küçük.');
  fs.renameSync(partialPath, finalPath);
} catch (e) {
  fs.rmSync(partialPath, { force: true });
  fail(e?.message || 'bilinmeyen hata');
}

// Eski yedekleri sil: yalnızca bu betiğin adlandırdığı dosyalar, ada göre (zaman damgası) en yeni `keep` tanesi kalır.
const own = fs.readdirSync(dir).filter((f) => /^db-.+-\d{8}-\d{6}\.sql\.gz$/.test(f)).sort();
for (const old of own.slice(0, Math.max(0, own.length - keep))) fs.rmSync(path.join(dir, old), { force: true });
console.log(`Yedek hazır: ${path.basename(finalPath)} (${(fs.statSync(finalPath).size / 1024).toFixed(0)} KB), saklanan yedek: ${Math.min(own.length, keep)}`);
