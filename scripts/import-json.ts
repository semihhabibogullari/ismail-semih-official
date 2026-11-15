/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Eski JSON verisini MySQL'e aktarır. Kullanım: npm run db:import-json [-- <veri-klasörü>] [--force]
//   data/site-data.json, draft-data.json, backups/*.json, messages.json, subscribers.json
// Dosya yoksa atlanır. Tekrar çalıştırılabilir: mesaj/abone/sürüm kayıtları kimliğe göre tekrarlanmaz,
// yayın/taslak yalnızca veritabanındaki içerik hâlâ ilk tohum halindeyse (veya --force ile) yazılır.
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createPool, describeDbError, runMigrations } from '../server/db';
import { initialSiteData } from '../src/data/initialData';
import { MAX_VERSIONS, migrateSiteData, pruneVersions, writeDocument } from '../server/store';

const args = process.argv.slice(2);
const force = args.includes('--force');
const dirArg = args.find((a) => !a.startsWith('--'));
const dataDir = path.resolve(dirArg || 'data');

function readJson<T>(file: string): T | null {
  if (!fs.existsSync(file)) return null;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf-8')) as T;
  } catch {
    console.warn(`  ! ${path.basename(file)} okunamadı (geçerli JSON değil), atlandı.`);
    return null;
  }
}

function toDate(value: unknown): Date {
  const d = new Date(typeof value === 'string' || typeof value === 'number' ? value : NaN);
  return Number.isNaN(d.getTime()) ? new Date() : d;
}

// Gömülü görsel (data:image/...) ve uploads/ yolu taraması (Aşama 6 için bulgu; veri değiştirilmez).
const findings = { base64Count: 0, base64Bytes: 0, uploadRefs: 0, uploadPaths: new Set<string>() };
function scan(value: unknown): void {
  if (typeof value === 'string') {
    if (value.startsWith('data:image/')) {
      findings.base64Count++;
      findings.base64Bytes += Buffer.byteLength(value);
    } else {
      for (const m of value.matchAll(/\/uploads\/[^\s"'<>)]+/g)) {
        findings.uploadRefs++;
        findings.uploadPaths.add(m[0]);
      }
    }
  } else if (Array.isArray(value)) value.forEach(scan);
  else if (value && typeof value === 'object') Object.values(value).forEach(scan);
}

async function main() {
  const pool = createPool();
  try {
    const applied = await runMigrations(pool);
    if (applied.length) console.log(`Migration uygulandı: ${applied.join(', ')}`);
    console.log(`Veri klasörü: ${dataDir}`);

    const seed = JSON.stringify(migrateSiteData(initialSiteData, initialSiteData));
    const [docRows] = await pool.query<any[]>('SELECT kind, data FROM site_documents');
    const stored = new Map<string, string>(docRows.map((r) => [String(r.kind), String(r.data)]));
    const isSeedOnly = (kind: string) => {
      const raw = stored.get(kind);
      if (raw === undefined) return true;
      try { return JSON.stringify(migrateSiteData(JSON.parse(raw), initialSiteData)) === seed; } catch { return true; }
    };

    // Yayın ve taslak
    const publishedRaw = readJson<any>(path.join(dataDir, 'site-data.json'));
    const draftRaw = readJson<any>(path.join(dataDir, 'draft-data.json'));
    let publishedData = publishedRaw ? migrateSiteData(publishedRaw, initialSiteData) : null;
    if (publishedData) {
      scan(publishedData);
      if (force || isSeedOnly('published')) {
        await writeDocument(pool, 'published', publishedData);
        console.log(`  ✔ yayındaki içerik aktarıldı (sürüm ${publishedData.version}).`);
      } else {
        console.log('  - yayındaki içerik atlandı (veritabanında zaten özel içerik var; --force ile zorlayın).');
      }
    }
    if (draftRaw) {
      const draftData = migrateSiteData(draftRaw, publishedData || initialSiteData);
      scan(draftData);
      if (force || isSeedOnly('draft')) {
        await writeDocument(pool, 'draft', draftData);
        console.log('  ✔ taslak aktarıldı.');
      } else {
        console.log('  - taslak atlandı (veritabanında zaten özel taslak var; --force ile zorlayın).');
      }
    }

    // Sürümler (backups/*.json)
    const backupsDir = path.join(dataDir, 'backups');
    let versions = 0;
    if (fs.existsSync(backupsDir)) {
      for (const file of fs.readdirSync(backupsDir).filter((f) => f.endsWith('.json'))) {
        const b = readJson<any>(path.join(backupsDir, file));
        if (!b?.data) continue;
        const id = typeof b.id === 'string' && /^version_v\d+_\d+$/.test(b.id) ? b.id : path.basename(file, '.json');
        if (!/^version_v\d+_\d+$/.test(id)) continue;
        const data = migrateSiteData(b.data, initialSiteData);
        scan(data);
        const [r] = await pool.query<any>(
          'INSERT IGNORE INTO content_versions (id, version_number, note, data, created_at) VALUES (?, ?, ?, ?, ?)',
          [id, Number(b.versionNumber) || 0, String(b.note || 'Otomatik Sürüm Yedeklemesi').slice(0, 255), JSON.stringify(data), toDate(b.timestamp)],
        );
        versions += r.affectedRows;
      }
      await pruneVersions(pool);
      console.log(`  ✔ ${versions} yeni sürüm aktarıldı (en fazla ${MAX_VERSIONS} sürüm tutulur).`);
    }

    // Mesajlar
    const messages = readJson<any[]>(path.join(dataDir, 'messages.json'));
    if (Array.isArray(messages)) {
      let n = 0;
      for (const m of messages) {
        if (!m || typeof m.id !== 'string' || typeof m.email !== 'string') continue;
        const [r] = await pool.query<any>(
          'INSERT IGNORE INTO messages (id, name, email, subject, message, is_read, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [m.id.slice(0, 64), String(m.name ?? '').slice(0, 100), m.email.slice(0, 254), String(m.subject || 'Genel İletişim').slice(0, 150),
            String(m.message ?? ''), m.read ? 1 : 0, toDate(m.date)],
        );
        n += r.affectedRows;
      }
      console.log(`  ✔ ${n} yeni mesaj aktarıldı.`);
    }

    // Aboneler
    const subscribers = readJson<any[]>(path.join(dataDir, 'subscribers.json'));
    if (Array.isArray(subscribers)) {
      let n = 0;
      for (const s of subscribers) {
        if (!s || typeof s.id !== 'string' || typeof s.email !== 'string') continue;
        const when = toDate(s.date);
        const [r] = await pool.query<any>(
          'INSERT IGNORE INTO subscribers (id, email, consent_at, created_at) VALUES (?, ?, ?, ?)',
          [s.id.slice(0, 64), s.email.toLowerCase().slice(0, 254), when, when],
        );
        n += r.affectedRows;
      }
      console.log(`  ✔ ${n} yeni abone aktarıldı.`);
    }

    console.log('\nİçerik tarama (DEĞİŞTİRİLMEDİ, Aşama 6 için bilgi):');
    console.log(`  Gömülü base64 görsel: ${findings.base64Count} adet, toplam ${(findings.base64Bytes / 1024).toFixed(1)} KB`);
    console.log(`  /uploads/ yolu referansı: ${findings.uploadRefs} adet (${findings.uploadPaths.size} benzersiz yol)`);
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Aktarım başarısız:', err?.code ? describeDbError(err) : (err?.message || 'bilinmeyen hata'));
  process.exit(1);
});
