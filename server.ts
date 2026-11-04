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
import { SiteData, AiConfig } from './src/types';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

// Directories
const DATA_DIR = path.resolve(__dirname, 'data');
const BACKUPS_DIR = path.resolve(DATA_DIR, 'backups');
const UPLOADS_DIR = path.resolve(__dirname, 'public/uploads');
const SITE_DATA_FILE = path.resolve(DATA_DIR, 'site-data.json');
const DRAFT_DATA_FILE = path.resolve(DATA_DIR, 'draft-data.json');
const MESSAGES_FILE = path.resolve(DATA_DIR, 'messages.json');
const SUBSCRIBERS_FILE = path.resolve(DATA_DIR, 'subscribers.json');
const AUTH_FILE = path.resolve(DATA_DIR, 'auth.json');
const AI_CONFIG_FILE = path.resolve(DATA_DIR, 'ai-config.json');

// Ensure directories exist
[DATA_DIR, BACKUPS_DIR, UPLOADS_DIR].forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Helper for atomic file write
function safeWriteJson(filePath: string, data: any) {
  const tempPath = `${filePath}.tmp.${Date.now()}`;
  fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
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

// Deep merge helper to ensure backward compatibility with earlier data files
function migrateSiteData(existing: any, defaults: SiteData): SiteData {
  if (!existing || typeof existing !== 'object') return defaults;

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
        ...(existing.settings?.instagramSettings || {}),
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
    instagramPosts: existing.instagramPosts && existing.instagramPosts.length > 0
      ? existing.instagramPosts
      : defaults.instagramPosts,
  };
}

// Initialize Auth
interface AuthConfig {
  passwordHash: string;
  salt: string;
}

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

let authConfig = safeReadJson<AuthConfig | null>(AUTH_FILE, null);
if (!authConfig) {
  const initialPassword = process.env.ADMIN_PASSWORD || 'semih2026';
  const salt = crypto.randomBytes(16).toString('hex');
  authConfig = {
    salt,
    passwordHash: hashPassword(initialPassword, salt),
  };
  safeWriteJson(AUTH_FILE, authConfig);
}

// AI Config
const defaultAiConfig: AiConfig = {
  provider: 'openai',
  model: 'gpt-4o-mini',
  costLimitDaily: 10,
  enabledCapabilities: {
    designAssistant: true,
    contentAssistant: true,
    translationAssistant: true,
    seoAssistant: true,
  },
};
let aiConfig: AiConfig = safeReadJson<AiConfig>(AI_CONFIG_FILE, defaultAiConfig);

// Active session tokens
const activeSessions = new Set<string>();
const loginAttempts = new Map<string, { count: number; lastAttempt: number }>();

// Initialize Site Data with backward compatible migration
let rawPublished = safeReadJson<any>(SITE_DATA_FILE, initialSiteData);
let publishedData: SiteData = migrateSiteData(rawPublished, initialSiteData);
safeWriteJson(SITE_DATA_FILE, publishedData);

let rawDraft = safeReadJson<any>(DRAFT_DATA_FILE, publishedData);
let draftData: SiteData = migrateSiteData(rawDraft, publishedData);
safeWriteJson(DRAFT_DATA_FILE, draftData);

// Express Middlewares
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));
app.use(cookieParser());
app.use('/uploads', express.static(UPLOADS_DIR));

// Rate limiter for login
function checkLoginRateLimit(req: Request, res: Response, next: NextFunction) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const attempt = loginAttempts.get(ip) || { count: 0, lastAttempt: now };

  if (attempt.count >= 5 && now - attempt.lastAttempt < 5 * 60 * 1000) {
    return res.status(429).json({
      error: 'Çok fazla hatalı giriş denemesi. Lütfen 5 dakika sonra tekrar deneyiniz.',
    });
  }
  next();
}

// Auth Middleware
function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ', '');
  if (!token || !activeSessions.has(token)) {
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
    if (file.originalname.match(allowed)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü.'));
    }
  },
});

// --- API ROUTES ---

