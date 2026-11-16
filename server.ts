/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initialSiteData } from './src/data/initialData';
import { SiteData } from './src/types';
import { createPool, describeDbError, pingDb, runMigrations } from './server/db';
import * as store from './server/store';
import { createMediaService, createMemoryStorage, createUploadLimiter, MEDIA_NOT_CONFIGURED, MediaError, MediaService, parseUpload } from './server/media';
import { createR2Storage, missingR2Env } from './server/r2';
import { migrateSiteData } from './server/store';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const pool = (() => {
  try {
    return createPool();
  } catch (err: any) {
    console.error('Veritabanı ayarı hatalı:', err?.message || 'bilinmeyen hata');
    process.exit(1);
  }
})();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Behind a reverse proxy (Plesk/nginx) set TRUST_PROXY=1 so req.ip is the real client address.
const TRUST_PROXY = Number(process.env.TRUST_PROXY);
if (Number.isInteger(TRUST_PROXY) && TRUST_PROXY > 0) app.set('trust proxy', TRUST_PROXY);

// Optional media origin (e.g. an R2 / CDN domain) that images, audio and video may load from.
function configuredMediaOrigin(): string | null {
  const raw = process.env.MEDIA_BASE_URL?.trim();
  if (!raw) return null;
  try {
    const parsed = new URL(raw);
    return ['http:', 'https:'].includes(parsed.protocol) ? parsed.origin : null;
  } catch {
    console.warn('MEDIA_BASE_URL geçerli bir adres değil, yok sayıldı.');
    return null;
  }
}
const MEDIA_ORIGIN = configuredMediaOrigin();

// Media storage: Cloudflare R2 (see server/r2.ts). Nothing is ever written to the server disk.
// MEDIA_STORAGE=memory swaps in a fake in-memory store for automated tests only.
const MEDIA_MEMORY_MODE = process.env.MEDIA_STORAGE === 'memory';
if (MEDIA_MEMORY_MODE && IS_PROD) {
  console.error('MEDIA_STORAGE=memory yalnızca testler içindir ve NODE_ENV=production iken kullanılamaz.');
  process.exit(1);
}
let mediaService: MediaService | null = null;

// Authentication: the single admin account comes from ADMIN_USERNAME / ADMIN_PASSWORD (.env).
// A scrypt digest of the password is generated in memory at startup; the plain value is never stored.
function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || 'ismailsemih';

let adminCredential: { salt: string; hash: string } | null = null;
const bootstrapPassword = process.env.ADMIN_PASSWORD;
if (bootstrapPassword) {
  if (bootstrapPassword.length < 12 || bootstrapPassword.length > 1024) {
    throw new Error('ADMIN_PASSWORD 12–1024 karakter olmalıdır.');
  }
  const salt = crypto.randomBytes(32).toString('hex');
  adminCredential = { salt, hash: hashPassword(bootstrapPassword, salt) };
} else {
  console.warn('Yönetici girişi kapalı: ADMIN_PASSWORD gizli ayarını kullanın.');
}

