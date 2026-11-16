/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Medya yükleme işleme ve medya kayıtları. Nesneler R2'de (MediaStorage), kayıtlar MySQL `media` tablosunda.
// Sunucu diskine hiçbir şey yazılmaz (multer memoryStorage).
import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import sharp from 'sharp';
import type { Pool, RowDataPacket } from 'mysql2/promise';
import type { MediaStorage } from './r2';

export const MAX_UPLOAD_BYTES = 30 * 1024 * 1024;
const MAX_IMAGE_WIDTH = 2560;
const CACHE_CONTROL = 'public, max-age=31536000, immutable';

export class MediaError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export const MEDIA_NOT_CONFIGURED = 'Medya depolama yapılandırılmamış.';
const UNSUPPORTED = 'Desteklenmeyen dosya türü. JPG, PNG, WebP, GIF, AVIF, MP4 veya WebM kullanın.';

export interface DetectedType { kind: 'image' | 'video'; mime: string; ext: string }

/** Dosya türünü Content-Type'a değil, dosya imzasına (magic byte) göre belirler. */
export function detectType(buf: Buffer): DetectedType | null {
  if (buf.length < 12) return null;
  const ascii = (from: number, to: number) => buf.toString('latin1', from, to);
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { kind: 'image', mime: 'image/jpeg', ext: 'jpg' };
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { kind: 'image', mime: 'image/png', ext: 'png' };
  if (ascii(0, 6) === 'GIF87a' || ascii(0, 6) === 'GIF89a') return { kind: 'image', mime: 'image/gif', ext: 'gif' };
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return { kind: 'image', mime: 'image/webp', ext: 'webp' };
  if (ascii(4, 8) === 'ftyp') {
    const brand = ascii(8, 12);
    if (brand === 'avif' || brand === 'avis') return { kind: 'image', mime: 'image/avif', ext: 'avif' };
    if (['heic', 'heix', 'hevc', 'hevx', 'mif1', 'msf1', 'qt  ', '3gp4', '3gp5', '3g2a'].includes(brand)) return null;
    return { kind: 'video', mime: 'video/mp4', ext: 'mp4' };
  }
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3 && buf.subarray(0, 64).includes('webm')) {
    return { kind: 'video', mime: 'video/webm', ext: 'webm' };
  }
  return null;
}

interface ProcessedImage { data: Buffer; width: number; height: number }

/** EXIF yönünü düzeltir, meta verileri siler, 2560 px'i aşıyorsa küçültür (büyütme yok), WebP'ye çevirir. */
async function processImage(input: Buffer, type: DetectedType): Promise<ProcessedImage> {
  try {
    const animated = type.ext === 'gif' || type.ext === 'webp';
    const { data, info } = await sharp(input, { animated, failOn: 'error' })
      .rotate()
      .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer({ resolveWithObject: true });
    const pages = info.pages && info.pages > 1 ? info.pages : 1;
    const height = (info as { pageHeight?: number }).pageHeight ?? Math.round(info.height / pages);
    return { data, width: info.width, height };
  } catch {
    throw new MediaError(400, 'Görsel dosyası okunamadı veya bozuk.');
  }
}

export interface MediaRecord { filename: string; url: string; size: number; createdAt: string }
export interface UploadResult {
  filename: string; originalName: string; size: number; mimetype: string; url: string; uploadedAt: string;
}

export interface MediaService {
  upload(file: { buffer: Buffer; originalname: string }): Promise<UploadResult>;
  list(): Promise<MediaRecord[]>;
  remove(filename: string): Promise<boolean>;
}

export function createMediaService(opts: { pool: Pool; storage: MediaStorage; baseUrl: string }): MediaService {
  const { pool, storage } = opts;
  const baseUrl = opts.baseUrl.replace(/\/+$/, '');
  return {
    async upload(file) {
      const detected = detectType(file.buffer);
      if (!detected) throw new MediaError(400, UNSUPPORTED);

      let body = file.buffer;
      let mime = detected.mime;
      let ext = detected.ext;
      let width: number | null = null;
      let height: number | null = null;
      if (detected.kind === 'image') {
        const processed = await processImage(file.buffer, detected);
        body = processed.data; mime = 'image/webp'; ext = 'webp';
        width = processed.width; height = processed.height;
      }

      const now = new Date();
      const id = crypto.randomUUID();
      const key = `media/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${id}.${ext}`;
      const url = `${baseUrl}/${key}`;

      // R2 başarısız olursa DB kaydı oluşmaz; DB başarısız olursa yüklenen nesne geri silinir.
      await storage.putObject(key, body, mime, CACHE_CONTROL);
      try {
        await pool.query(
          'INSERT INTO media (id, object_key, url, original_name, mime, size_bytes, width, height, kind, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [id, key, url, (file.originalname || 'dosya').slice(0, 255), mime, body.length, width, height, detected.kind, now],
        );
      } catch (err) {
        await storage.deleteObject(key).catch(() => undefined);
        throw err;
      }
      return { filename: `${id}.${ext}`, originalName: file.originalname, size: body.length, mimetype: mime, url, uploadedAt: now.toISOString() };
    },

    async list() {
      const [rows] = await pool.query<RowDataPacket[]>('SELECT object_key, url, size_bytes, created_at FROM media ORDER BY created_at DESC, id DESC');
      return rows.map((r) => ({
        filename: String(r.object_key).split('/').pop() as string,
        url: String(r.url),
        size: Number(r.size_bytes),
        createdAt: new Date(r.created_at).toISOString(),
      }));
    },

    async remove(filename) {
      if (!/^[0-9a-f-]{36}\.[a-z0-9]{2,5}$/.test(filename)) return false;
      const [rows] = await pool.query<RowDataPacket[]>('SELECT id, object_key FROM media WHERE id = ?', [filename.slice(0, 36)]);
      const row = rows.find((r) => String(r.object_key).endsWith(`/${filename}`));
      if (!row) return false;
      await storage.deleteObject(String(row.object_key));
      await pool.query('DELETE FROM media WHERE id = ?', [row.id]);
      return true;
    },
  };
}

/** Bellekte sahte depo: yalnızca testler içindir (MEDIA_STORAGE=memory). */
export function createMemoryStorage(): MediaStorage & { objects: Map<string, { body: Buffer; contentType: string }> } {
  const objects = new Map<string, { body: Buffer; contentType: string }>();
  return {
    objects,
    async putObject(key, body, contentType) { objects.set(key, { body, contentType }); },
    async deleteObject(key) { objects.delete(key); },
  };
}

// multer: dosya bellekte tutulur, diske yazılmaz.
const multerUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_UPLOAD_BYTES, files: 1 } }).single('file');

export function parseUpload(req: Request, res: Response, next: NextFunction) {
  multerUpload(req, res, (err: unknown) => {
    if (!err) return next();
    if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Dosya 30 MB sınırını aşıyor.' });
    }
    return res.status(400).json({ error: 'Dosya yüklenemedi.' });
  });
}

/** Oturum başına yükleme sınırı (bellek içi): 10 dakikada en fazla `max` yükleme. */
export function createUploadLimiter(max = 60, windowMs = 10 * 60 * 1000) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, windowMs).unref();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = typeof req.cookies?.admin_session === 'string' ? req.cookies.admin_session : req.ip || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) { entry = { count: 0, resetAt: now + windowMs }; hits.set(key, entry); }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Çok fazla yükleme yaptınız. Lütfen biraz bekleyiniz.' });
    }
    next();
  };
}