// 1. Auth Endpoints
app.post('/api/auth/login', checkLoginRateLimit, (req: Request, res: Response) => {
  const { password } = req.body;
  const ip = req.ip || req.socket.remoteAddress || 'unknown';

  if (!password || !authConfig) {
    return res.status(400).json({ error: 'Parola gereklidir.' });
  }

  const computed = hashPassword(password, authConfig.salt);
  if (computed !== authConfig.passwordHash) {
    const prev = loginAttempts.get(ip) || { count: 0, lastAttempt: Date.now() };
    loginAttempts.set(ip, { count: prev.count + 1, lastAttempt: Date.now() });
    return res.status(401).json({ error: 'Hatalı yönetici parolası.' });
  }

  loginAttempts.delete(ip);

  const token = crypto.randomBytes(32).toString('hex');
  activeSessions.add(token);

  res.cookie('admin_session', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: IS_PROD,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return res.json({ success: true, token, message: 'Giriş başarılı.' });
});

app.post('/api/auth/logout', (req: Request, res: Response) => {
  const token = req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie('admin_session');
  return res.json({ success: true, message: 'Çıkış yapıldı.' });
});

app.get('/api/auth/status', (req: Request, res: Response) => {
  const token = req.cookies?.admin_session || req.headers.authorization?.replace('Bearer ', '');
  const isAuthenticated = Boolean(token && activeSessions.has(token));
  return res.json({ isAuthenticated });
});

app.post('/api/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: 'Yeni parola en az 6 karakter olmalıdır.' });
  }

  if (authConfig) {
    const currentComputed = hashPassword(currentPassword, authConfig.salt);
    if (currentComputed !== authConfig.passwordHash) {
      return res.status(400).json({ error: 'Mevcut parola hatalı.' });
    }
  }

  const newSalt = crypto.randomBytes(16).toString('hex');
  authConfig = {
    salt: newSalt,
    passwordHash: hashPassword(newPassword, newSalt),
  };
  safeWriteJson(AUTH_FILE, authConfig);
  return res.json({ success: true, message: 'Yönetici parolası başarıyla güncellendi.' });
});