function passwordMatches(password: string): boolean {
  if (!adminCredential) return false;
  const candidate = Buffer.from(hashPassword(password, adminCredential.salt), 'hex');
  const expected = Buffer.from(adminCredential.hash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

// Sessions are opaque, HttpOnly-cookie-only and stored in MySQL as a sha256 hash with a server-side expiry.
// Rate-limit counters below stay in memory: this app assumes a single server process.
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

async function sessionToken(req: Request): Promise<string | null> {
  const token: unknown = req.cookies?.admin_session;
  if (typeof token !== 'string' || !/^[0-9a-f]{64}$/.test(token)) return null;
  return (await store.sessionIsValid(token)) ? token : null;
}

// Express 4 does not catch rejected promises: wrap async handlers so DB errors answer with JSON 500.
type AsyncHandler = (req: Request, res: Response, next: NextFunction) => Promise<unknown>;
const ah = (fn: AsyncHandler) => (req: Request, res: Response, next: NextFunction) => {
  fn(req, res, next).catch(next);
};

// Express Middlewares
app.disable('x-powered-by');

// Security headers. The CSP is only sent in production: the Vite dev server needs inline
// scripts and a websocket for hot reload, which a strict policy would block.
const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN', // the admin preview is a same-origin iframe
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
};
if (IS_PROD) SECURITY_HEADERS['Strict-Transport-Security'] = 'max-age=31536000';
const mediaSource = MEDIA_ORIGIN ? ` ${MEDIA_ORIGIN}` : '';
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com",
  "img-src 'self' data: https:" + mediaSource,
  "media-src 'self' https:" + mediaSource,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://open.spotify.com https://www.instagram.com https://challenges.cloudflare.com",
  "connect-src 'self' https://challenges.cloudflare.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join('; ');
app.use((_req: Request, res: Response, next: NextFunction) => {
  for (const [name, value] of Object.entries(SECURITY_HEADERS)) res.setHeader(name, value);
  if (IS_PROD) res.setHeader('Content-Security-Policy', CONTENT_SECURITY_POLICY);
  next();
});

// Request bodies: 50 KB everywhere, 5 MB only for the authenticated admin draft/import uploads.
const smallJson = express.json({ limit: '50kb' });
const adminJson = express.json({ limit: '5mb' });
app.use(cookieParser());
app.use('/api', ah(async (req: Request, res: Response, next: NextFunction) => {
  const bigAdminUpload = req.method === 'POST' && ['/site/draft', '/site/import'].includes(req.path);
  if (!bigAdminUpload) return smallJson(req, res, next);
  // Never buffer a large body for an anonymous visitor.
  if (!(await sessionToken(req))) return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapınız.' });
  return adminJson(req, res, next);
}));
// Reject cross-origin state changes made with browser cookies (CSRF defense).
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  if (req.get('sec-fetch-site') === 'cross-site') {
    return res.status(403).json({ error: 'Bu kaynaktan işlem yapılamaz.' });
  }
  const origin = req.get('origin');
  if (origin) {
    try {
      if (new URL(origin).host !== req.get('host')) {
        return res.status(403).json({ error: 'Bu kaynaktan işlem yapılamaz.' });
      }
    } catch {
      return res.status(403).json({ error: 'Geçersiz istek kaynağı.' });
    }
  }
  next();
});

// Rate limiter for login
function checkLoginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const previous = loginAttempts.get(ip);
  const attempt = previous && now - previous.lastAttempt < 5 * 60 * 1000
    ? previous : { count: 0, lastAttempt: now };

  if (attempt.count >= 5 && now - attempt.lastAttempt < 5 * 60 * 1000) {
    return res.status(429).json({
      error: 'Çok fazla hatalı giriş denemesi. Lütfen 5 dakika sonra tekrar deneyiniz.',
    });
  }
  next();
}

// In-memory, per-IP limiter for public form endpoints (counters reset on restart).
function createRateLimiter(max: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits) if (entry.resetAt <= now) hits.delete(key);
  }, 10 * 60 * 1000).unref();
  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let entry = hits.get(key);
    if (!entry || entry.resetAt <= now) {
      entry = { count: 0, resetAt: now + windowMs };
      hits.set(key, entry);
    }
    entry.count += 1;
    if (entry.count > max) {
      res.setHeader('Retry-After', String(Math.ceil((entry.resetAt - now) / 1000)));
      return res.status(429).json({ error: 'Çok fazla istek gönderdiniz. Lütfen daha sonra tekrar deneyiniz.' });
    }
    next();
  };
}
const contactRateLimit = createRateLimiter(5, 60 * 60 * 1000);
const newsletterRateLimit = createRateLimiter(10, 60 * 60 * 1000);

// Bot protection for the public forms: honeypot + minimum fill time + Cloudflare Turnstile.
// Production without TURNSTILE_SECRET_KEY closes both forms (503); development without keys skips the check.
// TURNSTILE_TEST_VERIFIER=1 swaps Cloudflare for a fake verifier (token "test-valid-token") for automated tests only.
const TURNSTILE_SECRET = process.env.TURNSTILE_SECRET_KEY?.trim() || '';
const TURNSTILE_SITE_KEY = process.env.TURNSTILE_SITE_KEY?.trim() || '';
const TURNSTILE_TEST_VERIFIER = process.env.TURNSTILE_TEST_VERIFIER === '1';
if (TURNSTILE_TEST_VERIFIER && IS_PROD) {
  console.error('TURNSTILE_TEST_VERIFIER yalnızca testler içindir ve NODE_ENV=production iken kullanılamaz.');
  process.exit(1);
}
const TURNSTILE_ENFORCED = TURNSTILE_TEST_VERIFIER || Boolean(TURNSTILE_SECRET);
if (IS_PROD && !TURNSTILE_SECRET) {
  console.warn('TURNSTILE_SECRET_KEY tanımlı değil: iletişim ve bülten formları kapalı (503). Kurulum: README → "Cloudflare Turnstile kurulumu".');
} else if (IS_PROD && !TURNSTILE_SITE_KEY) {
  console.warn('TURNSTILE_SITE_KEY tanımlı değil: form sayfalarında robot doğrulaması gösterilemez, gönderimler reddedilir.');
}
const MIN_FORM_FILL_MS = 2000;

