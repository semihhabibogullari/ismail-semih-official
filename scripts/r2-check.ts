/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Gerçek R2 değişkenleriyle çalışır: küçük bir test görseli yükler, MEDIA_BASE_URL üzerinden okur, siler.
// Kullanım: npm run r2:check   (anahtarlar asla yazdırılmaz)
import 'dotenv/config';
import crypto from 'crypto';
import sharp from 'sharp';
import { createR2Storage, missingR2Env } from '../server/r2';

const missing = missingR2Env();
if (missing.length) {
  console.error(`R2 kontrolü yapılamadı. Eksik .env değişkenleri: ${missing.join(', ')}`);
  console.error('Bkz. README → "Cloudflare R2 kurulumu".');
  process.exit(1);
}

const baseUrl = process.env.MEDIA_BASE_URL!.trim().replace(/\/+$/, '');
try {
  new URL(baseUrl);
} catch {
  console.error('MEDIA_BASE_URL geçerli bir adres değil (örn. https://cdn.alanadin.com).');
  process.exit(1);
}

const key = `media/_r2check/${crypto.randomUUID()}.webp`;
const url = `${baseUrl}/${key}`;
const cacheControl = 'public, max-age=31536000, immutable';
const storage = createR2Storage();
let uploaded = false;
let failed = false;

try {
  const image = await sharp({ create: { width: 16, height: 16, channels: 3, background: '#ff5a1f' } }).webp().toBuffer();
  await storage.putObject(key, image, 'image/webp', cacheControl);
  uploaded = true;
  console.log('✔ Yükleme başarılı (R2 PutObject).');

  const res = await fetch(url);
  if (res.status !== 200) throw new Error(`MEDIA_BASE_URL üzerinden okuma başarısız: HTTP ${res.status}. Özel alan adının bucket'a bağlı olduğunu kontrol edin.`);
  console.log('✔ MEDIA_BASE_URL üzerinden erişildi (HTTP 200).');
  const cache = res.headers.get('cache-control') || '';
  if (!/max-age=31536000/.test(cache)) {
    console.warn(`! Cache-Control beklenen değerde değil: "${cache || '(yok)'}" (Cloudflare Cache Rules bunu geçersiz kılıyor olabilir).`);
    failed = true;
  } else {
    console.log(`✔ Cache-Control: ${cache}`);
  }
  console.log(`✔ Content-Type: ${res.headers.get('content-type')}`);
} catch (err: any) {
  failed = true;
  console.error('✖ Hata:', err?.name === 'AccessDenied' || err?.Code === 'AccessDenied'
    ? 'Erişim reddedildi (token yetkisini ve bucket adını kontrol edin).'
    : (err?.message || err?.name || 'bilinmeyen hata'));
} finally {
  if (uploaded) {
    try {
      await storage.deleteObject(key);
      console.log('✔ Test nesnesi silindi.');
    } catch {
      failed = true;
      console.error(`✖ Test nesnesi silinemedi, elle silin: ${key}`);
    }
  }
}
process.exit(failed ? 1 : 0);