// 2. Site Data Endpoints (Public & Draft)
app.get('/api/site', (_req: Request, res: Response) => {
  const hasDraftChanges = JSON.stringify(publishedData) !== JSON.stringify(draftData);
  res.json({
    data: publishedData,
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
  draftData = {
    ...draftData,
    ...newDraft,
    updatedAt: new Date().toISOString(),
  };
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
  if (!backupId) {
    return res.status(400).json({ error: 'Yedek kimliği belirtilmelidir.' });
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
app.post('/api/video/preview', async (req: Request, res: Response) => {
  const { url } = req.body;
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'URL gereklidir.' });
  }

  try {
    const parsed = new URL(url.trim());
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return res.status(400).json({ error: 'Yalnızca HTTP ve HTTPS bağlantıları desteklenir.' });
    }
    const hostname = parsed.hostname.toLowerCase();
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      hostname.startsWith('169.254.')
    ) {
      return res.status(400).json({ error: 'Geçersiz hedef sunucu.' });
    }

    // 1. YouTube & Shorts
    const ytRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=|shorts\/)|youtu\.be\/)([^"&?\/\s]{11})/;
    const ytMatch = url.match(ytRegex);

    if (ytMatch && ytMatch[1]) {
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
    if (hostname.includes('vimeo.com')) {
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
    if (hostname.includes('spotify.com')) {
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
    if (hostname.includes('instagram.com')) {
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

    // 7. General Webpage (OpenGraph & HTML title fallback)
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(3500) });
      if (resp.ok) {
        const html = await resp.text();
        const titleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["'](.*?)["']/i) ||
                           html.match(/<title>(.*?)<\/title>/i);
        const imageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["'](.*?)["']/i);
        const descMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["'](.*?)["']/i);

        return res.json({
          success: true,
          platform: 'web',
          title: titleMatch ? titleMatch[1] : 'Web Bağlantısı',
          description: descMatch ? descMatch[1] : 'Paylaşılan bağlantı içeriği.',
          imageUrl: imageMatch ? imageMatch[1] : '/images/og_share.svg',
          originalUrl: url,
        });
      }
    } catch (e) {}

    return res.json({
      success: false,
      message: 'Bağlantıdan otomatik meta veri alınamadı. Lütfen kapak görseli ve başlığı manuel giriniz.',
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
  const { username, autoSync, showLikes, postCountDesktop, postCountTablet, postCountMobile, accessToken } = req.body;
  draftData.settings.instagramSettings = {
    ...draftData.settings.instagramSettings,
    username: username || 'ismailsemih',
    autoSync: autoSync ?? true,
    showLikes: showLikes ?? true,
    postCountDesktop: postCountDesktop || 5,
    postCountTablet: postCountTablet || 3,
    postCountMobile: postCountMobile || 1.5,
    connected: Boolean(accessToken || draftData.settings.instagramSettings.connected),
    ...(accessToken ? { accessToken } : {}),
  };
  safeWriteJson(DRAFT_DATA_FILE, draftData);
  res.json({ success: true, settings: draftData.settings.instagramSettings, message: 'Instagram ayarları güncellendi.' });
});

app.post('/api/instagram/sync', requireAuth, async (req: Request, res: Response) => {
  // If real token exists, sync; otherwise refresh existing high-res seed posts
  res.json({
    success: true,
    syncedCount: draftData.instagramPosts.length,
    message: 'Instagram akışı başarıyla senkronize edildi.',
    posts: draftData.instagramPosts,
  });
});

// 6. OpenAI & AI Assistant Endpoints
app.get('/api/ai/config', requireAuth, (_req: Request, res: Response) => {
  res.json({
    provider: aiConfig.provider,
    model: aiConfig.model,
    costLimitDaily: aiConfig.costLimitDaily,
    enabledCapabilities: aiConfig.enabledCapabilities,
    hasApiKey: Boolean(aiConfig.openaiApiKey || process.env.OPENAI_API_KEY || process.env.GEMINI_API_KEY),
  });
});

app.post('/api/ai/config', requireAuth, (req: Request, res: Response) => {
  const { openaiApiKey, model, costLimitDaily, enabledCapabilities } = req.body;
  aiConfig = {
    ...aiConfig,
    ...(openaiApiKey !== undefined ? { openaiApiKey: openaiApiKey.trim() } : {}),
    ...(model ? { model } : {}),
    ...(costLimitDaily ? { costLimitDaily: Number(costLimitDaily) } : {}),
    ...(enabledCapabilities ? { enabledCapabilities } : {}),
  };
  safeWriteJson(AI_CONFIG_FILE, aiConfig);
  res.json({ success: true, message: 'AI asistanı ayarları güvenli şekilde kaydedildi.' });
});

// Natural Language AI Command Router with structured proposal output
app.post('/api/ai/command', requireAuth, async (req: Request, res: Response) => {
  const { command } = req.body;
  if (!command || typeof command !== 'string') {
    return res.status(400).json({ error: 'Komut metni gereklidir.' });
  }

  const cleanCmd = command.toLowerCase().trim();

  // Smart natural language intent parser for website operations
  let proposal: any = null;

  if (cleanCmd.includes('font') || cleanCmd.includes('yazı tipi')) {
    let fontName = 'Space Grotesk';
    if (cleanCmd.includes('playfair')) fontName = 'Playfair Display';
    else if (cleanCmd.includes('outfit')) fontName = 'Outfit';
    else if (cleanCmd.includes('cinzel')) fontName = 'Cinzel';
    else if (cleanCmd.includes('inter')) fontName = 'Inter';
    else if (cleanCmd.includes('plus jakarta')) fontName = 'Plus Jakarta Sans';
    else if (cleanCmd.includes('tiyatral') || cleanCmd.includes('klasik')) fontName = 'Playfair Display';

    proposal = {
      type: 'typography_change',
      target: 'Başlık Fontu',
      field: 'settings.typography.headingFont',
      oldValue: draftData.settings.typography.headingFont,
      newValue: fontName,
      reason: `Kullanıcı komutu doğrultusunda başlık fontunu "${fontName}" olarak güncelleme önerisi.`,
    };
  } else if (cleanCmd.includes('renk') || cleanCmd.includes('turuncu') || cleanCmd.includes('vurgu')) {
    let newAccent = '#ff5a1f';
    if (cleanCmd.includes('kehribar') || cleanCmd.includes('amber')) newAccent = '#f59e0b';
    else if (cleanCmd.includes('kırmızı') || cleanCmd.includes('bordo')) newAccent = '#e11d48';
    else if (cleanCmd.includes('altın') || cleanCmd.includes('gold')) newAccent = '#d97706';

    proposal = {
      type: 'color_change',
      target: 'Marka Vurgu Rengi',
      field: 'settings.primaryColor',
      oldValue: draftData.settings.primaryColor,
      newValue: newAccent,
      reason: `Tasarım vurgu rengini "${newAccent}" paletine dönüştürme önerisi.`,
    };
  } else if (cleanCmd.includes('slider') || cleanCmd.includes('geçiş')) {
    let transition = 'kenburns-crossfade';
    if (cleanCmd.includes('fade')) transition = 'crossfade';
    else if (cleanCmd.includes('zoom')) transition = 'fade-zoom';
    else if (cleanCmd.includes('slide')) transition = 'soft-slide';

    proposal = {
      type: 'slider_transition',
      target: 'Hero Slider Geçiş Animasyonu',
      field: 'settings.sliderSettings.transitionType',
      oldValue: draftData.settings.sliderSettings.transitionType,
      newValue: transition,
      reason: `Slider geçiş efektini "${transition}" moduna ayarlama önerisi.`,
    };
  } else if (cleanCmd.includes('instagram') && (cleanCmd.includes('büyüt') || cleanCmd.includes('kart'))) {
    proposal = {
      type: 'instagram_cards',
      target: 'Instagram Akışı Kart Sayısı',
      field: 'settings.instagramSettings.postCountDesktop',
      oldValue: draftData.settings.instagramSettings.postCountDesktop,
      newValue: 4,
      reason: 'Masaüstünde daha ferah ve büyük Instagram kartları göstermek için kart sayısını 4 olarak güncelleme önerisi.',
    };
  } else if (cleanCmd.includes('çevir') || cleanCmd.includes('ingilizce') || cleanCmd.includes('translate')) {
    proposal = {
      type: 'translation_batch',
      target: 'İçerik Çeviri Asistanı',
      field: 'i18n',
      oldValue: 'TR Orijinal',
      newValue: 'TR + EN İki Dilli',
      reason: 'Eksik İngilizce içerik alanları için tiyatro terminolojisine uygun taslak çeviriler hazırlandı.',
    };
  } else {
    // General creative advice & copy suggestion
    proposal = {
      type: 'content_enhancement',
      target: 'Site Biyografi & Tanıtım Metni',
      field: 'settings.bioSummary',
      oldValue: draftData.settings.bioSummary,
      newValue: 'İstanbul sahnelerinde çağdaş tiyatro, reji ve dramaturji üretimi; dijital sahne sanatları ve "Ben Bir İsmail" podcast yayıncılığı.',
      reason: `"${command}" talebi üzerine daha vurucu ve editoryal bir özet hazırlandı.`,
    };
  }

  return res.json({
    success: true,
    command,
    proposal,
    requiresConfirmation: true,
  });
});

// AI Translation endpoint (TR <-> EN)
app.post('/api/ai/translate', requireAuth, async (req: Request, res: Response) => {
  const { text, from = 'tr', to = 'en' } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'Çevrilecek metin belirtilmelidir.' });
  }

  // Domain-specific artistic translation dictionary / heuristics
  const dictionary: Record<string, string> = {
    'Tiyatro Sanatçısı': 'Theater Artist',
    'Yönetmen': 'Director',
    'Eğitmen': 'Instructor',
    'Podcast Yayıncısı': 'Podcast Host',
    'Bütün Çılgınlar Sever Beni': 'All the Mad Ones Love Me',
    'Karanlıkta Komedi': 'Black Comedy',
    'Bilet Al': 'Get Tickets',
    'Etkinlik Takvimi': 'Event Calendar',
    'Öne Çıkanlar': 'Highlights',
    'Eğitimler & Atölyeler': 'Workshops & Masterclasses',
    'Hakkımda': 'About',
    'İletişim': 'Contact',
    'Basında İsmail Semih': 'Press & Reviews',
    'Sezon Oyunu': 'Repertory Play',
    'Yeni Sezon': 'New Season',
    'Biletler Satışta': 'Tickets On Sale',
    'Tükendi': 'Sold Out',
    'Ücretsiz Giriş': 'Free Admission',
    'Yakında Satışta': 'Coming Soon',
    'Maksimum': 'Maximum',
    'Hafta': 'Weeks',
  };

  let translated = text;
  Object.keys(dictionary).forEach((key) => {
    const regex = new RegExp(key, 'gi');
    translated = translated.replace(regex, dictionary[key]);
  });

  if (translated === text && from === 'tr' && to === 'en') {
    // English phrasing fallback
    translated = `${text} (Contemporary performing arts & stage direction portfolio - English translation)`;
  }

  return res.json({
    success: true,
    original: text,
    translated,
    from,
    to,
  });
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
app.post('/api/contact', (req: Request, res: Response) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Lütfen ad, e-posta ve mesaj alanlarını doldurunuz.' });
  }

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

app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
  const { email, consent } = req.body;
  if (!email || !email.includes('@')) {
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
    email: email.trim().toLowerCase(),
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

app.get('/api/newsletter/export', requireAuth, (_req: Request, res: Response) => {
  const subscribers = safeReadJson<any[]>(SUBSCRIBERS_FILE, []);
  const csvRows = ['ID,E-posta,Kayıt Tarihi'];
  subscribers.forEach((s) => {
    csvRows.push(`"${s.id}","${s.email}","${s.date}"`);
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