type TurnstileResult = 'ok' | 'failed' | 'unavailable';
async function verifyTurnstile(token: string, ip: string | undefined): Promise<TurnstileResult> {
  if (TURNSTILE_TEST_VERIFIER) return token === 'test-valid-token' ? 'ok' : token === 'test-unavailable' ? 'unavailable' : 'failed';
  try {
    const params = new URLSearchParams({ secret: TURNSTILE_SECRET, response: token });
    if (ip) params.set('remoteip', ip);
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: params,
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) return 'unavailable';
    const result: any = await response.json();
    if (result?.success === true) return 'ok';
    const codes: string[] = Array.isArray(result?.['error-codes']) ? result['error-codes'] : [];
    // Server-side problems (bad secret, Cloudflare outage) must not look like a bot rejection.
    if (codes.some((c) => ['internal-error', 'missing-input-secret', 'invalid-input-secret'].includes(c))) {
      console.error('Turnstile doğrulama hatası:', codes.join(', '));
      return 'unavailable';
    }
    return 'failed';
  } catch {
    console.error('Turnstile doğrulaması için Cloudflare servisine ulaşılamadı.');
    return 'unavailable';
  }
}

// Runs before field validation: the honeypot answers a silent success, a closed form answers 503.
function botGuard(silentSuccessMessage: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const honeypot = req.body && typeof req.body === 'object' ? (req.body as any).website : undefined;
    if (typeof honeypot === 'string' && honeypot.trim() !== '') {
      return res.json({ success: true, message: silentSuccessMessage });
    }
    if (IS_PROD && !TURNSTILE_SECRET) {
      return res.status(503).json({ error: 'Form geçici olarak kullanılamıyor.' });
    }
    next();
  };
}

// Runs after field validation (so a typo does not burn the one-time token). Returns false after answering.
async function passesBotCheck(req: Request, res: Response): Promise<boolean> {
  const body: any = req.body;
  const elapsed = body?.formElapsedMs;
  if (typeof elapsed !== 'number' || !Number.isFinite(elapsed) || elapsed < MIN_FORM_FILL_MS) {
    res.status(400).json({ error: 'Form çok hızlı gönderildi, lütfen tekrar deneyin.' });
    return false;
  }
  if (!TURNSTILE_ENFORCED) return true;
  const token = body?.turnstileToken;
  if (typeof token !== 'string' || !token || token.length > 2048) {
    res.status(400).json({ error: 'Robot doğrulaması başarısız, lütfen tekrar deneyin.' });
    return false;
  }
  const result = await verifyTurnstile(token, req.ip || req.socket.remoteAddress);
  if (result === 'unavailable') {
    res.status(503).json({ error: 'Robot doğrulama hizmetine şu anda ulaşılamıyor, lütfen daha sonra tekrar deneyin.' });
    return false;
  }
  if (result === 'failed') {
    res.status(400).json({ error: 'Robot doğrulaması başarısız, lütfen tekrar deneyin.' });
    return false;
  }
  return true;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Auth Middleware
const requireAuth = ah(async (req: Request, res: Response, next: NextFunction) => {
  if (!(await sessionToken(req))) {
    return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapınız.' });
  }
  next();
});

// --- API ROUTES ---

// 1. Auth Endpoints
app.get('/api/health', ah(async (_req: Request, res: Response) => {
  try {
    await pingDb(pool);
    return res.json({ ok: true });
  } catch {
    return res.status(503).json({ ok: false });
  }
}));

app.post('/api/auth/login', checkLoginRateLimit, ah(async (req: Request, res: Response) => {
  const username: unknown = req.body?.username;
  const password: unknown = req.body?.password;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!adminCredential) {
    return res.status(503).json({ error: 'Yönetici hesabı henüz kurulmamış. Sunucuda ADMIN_PASSWORD gizli ayarını tanımlayın.' });
  }
  if (typeof username !== 'string' || !username.trim() || username.length > 128 ||
      typeof password !== 'string' || !password || password.length > 1024) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }
  const validPassword = passwordMatches(password);
  if (username.trim() !== ADMIN_USERNAME || !validPassword) {
    const now = Date.now();
    const previous = loginAttempts.get(ip);
    const count = previous && now - previous.lastAttempt < 5 * 60 * 1000
      ? previous.count + 1 : 1;
    loginAttempts.set(ip, { count, lastAttempt: now });
    return res.status(401).json({ error: 'Kullanıcı adı veya şifre hatalı.' });
  }

  loginAttempts.delete(ip);
  const token = crypto.randomBytes(32).toString('hex');
  await store.createSession(token, new Date(Date.now() + SESSION_LIFETIME_MS));
  res.cookie('admin_session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PROD,
    path: '/',
    maxAge: SESSION_LIFETIME_MS,
  });
  // Never return the session credential to JavaScript.
  return res.json({ success: true, message: 'Giriş başarılı.' });
}));

