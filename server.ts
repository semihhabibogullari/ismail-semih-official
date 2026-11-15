/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { initialSiteData } from './src/data/initialData';
import { SiteData } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
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

// Directories
const DATA_DIR = process.env.STUDIO_DATA_DIR ? path.resolve(process.env.STUDIO_DATA_DIR) : path.resolve(__dirname, 'data');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const UPLOADS_DIR = process.env.STUDIO_UPLOADS_DIR ? path.resolve(process.env.STUDIO_UPLOADS_DIR) : path.resolve(__dirname, 'public/uploads');
const SITE_DATA_FILE = path.resolve(DATA_DIR, 'site-data.json');
const DRAFT_DATA_FILE = path.resolve(DATA_DIR, 'draft-data.json');
const MESSAGES_FILE = path.resolve(DATA_DIR, 'messages.json');
const SUBSCRIBERS_FILE = path.resolve(DATA_DIR, 'subscribers.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth.json');

// Ensure directories exist
[DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper for atomic file write
function safeWriteJson(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp.${process.pid}.${crypto.randomBytes(6).toString('hex')}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tempPath, filePath);
}

function safeReadJson<T>(filePath: string, defaultValue: T): T {
  try {
    if (!fs.existsSync(filePath)) {
      safeWriteJson(filePath, defaultValue);
      return defaultValue;
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(raw);
    return parsed;
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultValue;
  }
}

// Site is Turkish-only: drop every legacy "*_en" key (recursively) from any loaded
// SiteData (published, draft, backups, imports) so old files still open cleanly.
function stripEnglishKeys<T>(value: T): T {
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

// Deep merge helper to ensure backward compatibility with earlier data files
function migrateSiteData(rawExisting: any, defaults: SiteData): SiteData {
  const existing = stripEnglishKeys(rawExisting);
  if (!existing || typeof existing !== 'object') return defaults;

  // Never copy credential fields into public site data, drafts, or backups.
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

// Authentication: old (publicly bootstrapped) credentials are deliberately retired.
interface AuthConfig {
  passwordHash: string;
  salt: string;
  version: 2;
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function passwordMatches(password: string, config: AuthConfig): boolean {
  const candidate = Buffer.from(hashPassword(password, config.salt), 'hex');
  const expected = Buffer.from(config.passwordHash, 'hex');
  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

const ADMIN_USERNAME = process.env.ADMIN_USERNAME?.trim() || 'ismailsemih';

const initialAuth = fs.existsSync(AUTH_FILE)
  ? safeReadJson<Partial<AuthConfig> | null>(AUTH_FILE, null)
  : null;
let authConfig: AuthConfig | null =
  initialAuth?.version === 2 &&
  typeof initialAuth.salt === 'string' &&
  typeof initialAuth.passwordHash === 'string'
    ? initialAuth as AuthConfig
    : null;

// Store the real password exclusively as a deployment secret. A changed secret
// replaces an earlier stored hash at the next server startup.
const bootstrapPassword = process.env.ADMIN_PASSWORD;
if (bootstrapPassword) {
  if (bootstrapPassword.length < 12 || bootstrapPassword.length > 1024) {
    throw new Error('ADMIN_PASSWORD 12–1024 karakter olmalıdır.');
  }
  if (!authConfig || !passwordMatches(bootstrapPassword, authConfig)) {
    const salt = crypto.randomBytes(32).toString('hex');
    authConfig = { version: 2, salt, passwordHash: hashPassword(bootstrapPassword, salt) };
    safeWriteJson(AUTH_FILE, authConfig);
    console.info('Yönetici şifresi güvenli ayarlardan yapılandırıldı.');
  }
} else if (!authConfig) {
  console.warn('Yönetici girişi kapalı: ADMIN_PASSWORD gizli ayarını kullanın.');
}

// Sessions are opaque, HttpOnly-cookie-only and expire server-side.
const SESSION_LIFETIME_MS = 7 * 24 * 60 * 60 * 1000;
const activeSessions = new Map<string, number>();
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

function sessionToken(req: Request): string | null {
  const token: unknown = req.cookies?.admin_session;
  if (typeof token !== 'string') return null;
  const expiresAt = activeSessions.get(token);
  if (!expiresAt) return null;
  if (expiresAt <= Date.now()) {
    activeSessions.delete(token);
    return null;
  }
  return token;
}

// Initialize Site Data with backward compatible migration
let rawPublished = safeReadJson<any>(SITE_DATA_FILE, initialSiteData);
let publishedData: SiteData = migrateSiteData(rawPublished, initialSiteData);
safeWriteJson(SITE_DATA_FILE, publishedData);

let rawDraft = safeReadJson<any>(DRAFT_DATA_FILE, publishedData);
let draftData: SiteData = migrateSiteData(rawDraft, publishedData);
safeWriteJson(DRAFT_DATA_FILE, draftData);

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
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com" + mediaSource,
  "img-src 'self' data: https:" + mediaSource,
  "media-src 'self' https:" + mediaSource,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://player.vimeo.com https://open.spotify.com https://www.instagram.com",
  "connect-src 'self'",
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
app.use('/api', (req: Request, res: Response, next: NextFunction) => {
  const bigAdminUpload = req.method === 'POST' && ['/site/draft', '/site/import'].includes(req.path);
  if (!bigAdminUpload) return smallJson(req, res, next);
  // Never buffer a large body for an anonymous visitor.
  if (!sessionToken(req)) return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapınız.' });
  return adminJson(req, res, next);
});
app.use('/uploads', express.static(UPLOADS_DIR, {
  setHeaders: (res) => { res.setHeader('X-Content-Type-Options', 'nosniff'); },
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

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!sessionToken(req)) {
    return res.status(401).json({ error: 'Yetkisiz erişim. Lütfen giriş yapınız.' });
  }
  next();
}

// Multer Upload configuration
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOADS_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanName = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    cb(null, `${cleanName}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 30 * 1024 * 1024 }, // 30 MB
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|gif|svg|webp|avif|mp4|webm|mp3|wav|pdf|woff2|woff)$/i;
    // SVG is excluded: active SVG documents can execute scripts on this origin.
    if (file.originalname.match(allowed) && !/\.svg$/i.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü.'));
    }
  },
});

// --- API ROUTES ---

// 1. Auth Endpoints
app.post('/api/auth/login', checkLoginRateLimit, (req: Request, res: Response) => {
  // Allow secure local setup to take effect without restarting the preview.
  // An explicit ADMIN_PASSWORD secret always takes precedence over the file.
  if (!process.env.ADMIN_PASSWORD && fs.existsSync(AUTH_FILE)) {
    const persisted = safeReadJson<Partial<AuthConfig> | null>(AUTH_FILE, null);
    if (persisted?.version === 2 &&
        typeof persisted.salt === 'string' && /^[0-9a-f]{64}$/i.test(persisted.salt) &&
        typeof persisted.passwordHash === 'string' && /^[0-9a-f]{128}$/i.test(persisted.passwordHash)) {
      authConfig = persisted as AuthConfig;
    }
  }
  const username: unknown = req.body?.username;
  const password: unknown = req.body?.password;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  if (!authConfig) {
    return res.status(503).json({ error: 'Yönetici hesabı henüz kurulmamış. Sunucuda ADMIN_PASSWORD gizli ayarını tanımlayın.' });
  }
  if (typeof username !== 'string' || !username.trim() || username.length > 128 ||
      typeof password !== 'string' || !password || password.length > 1024) {
    return res.status(400).json({ error: 'Kullanıcı adı ve şifre gereklidir.' });
  }
  const validPassword = passwordMatches(password, authConfig);
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
  activeSessions.set(token, Date.now() + SESSION_LIFETIME_MS);
  res.cookie('admin_session', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: IS_PROD,
    path: '/',
    maxAge: SESSION_LIFETIME_MS,
  });
  // Never return the session credential to JavaScript.
  return res.json({ success: true, message: 'Giriş başarılı.' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = sessionToken(req);
  if (token) activeSessions.delete(token);
  res.clearCookie('admin_session', { path: '/', sameSite: 'strict', secure: IS_PROD });
  return res.json({ success: true, message: 'Çıkış yapıldı.' });
});

app.get('/api/auth/status', (req: Request, res: Response) => {
  return res.json({ isAuthenticated: Boolean(sessionToken(req)) });
});

app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  if (process.env.ADMIN_PASSWORD) {
    return res.status(409).json({ error: 'Şifre sunucunun ADMIN_PASSWORD gizli ayarından yönetilir.' });
  }
  const { currentPassword, newPassword } = req.body || {};
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' ||
      newPassword.length < 12 || newPassword.length > 1024) {
    return res.status(400).json({ error: 'Yeni parola en az 12 karakter olmalıdır.' });
  }
  if (!authConfig || !passwordMatches(currentPassword, authConfig)) {
    return res.status(400).json({ error: 'Mevcut parola hatalı.' });
  }
  const salt = crypto.randomBytes(32).toString('hex');
  authConfig = { version: 2, salt, passwordHash: hashPassword(newPassword, salt) };
  safeWriteJson(AUTH_FILE, authConfig);
  activeSessions.clear();
  res.clearCookie('admin_session', { path: '/', sameSite: 'strict', secure: IS_PROD });
  return res.json({ success: true, message: 'Parola değiştirildi. Lütfen yeniden giriş yapın.' });
});

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

app.get('/api/site', (_req: Request, res: Response) => {
  const hasDraftChanges = JSON.stringify(publishedData) !== JSON.stringify(draftData);
  res.json({
    data: publicSiteView(publishedData),
    version: publishedData.version,
    hasDraftChanges,
  });
});

app.get('/api/site/draft', requireAuth, (_req: Request, res: Response) => {
  res.json({
    data: draftData,
    isDraft: true,
  });
});

app.post('/api/site/draft', requireAuth, (req: Request, res: Response) => {
  const newDraft = req.body;
  if (!newDraft || typeof newDraft !== 'object') {
    return res.status(400).json({ error: 'Geçersiz veri paketi.' });
  }
  draftData = migrateSiteData({
    ...draftData,
    ...newDraft,
    updatedAt: new Date().toISOString(),
  }, initialSiteData);
  safeWriteJson(DRAFT_DATA_FILE, draftData);
  return res.json({ success: true, data: draftData, message: 'Taslak kaydedildi.' });
});

app.post('/api/site/publish', requireAuth, (req: Request, res: Response) => {
  const note = req.body?.note || 'Yönetim panelinden canlıya yayınlandı';
  const newVersionNumber = (publishedData.version || 1) + 1;

  const backupId = `version_v${publishedData.version}_${Date.now()}`;
  const backupEntry = {
    id: backupId,
    timestamp: new Date().toISOString(),
    versionNumber: publishedData.version,
    note,
    data: publishedData,
  };
  safeWriteJson(path.resolve(BACKUPS_DIR, `${backupId}.json`), backupEntry);

  publishedData = {
    ...draftData,
    version: newVersionNumber,
    updatedAt: new Date().toISOString(),
  };
  draftData = { ...publishedData };

  safeWriteJson(SITE_DATA_FILE, publishedData);
  safeWriteJson(DRAFT_DATA_FILE, draftData);

  return res.json({
    success: true,
    data: publishedData,
    version: newVersionNumber,
    message: 'Site başarıyla canlıya yayınlandı ve sürüm yedeklendi.',
  });
});

// 3. Backups & Versions
app.get('/api/site/backups', requireAuth, (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(BACKUPS_DIR).filter((f) => f.endsWith('.json'));
    const backups = files.map((file) => {
      const content = safeReadJson<any>(path.resolve(BACKUPS_DIR, file), null);
      return {
        id: content?.id || path.basename(file, '.json'),
        timestamp: content?.timestamp || '',
        versionNumber: content?.versionNumber || 0,
        note: content?.note || 'Otomatik Sürüm Yedeklemesi',
      };
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    res.json({ backups });
  } catch (err) {
    res.status(500).json({ error: 'Yedek listesi alınamadı.' });
  }
});

app.post('/api/site/restore', requireAuth, (req: Request, res: Response) => {
  const { backupId } = req.body;
  if (typeof backupId !== 'string' || !/^version_v\d+_\d+$/.test(backupId)) {
    return res.status(400).json({ error: 'Geçersiz yedek kimliği.' });
  }

  const targetFile = path.resolve(BACKUPS_DIR, `${backupId}.json`);
  if (!fs.existsSync(targetFile)) {
    return res.status(404).json({ error: 'Belirtilen sürüm yedeği bulunamadı.' });
  }

  const backup = safeReadJson<any>(targetFile, null);
  if (!backup || !backup.data) {
    return res.status(400).json({ error: 'Yedek verisi bozuk veya geçersiz.' });
  }

  draftData = migrateSiteData(backup.data, initialSiteData);
  draftData.updatedAt = new Date().toISOString();
  safeWriteJson(DRAFT_DATA_FILE, draftData);

  return res.json({
    success: true,
    data: draftData,
    message: `Sürüm v${backup.versionNumber} taslak olarak geri yüklendi. Önizleyip canlıya yayınlayabilirsiniz.`,
  });
});

app.get('/api/site/export', requireAuth, (_req: Request, res: Response) => {
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    version: publishedData.version,
    data: publishedData,
  };
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Content-Disposition', `attachment; filename=ismail_semih_studio_yedek_v${publishedData.version}.json`);
  res.send(JSON.stringify(exportPayload, null, 2));
});

app.post('/api/site/import', requireAuth, (req: Request, res: Response) => {
  const payload = req.body;
  const dataToImport = payload?.data || payload;

  if (!dataToImport || !dataToImport.settings || !dataToImport.sections) {
    return res.status(400).json({ error: 'Yüklenen JSON dosyası geçerli bir site yedeği içermiyor.' });
  }

  draftData = migrateSiteData(dataToImport, initialSiteData);
  draftData.updatedAt = new Date().toISOString();
  safeWriteJson(DRAFT_DATA_FILE, draftData);

  return res.json({
    success: true,
    data: draftData,
    message: 'Yedek taslak olarak başarıyla içe aktarıldı. Kontrol ettikten sonra Canlıya Yayınlayabilirsiniz.',
  });
});

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
  res.json({
    settings: draftData.settings.instagramSettings,
    postCount: draftData.instagramPosts.length,
  });
});

app.post('/api/instagram/config', requireAuth, (req: Request, res: Response) => {
  const { username, showLikes, postCountDesktop, postCountTablet, postCountMobile } = req.body || {};
  const currentSettings = draftData.settings.instagramSettings;
  draftData.settings.instagramSettings = {
    ...currentSettings,
    username: username || currentSettings.username,
    showLikes: showLikes ?? currentSettings.showLikes,
    postCountDesktop: postCountDesktop || currentSettings.postCountDesktop,
    postCountTablet: postCountTablet || currentSettings.postCountTablet,
    postCountMobile: postCountMobile || currentSettings.postCountMobile,
  };
  safeWriteJson(DRAFT_DATA_FILE, draftData);
  res.json({ success: true, settings: draftData.settings.instagramSettings, message: 'Instagram ayarları güncellendi.' });
});

// 7. Media Library & Upload
app.post('/api/media/upload', requireAuth, upload.single('file'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Dosya yüklenemedi.' });
  }

  const fileUrl = `/uploads/${req.file.filename}`;
  return res.json({
    success: true,
    file: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      url: fileUrl,
      uploadedAt: new Date().toISOString(),
    },
    message: 'Dosya başarıyla yüklendi.',
  });
});

app.get('/api/media/list', requireAuth, (_req: Request, res: Response) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR);
    const mediaList = files.map((filename) => {
      const stats = fs.statSync(path.resolve(UPLOADS_DIR, filename));
      return {
        filename,
        url: `/uploads/${filename}`,
        size: stats.size,
        createdAt: stats.birthtime.toISOString(),
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    res.json({ media: mediaList });
  } catch (err) {
    res.status(500).json({ error: 'Medya kütüphanesi okunamadı.' });
  }
});

app.delete('/api/media/delete', requireAuth, (req: Request, res: Response) => {
  const { filename } = req.body;
  if (!filename) return res.status(400).json({ error: 'Dosya adı belirtilmedi.' });

  const safeFilename = path.basename(filename);
  const target = path.resolve(UPLOADS_DIR, safeFilename);

  if (fs.existsSync(target)) {
    fs.unlinkSync(target);
    return res.json({ success: true, message: 'Dosya silindi.' });
  }
  return res.status(404).json({ error: 'Dosya bulunamadı.' });
});

// 8. Contact & Newsletter
app.post('/api/contact', contactRateLimit, (req: Request, res: Response) => {
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

  const messages = safeReadJson<any[]>(MESSAGES_FILE, []);
  const newMsg = {
    id: `msg_${Date.now()}`,
    name,
    email,
    subject: subject || 'Genel İletişim',
    message,
    date: new Date().toISOString(),
    read: false,
  };
  messages.unshift(newMsg);
  safeWriteJson(MESSAGES_FILE, messages);

  return res.json({ success: true, message: 'Mesajınız başarıyla iletildi. En kısa sürede dönüş yapılacaktır.' });
});

app.get('/api/contact/list', requireAuth, (_req: Request, res: Response) => {
  const messages = safeReadJson<any[]>(MESSAGES_FILE, []);
  res.json({ messages });
});

app.post('/api/contact/mark-read', requireAuth, (req: Request, res: Response) => {
  const { id } = req.body;
  const messages = safeReadJson<any[]>(MESSAGES_FILE, []);
  const found = messages.find((m) => m.id === id);
  if (found) {
    found.read = true;
    safeWriteJson(MESSAGES_FILE, messages);
  }
  res.json({ success: true });
});

app.delete('/api/contact/delete', requireAuth, (req: Request, res: Response) => {
  const { id } = req.body;
  let messages = safeReadJson<any[]>(MESSAGES_FILE, []);
  messages = messages.filter((m) => m.id !== id);
  safeWriteJson(MESSAGES_FILE, messages);
  res.json({ success: true });
});

app.post('/api/newsletter/subscribe', newsletterRateLimit, (req: Request, res: Response) => {
  const body = req.body && typeof req.body === 'object' ? req.body : {};
  const { email: rawEmail, consent } = body;
  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
    return res.status(400).json({ error: 'Geçerli bir e-posta adresi giriniz.' });
  }
  if (!consent) {
    return res.status(400).json({ error: 'Lütfen KVKK ve iletişim onay kutusunu işaretleyiniz.' });
  }

  const subscribers = safeReadJson<any[]>(SUBSCRIBERS_FILE, []);
  const exists = subscribers.some((s) => s.email.toLowerCase() === email.toLowerCase());
  if (exists) {
    return res.json({ success: true, message: 'E-posta adresiniz zaten bültenimize kayıtlı. Teşekkürler!' });
  }

  const newSub = {
    id: `sub_${Date.now()}`,
    email: email.toLowerCase(),
    date: new Date().toISOString(),
    confirmed: true,
  };
  subscribers.unshift(newSub);
  safeWriteJson(SUBSCRIBERS_FILE, subscribers);

  return res.json({ success: true, message: 'Bültene kaydınız başarıyla tamamlandı!' });
});

app.get('/api/newsletter/list', requireAuth, (_req: Request, res: Response) => {
  const subscribers = safeReadJson<any[]>(SUBSCRIBERS_FILE, []);
  res.json({ subscribers });
});

app.delete('/api/newsletter/delete', requireAuth, (req: Request, res: Response) => {
  const { id } = req.body || {};
  if (typeof id !== 'string' || !id) return res.status(400).json({ error: 'Abone kimliği gerekli.' });
  const subscribers = safeReadJson<any[]>(SUBSCRIBERS_FILE, []);
  safeWriteJson(SUBSCRIBERS_FILE, subscribers.filter((s) => s.id !== id));
  res.json({ success: true });
});

app.get('/api/newsletter/export', requireAuth, (_req: Request, res: Response) => {
  const subscribers = safeReadJson<any[]>(SUBSCRIBERS_FILE, []);
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
});

// 9. SEO Robots & Sitemap
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robots = `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api\nSitemap: ${publishedData.seo.canonicalUrl || 'https://ismailsemih.com'}/sitemap.xml`;
  res.type('text/plain').send(robots);
});

app.get('/sitemap.xml', (_req: Request, res: Response) => {
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

async function startServer() {
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
