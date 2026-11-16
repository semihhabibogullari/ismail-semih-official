// Medya hizmeti birim testi: sahte saklama katmanı ve sahte havuz enjekte edilir, R2/MySQL'e bağlanılmaz.
// Çalıştırma: node --import tsx scripts/test-media.mjs
import assert from 'node:assert/strict';
import sharp from 'sharp';
import { createMediaService, createMemoryStorage, detectType } from '../server/media.ts';

const frame = (color) => sharp({ create: { width: 20, height: 20, channels: 3, background: color } }).raw().toBuffer();
const gif = await sharp(Buffer.concat([await frame('red'), await frame('blue')]), { raw: { width: 20, height: 40, channels: 3, pageHeight: 20 } }).gif().toBuffer();
const rotated = await sharp({ create: { width: 40, height: 20, channels: 3, background: '#00f' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();

const calls = [];
const pool = { query: async (sql, params) => { calls.push({ sql, params }); return [[]]; } };
const storage = createMemoryStorage();
const service = createMediaService({ pool, storage, baseUrl: 'https://cdn.example.com/' });

// Animated GIF stays animated (WebP with 2 frames).
const g = await service.upload({ buffer: gif, originalname: 'anim.gif' });
const stored = [...storage.objects.entries()].find(([k]) => g.url.endsWith(k));
assert.ok(g.url.startsWith('https://cdn.example.com/media/') && g.url.endsWith('.webp'), 'single slash, .webp');
assert.equal(stored[1].contentType, 'image/webp');
assert.equal((await sharp(stored[1].body, { animated: true }).metadata()).pages, 2, 'animation preserved');

// EXIF orientation is applied (40x20 + orientation 6 -> 20x40) and metadata stripped.
const r = await service.upload({ buffer: rotated, originalname: 'photo.jpg' });
const rm = await sharp([...storage.objects.values()].at(-1).body).metadata();
assert.deepEqual([rm.width, rm.height], [20, 40]);
assert.equal(rm.exif, undefined, 'EXIF removed');
assert.equal(calls.at(-1).params[6], 20); assert.equal(calls.at(-1).params[7], 40);

// No upscaling of small images.
await service.upload({ buffer: await sharp({ create: { width: 100, height: 50, channels: 3, background: '#fff' } }).png().toBuffer(), originalname: 's.png' });
assert.equal(calls.at(-1).params[6], 100);

// Signature detection.
assert.equal(detectType(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"></svg>')), null);
assert.equal(detectType(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypavif'), Buffer.alloc(20)])).ext, 'avif');
assert.equal(detectType(Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypheic'), Buffer.alloc(20)])), null);
assert.equal(detectType(Buffer.concat([Buffer.from([0x1a, 0x45, 0xdf, 0xa3]), Buffer.from('....B\x82webm'), Buffer.alloc(20)])).ext, 'webm');

// Storage failure: no database record is created.
const failingStorage = { putObject: async () => { throw new Error('r2 down'); }, deleteObject: async () => {} };
const before = calls.length;
await assert.rejects(createMediaService({ pool, storage: failingStorage, baseUrl: 'https://x.test' }).upload({ buffer: await sharp({ create: { width: 4, height: 4, channels: 3, background: '#000' } }).png().toBuffer(), originalname: 'x.png' }), /r2 down/);
assert.equal(calls.length, before, 'no INSERT after a failed upload to storage');

// Database failure: the uploaded object is deleted again.
const deleted = [];
const trackingStorage = { putObject: async () => {}, deleteObject: async (key) => { deleted.push(key); } };
const badPool = { query: async () => { throw new Error('db down'); } };
await assert.rejects(createMediaService({ pool: badPool, storage: trackingStorage, baseUrl: 'https://x.test' }).upload({ buffer: await sharp({ create: { width: 4, height: 4, channels: 3, background: '#000' } }).png().toBuffer(), originalname: 'x.png' }), /db down/);
assert.equal(deleted.length, 1, 'orphaned object is removed when the DB insert fails');
assert.match(deleted[0], /^media\/\d{4}\/\d{2}\/[0-9a-f-]{36}\.webp$/);

console.log('PASS: media service (animated GIF, EXIF rotate, no upscale, signatures, rollback on storage/DB failure).');