app.post('/api/auth/logout', ah(async (req: Request, res: Response) => {
  const token: unknown = req.cookies?.admin_session;
  if (typeof token === 'string' && /^[0-9a-f]{64}$/.test(token)) await store.deleteSession(token);
  res.clearCookie('admin_session', { path: '/', sameSite: 'strict', secure: IS_PROD });
  return res.json({ success: true, message: 'Çıkış yapıldı.' });
}));

app.get('/api/auth/status', ah(async (req: Request, res: Response) => {
  return res.json({ isAuthenticated: Boolean(await sessionToken(req)) });
}));

// 2. Site Data Endpoints (Public & Draft)
// Public response only: hide unpublished / inactive items (the admin draft stays complete).
const HIDEABLE_LISTS = ['events', 'highlights', 'instagramPosts', 'podcasts', 'articles', 'trainings', 'press'] as const;
function publicSiteView(data: SiteData): SiteData {
  const view: any = { ...data };
  for (const key of HIDEABLE_LISTS) {
    if (Array.isArray(view[key])) view[key] = view[key].filter((item: any) => item?.published !== false);
  }
  if (Array.isArray(view.heroSlides)) view.heroSlides = view.heroSlides.filter((slide: any) => slide?.active !== false);
  return view as SiteData;
}

// Public client settings (the Turnstile site key is public by design; null disables the widget).
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ turnstileSiteKey: TURNSTILE_SITE_KEY || null });
});

app.get('/api/site', (_req: Request, res: Response) => {
  const publishedData = store.getPublished();
  const hasDraftChanges = JSON.stringify(publishedData) !== JSON.stringify(store.getDraft());
  res.json({
    data: publicSiteView(publishedData),
    version: publishedData.version,
    hasDraftChanges,
  });
});

app.get('/api/site/draft', requireAuth, (_req: Request, res: Response) => {
  res.json({
    data: store.getDraft(),
    isDraft: true,
  });
});

app.post('/api/site/draft', requireAuth, ah(async (req: Request, res: Response) => {
  const newDraft = req.body;
  if (!newDraft || typeof newDraft !== 'object') {
    return res.status(400).json({ error: 'Geçersiz veri paketi.' });
  }
  const draftData = await store.updateDraft((current) => migrateSiteData({
    ...current,
    ...newDraft,
    updatedAt: new Date().toISOString(),
  }, initialSiteData));
  return res.json({ success: true, data: draftData, message: 'Taslak kaydedildi.' });
}));

app.post('/api/site/publish', requireAuth, ah(async (req: Request, res: Response) => {
  const rawNote = req.body?.note;
  const note = typeof rawNote === 'string' && rawNote.trim() ? rawNote.trim() : 'Yönetim panelinden canlıya yayınlandı';
  const publishedData = await store.publishDraft(note);

  return res.json({
    success: true,
    data: publishedData,
    version: publishedData.version,
    message: 'Site başarıyla canlıya yayınlandı ve sürüm yedeklendi.',
  });
}));

// 3. Backups & Versions
app.get('/api/site/backups', requireAuth, ah(async (_req: Request, res: Response) => {
  try {
    res.json({ backups: await store.listVersions() });
  } catch {
    res.status(500).json({ error: 'Yedek listesi alınamadı.' });
  }
}));

app.post('/api/site/restore', requireAuth, ah(async (req: Request, res: Response) => {
  const backupId = req.body?.backupId;
  if (typeof backupId !== 'string' || !/^version_v\d+_\d+$/.test(backupId)) {
    return res.status(400).json({ error: 'Geçersiz yedek kimliği.' });
  }

  const backup = await store.getVersion(backupId);
  if (!backup) {
    return res.status(404).json({ error: 'Belirtilen sürüm yedeği bulunamadı.' });
  }
  if (!backup.data) {
    return res.status(400).json({ error: 'Yedek verisi bozuk veya geçersiz.' });
  }

  const draftData = await store.updateDraft(() => ({
    ...migrateSiteData(backup.data, initialSiteData),
    updatedAt: new Date().toISOString(),
  }));

  return res.json({
    success: true,
    data: draftData,
    message: `Sürüm v${backup.versionNumber} taslak olarak geri yüklendi. Önizleyip canlıya yayınlayabilirsiniz.`,
  });
}));

app.get('/api/site/export', requireAuth, (_req: Request, res: Response) => {
  const publishedData = store.getPublished();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: publishedData.version,
    data: publishedData,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ismail_semih_studio_yedek_v${publishedData.version}.json`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

app.post('/api/site/import', requireAuth, ah(async (req: Request, res: Response) => {
  const payload = req.body;
  const dataToImport = payload?.data || payload;

  if (!dataToImport || !dataToImport.settings || !dataToImport.sections) {
    return res.status(400).json({ error: 'Yüklenen JSON dosyası geçerli bir site yedeği içermiyor.' });
  }

  const draftData = await store.updateDraft(() => ({
    ...migrateSiteData(dataToImport, initialSiteData),
    updatedAt: new Date().toISOString(),
  }));

  return res.json({
    success: true,
    data: draftData,
    message: 'Yedek taslak olarak başarıyla içe aktarıldı. Kontrol ettikten sonra Canlıya Yayınlayabilirsiniz.',
  });
}));

// 4. Universal Media & URL Preview System
function isBlockedHostname(rawHost: string): boolean {
  const host = rawHost.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '');
  if (!host) return true;
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) return true;
  if (host.includes(':')) { // IPv6 literal
    return host === '::' || host === '::1' || host.startsWith('::ffff:') || // loopback, unspecified, IPv4-mapped
      /^f[cd][0-9a-f]{2}:/.test(host) || // fc00::/7 unique local
      /^fe[89ab][0-9a-f]:/.test(host); // fe80::/10 link local
  }
  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return a === 0 || a === 10 || a === 127 || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 100 && b >= 64 && b <= 127);
  }
  return false;
}

app.post('/api/video/preview', requireAuth, async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL gereklidir.' });
  }

  try {
    const parsed = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password) {
      return res.status(400).json({ error: 'Yalnızca HTTP ve HTTPS bağlantıları desteklenir.' });
    }
    const hostname = parsed.hostname.toLowerCase();
    if (isBlockedHostname(hostname)) {
      return res.status(400).json({ error: 'Geçersiz hedef sunucu.' });
    }

    // 1. YouTube & Shorts
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);

    if ((hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') && ytMatch && ytMatch[1]) {
      const videoId = ytMatch[1];
      const maxresThumb = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
      const hqThumb = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;

      let title = 'YouTube Video';
      try {
        const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;
        const resp = await fetch(oembedUrl, { signal: AbortSignal.timeout(3500) });
        if (resp.ok) {
          const json: any = await resp.json();
          if (json.title) title = json.title;
        }
      } catch (e) {}

      return res.json({
        success: true,
        platform: 'youtube',
        videoId,
        title,
        description: 'YouTube üzerinden paylaşılan video içeriği.',
        imageUrl: maxresThumb,
        fallbackImageUrl: hqThumb,
        embedUrl,
        originalUrl: url,
      });
    }

    // 2. Vimeo
    if (hostname === 'vimeo.com' || hostname.endsWith('.vimeo.com')) {
      try {
        const vimeoOembed = `https://vimeo.com/api/oembed.json?url=${encodeURIComponent(url)}`;
        const resp = await fetch(vimeoOembed, { signal: AbortSignal.timeout(3500) });
        if (resp.ok) {
          const vimeoData: any = await resp.json();
          return res.json({
            success: true,
            platform: 'vimeo',
            title: vimeoData.title || 'Vimeo Videosu',
            description: vimeoData.description || 'Vimeo platformu üzerindeki video kaydı.',
            imageUrl: vimeoData.thumbnail_url,
            embedUrl: `https://player.vimeo.com/video/${vimeoData.video_id}`,
            originalUrl: url,
          });
        }
      } catch (e) {}
    }

    // 3. Spotify
    if (hostname === 'spotify.com' || hostname.endsWith('.spotify.com')) {
      try {
        const spotifyOembed = `https://open.spotify.com/oembed?url=${encodeURIComponent(url)}`;
        const resp = await fetch(spotifyOembed, { signal: AbortSignal.timeout(3500) });
        if (resp.ok) {
          const spData: any = await resp.json();
          return res.json({
            success: true,
            platform: 'spotify',
            title: spData.title || 'Spotify Podcast Bölümü',
            description: 'Ben Bir İsmail podcast bölümü.',
            imageUrl: spData.thumbnail_url || '/images/podcast_ep_1.svg',
            embedUrl: url.replace('/episode/', '/embed/episode/'),
            originalUrl: url,
          });
        }
      } catch (e) {}
    }

    // 4. Instagram Post / Reel URL
    if (hostname === 'instagram.com' || hostname.endsWith('.instagram.com')) {
      const isReel = url.includes('/reel/') || url.includes('/reels/');
      const postId = url.split('/p/')[1]?.split('/')[0] || url.split('/reel/')[1]?.split('/')[0] || 'post';
      return res.json({
        success: true,
        platform: 'instagram',
        title: isReel ? 'Instagram Reels Videosu' : 'Instagram Gönderisi',
        description: `İsmail Semih Habiboğulları Instagram paylaşımı (${postId})`,
        imageUrl: isReel ? '/images/instagram_post_1.svg' : '/images/instagram_post_2.svg',
        embedUrl: `https://www.instagram.com/p/${postId}/embed`,
        originalUrl: url,
        mediaType: isReel ? 'VIDEO' : 'IMAGE',
      });
    }

    // 5. Direct Video Files
    if (url.match(/\.(mp4|webm|mov)$/i)) {
      return res.json({
        success: true,
        platform: 'html5_video',
        title: 'Video Medyası',
        description: 'Doğrudan video dosyası.',
        imageUrl: '/images/highlight_theater.svg',
        embedUrl: url,
        originalUrl: url,
      });
    }

    // 6. Direct Image Files
    if (url.match(/\.(jpg|jpeg|png|webp|avif|gif|svg)$/i)) {
      return res.json({
        success: true,
        platform: 'image',
        title: 'Görsel Medyası',
        description: 'Doğrudan görsel dosyası.',
        imageUrl: url,
        originalUrl: url,
      });
    }

    // Generic site scraping is deliberately disabled here: unrestricted fetch(url)
    // allowed redirect/DNS-based SSRF into private networks. Use manual image input
    // until a DNS-pinned, size-limited and redirect-safe metadata fetcher is provided.
    return res.json({
      success: false,
      message: 'Bu kaynak için otomatik kapak alınamıyor. Başlığı ve görseli manuel ekleyin.',
      originalUrl: url,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: 'Önizleme çekilirken bağlantı zaman aşımına uğradı veya erişilemedi.',
      error: err.message,
    });
  }
});

// 5. Instagram Integration APIs
app.get('/api/instagram/config', requireAuth, (_req: Request, res: Response) => {
  const draftData = store.getDraft();
  res.json({
    settings: draftData.settings.instagramSettings,
    postCount: draftData.instagramPosts.length,
  });
});

app.post('/api/instagram/config', requireAuth, ah(async (req: Request, res: Response) => {
  const { username, showLikes, postCountDesktop, postCountTablet, postCountMobile } = req.body || {};
  const draftData = await store.updateDraft((current) => {
    const currentSettings = current.settings.instagramSettings;
    return {
      ...current,
      settings: {
        ...current.settings,
        instagramSettings: {
          ...currentSettings,
          username: username || currentSettings.username,
          showLikes: showLikes ?? currentSettings.showLikes,
          postCountDesktop: postCountDesktop || currentSettings.postCountDesktop,
          postCountTablet: postCountTablet || currentSettings.postCountTablet,
          postCountMobile: postCountMobile || currentSettings.postCountMobile,
        },
      },
    };
  });
  res.json({ success: true, settings: draftData.settings.instagramSettings, message: 'Instagram ayarları güncellendi.' });
}));

// 7. Media Library & Upload (files live in R2, records in the `media` table)
const uploadRateLimit = createUploadLimiter();
const requireMedia = (_req: Request, res: Response, next: NextFunction) => {
  if (!mediaService) return res.status(503).json({ error: MEDIA_NOT_CONFIGURED });
  next();
};

app.post('/api/media/upload', requireAuth, requireMedia, uploadRateLimit, parseUpload, ah(async (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi.' });
  }
  try {
    const file = await mediaService!.upload({ buffer: req.file.buffer, originalname: req.file.originalname });
    return res.json({ success: true, file, message: 'Dosya başarıyla yüklendi.' });
  } catch (err) {
    if (err instanceof MediaError) return res.status(err.status).json({ error: err.message });
    throw err;
  }
}));

app.get('/api/media/list', requireAuth, requireMedia, ah(async (_req: Request, res: Response) => {
  try {
    res.json({ media: await mediaService!.list() });
  } catch {
    res.status(500).json({ error: 'Medya kütüphanesi okunamadı.' });
  }
}));

app.delete('/api/media/delete', requireAuth, requireMedia, ah(async (req: Request, res: Response) => {
  const filename = req.body?.filename;
  if (!filename || typeof filename !== 'string') return res.status(400).json({ error: 'Dosya adı belirtilmedi.' });
  try {
    if (await mediaService!.remove(filename)) return res.json({ success: true, message: 'Dosya silindi.' });
  } catch {
    return res.status(500).json({ error: 'Dosya silinemedi.' });
  }
  return res.status(404).json({ error: 'Dosya bulunamadı.' });
}));

// 8. Contact & Newsletter
app.post('/api/contact', contactRateLimit, botGuard('Mesajınız başarıyla iletildi. En kısa sürede dönüş yapılacaktır.'), ah(async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { name: rawName, email: rawEmail, subject: rawSubject, message: rawMessage } = body;
  if ([rawName, rawEmail, rawMessage].some((v) => typeof v !== 'string') ||
      (rawSubject !== undefined && rawSubject !== null && typeof rawSubject !== 'string')) {
    return res.status(400).json({ error: 'Geçersiz form verisi gönderildi.' });
  }
  const name = (rawName as string).trim();
  const email = (rawEmail as string).trim();
  const subject = typeof rawSubject === 'string' ? rawSubject.trim() : '';
  const message = (rawMessage as string).trim();
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Lütfen ad, e-posta ve mesaj alanlarını doldurunuz.' });
  }
  if (name.length > 100) return res.status(400).json({ error: 'Ad en fazla 100 karakter olabilir.' });
  if (email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }
  if (subject.length > 150) return res.status(400).json({ error: 'Konu en fazla 150 karakter olabilir.' });
  if (message.length > 5000) return res.status(400).json({ error: 'Mesaj en fazla 5000 karakter olabilir.' });

  if (!(await passesBotCheck(req, res))) return;

  await store.addMessage({ name, email, subject: subject || 'Genel İletişim', message });

  return res.json({ success: true, message: 'Mesajınız başarıyla iletildi. En kısa sürede dönüş yapılacaktır.' });
}));

app.get('/api/contact/list', requireAuth, ah(async (_req: Request, res: Response) => {
  res.json({ messages: await store.listMessages() });
}));

app.post('/api/contact/mark-read', requireAuth, ah(async (req: Request, res: Response) => {
  await store.markMessageRead(req.body?.id);
  res.json({ success: true });
}));

app.delete('/api/contact/delete', requireAuth, ah(async (req: Request, res: Response) => {
  await store.deleteMessage(req.body?.id);
  res.json({ success: true });
}));

app.post('/api/newsletter/subscribe', newsletterRateLimit, botGuard('Bültene kaydınız başarıyla tamamlandı!'), ah(async (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { email: rawEmail, consent } = body;
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }
  if (!consent) {
    return res.status(400).json({ error: 'Lütfen KVKK ve iletişim onay kutusunu işaretleyiniz.' });
  }

  if (!(await passesBotCheck(req, res))) return;

  if (!(await store.addSubscriber(email))) {
    return res.json({ success: true, message: 'E-posta adresiniz zaten bültenimize kayıtlı. Teşekkürler!' });
  }

  return res.json({ success: true, message: 'Bültene kaydınız başarıyla tamamlandı!' });
}));

app.get('/api/newsletter/list', requireAuth, ah(async (_req: Request, res: Response) => {
  res.json({ subscribers: await store.listSubscribers() });
}));

app.delete('/api/newsletter/delete', requireAuth, ah(async (req: Request, res: Response) => {
  const { id } = req.body || {};
  if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Abone kimliği gerekli.' });
  await store.deleteSubscriber(id);
  res.json({ success: true });
}));

app.get('/api/newsletter/export', requireAuth, ah(async (_req: Request, res: Response) => {
  const subscribers = await store.listSubscribers();
  // Neutralise spreadsheet formula injection and escape quotes in every cell.
  const csvCell = (value: unknown) => {
    let text = String(value ?? '');
    if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const csvRows = ['ID,E-posta,Kayıt Tarihi'];
  subscribers.forEach((s) => {
    csvRows.push([s.id, s.email, s.date].map(csvCell).join(','));
  });
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename=bulten_aboneleri.csv');
  res.send(csvRows.join('\n'));
}));

// 9. SEO Robots & Sitemap
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${store.getPublished().seo.canonicalUrl || 'https://ismailsemih.com'}/sitemap.xml`;
  res.type('text/plain').send(robots);
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const publishedData = store.getPublished();
  const baseUrl = publishedData.seo.canonicalUrl || 'https://ismailsemih.com';
  const urls = [
    '/',
    '/podcast',
    '/yapay-zeka',
    '/etkinlikler',
    '/egitimler',
    '/hakkimda',
    '/iletisim',
  ];
  publishedData.articles?.forEach((art) => {
    if (art.published) urls.push(`/yapay-zeka/${art.id}`);
  });
  publishedData.podcasts?.forEach((pod) => {
    if (pod.published) urls.push(`/podcast/${pod.id}`);
  });
  publishedData.trainings?.forEach((tr) => {
    if (tr.published) urls.push(`/egitimler/${tr.id}`);
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${baseUrl}${u}</loc><lastmod>${new Date().toISOString().split('T')[0]}</lastmod><changefreq>weekly</changefreq></url>`).join('\n')}
</urlset>`;
  res.type('application/xml').send(xml);
});

// --- Server Boot ---
// Unknown API routes (e.g. the removed /api/ai/*) answer 404 JSON, never the SPA shell.
app.use('/api', (_req: Request, res: Response) => {
  res.status(404).json({ error: 'Uç bulunamadı.' });
});

// Body-parser failures: oversized and malformed JSON answer with Turkish JSON errors.
app.use((err: any, _req: Request, res: Response, next: NextFunction) => {
  if (err?.type === 'entity.too.large') return res.status(413).json({ error: 'İstek gövdesi çok büyük.' });
  if (err?.type === 'entity.parse.failed') return res.status(400).json({ error: 'Geçersiz JSON verisi.' });
  return next(err);
});

// Anything else (e.g. a database error inside an async handler): never leak details to the client.
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('İstek hatası:', err?.code || err?.name || 'bilinmeyen');
  if (res.headersSent) return;
  res.status(500).json({ error: 'Sunucu hatası. Lütfen daha sonra tekrar deneyiniz.' });
});

async function startServer() {
  try {
    await pingDb(pool);
    const applied = await runMigrations(pool);
    if (applied.length) console.log(`Veritabanı migration uygulandı: ${applied.join(', ')}`);
    await store.initStore(pool);
  } catch (err: any) {
    console.error('Veritabanına bağlanılamadı veya hazırlanamadı:', err?.code ? describeDbError(err) : (err?.message || 'bilinmeyen hata'));
    process.exit(1);
  }
  if (MEDIA_MEMORY_MODE) {
    mediaService = createMediaService({ pool, storage: createMemoryStorage(), baseUrl: process.env.MEDIA_BASE_URL?.trim() || `http://localhost:${PORT}` });
    console.warn('MEDIA_STORAGE=memory: sahte bellek deposu kullanılıyor (yalnızca test).');
  } else {
    const missing = missingR2Env();
    if (!missing.length && !MEDIA_ORIGIN) missing.push('MEDIA_BASE_URL (geçerli bir adres değil)');
    if (missing.length) {
      console.warn(`Medya depolama yapılandırılmamış, yükleme kapalı. Eksik değişkenler: ${missing.join(', ')}`);
    } else {
      mediaService = createMediaService({ pool, storage: createR2Storage(), baseUrl: process.env.MEDIA_BASE_URL!.trim() });
    }
  }
  await store.purgeExpiredSessions().catch(() => undefined);
  setInterval(() => { store.purgeExpiredSessions().catch(() => undefined); }, 60 * 60 * 1000).unref();

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
        watch: process.env.DISABLE_HMR === 'true' ? null : {},
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[İsmail Semih Studio V2] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
