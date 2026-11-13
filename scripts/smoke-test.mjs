import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const isolatedRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ismail-smoke-'));
const port = 36181;
const base = `http://127.0.0.1:${port}`;
const testUsername = 'ismailsemih';
const testPassword = 'local-smoke-password-only-2026!';
const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  env: { ...process.env, PORT: String(port), NODE_ENV: 'production', TRUST_PROXY: '1', ADMIN_USERNAME: testUsername, ADMIN_PASSWORD: testPassword,
    STUDIO_DATA_DIR: path.join(isolatedRoot, 'data'), STUDIO_UPLOADS_DIR: path.join(isolatedRoot, 'uploads') },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = '';
server.stdout.on('data', d => { logs += String(d); });
server.stderr.on('data', d => { logs += String(d); });

const request = (path, options = {}) => fetch(base + path, options);
const check = async () => {
  for (let i = 0; i < 80; i++) {
    if (server.exitCode !== null) throw new Error('Server exited early: ' + logs);
    try {
      const response = await request('/api/auth/status');
      if (response.ok) return;
    } catch {}
    await delay(250);
  }
  throw new Error('Server failed to start: ' + logs);
};

try {
  await check();
  const publicData = await request('/api/site');
  assert.equal(publicData.status, 200);
  const publicJson = await publicData.json();
  assert.ok(publicJson.data?.settings);
  assert.equal(JSON.stringify(publicJson).includes('"accessToken"'), false);

  const unauthorized = await request('/api/site/draft');
  assert.equal(unauthorized.status, 401);

  const wrong = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: 'old-public-default-not-allowed' }),
  });
  assert.equal(wrong.status, 401, 'The old default password must no longer work');

  const wrongUsername = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: 'different-user', password: testPassword }),
  });
  assert.equal(wrongUsername.status, 401);
  const missingUsername = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password: testPassword }),
  });
  assert.equal(missingUsername.status, 400);
  const login = await request('/api/auth/login', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username: testUsername, password: testPassword }),
  });
  assert.equal(login.status, 200);
  const loginJson = await login.json();
  assert.equal(loginJson.success, true);
  assert.equal(loginJson.token, undefined, 'Never leak session token in JSON');
  const cookieHeader = login.headers.get('set-cookie') || '';
  assert.match(cookieHeader, /HttpOnly/i);
  assert.match(cookieHeader, /SameSite=Strict/i);
  const cookie = cookieHeader.split(';')[0];

  const draft = await request('/api/site/draft', { headers: { cookie } });
  assert.equal(draft.status, 200);
  const instagram = await request('/api/instagram/config', { headers: { cookie } });
  assert.equal(instagram.status, 200);
  assert.equal(JSON.stringify(await instagram.json()).includes('"accessToken"'), false);

  for (const aiPath of ['/api/ai/config', '/api/ai/command', '/api/ai/translate']) {
    for (const method of ['GET', 'POST']) {
      const removedAi = await request(aiPath, { method, headers: { cookie, 'content-type': 'application/json' }, body: method === 'POST' ? '{}' : undefined });
      assert.equal(removedAi.status, 404, `${method} ${aiPath} must be gone`);
    }
  }

  const noPreview = await request('/api/video/preview', {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ url: 'https://example.com' }),
  });
  assert.equal(noPreview.status, 401);

  const withPreview = await request('/api/video/preview', {
    method: 'POST', headers: { 'content-type': 'application/json', cookie },
    body: JSON.stringify({ url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' }),
  });
  assert.equal(withPreview.status, 200);
  const preview = await withPreview.json();
  assert.equal(preview.platform, 'youtube');


  // Real CMS workflow using a disposable data directory.
  const draftResponse = await request('/api/site/draft', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ ...publicJson.data, settings: {
      ...publicJson.data.settings, siteTitle: 'CI Taslak Test Site'
    }}),
  });
  assert.equal(draftResponse.status, 200, 'Admin can save a draft');
  const draftJson = await draftResponse.json();
  assert.equal(draftJson.data.settings.siteTitle, 'CI Taslak Test Site');

  const beforePublish = await (await request('/api/site')).json();
  assert.notEqual(beforePublish.data.settings.siteTitle, 'CI Taslak Test Site',
    'A draft must not leak to the public site');

  const publishResponse = await request('/api/site/publish', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ note: 'Smoke test publication' }),
  });
  assert.equal(publishResponse.status, 200, 'Admin can publish a draft');
  const published = await (await request('/api/site')).json();
  assert.equal(published.data.settings.siteTitle, 'CI Taslak Test Site');

  const backupList = await request('/api/site/backups', { headers: { cookie } });
  assert.equal(backupList.status, 200);
  const backups = (await backupList.json()).backups;
  assert.ok(Array.isArray(backups) && backups.length > 0, 'Publishing creates backup');
  const invalidRestore = await request('/api/site/restore', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ backupId: '../../private-file' }),
  });
  assert.equal(invalidRestore.status, 400, 'Invalid backup paths must be rejected');
  const backupId = backups[0].id;
  const restored = await request('/api/site/restore', {
    method: 'POST', headers: { cookie, 'content-type': 'application/json' },
    body: JSON.stringify({ backupId }),
  });
  assert.equal(restored.status, 200, 'Backups are restorable to draft');

  // --- Panel modules: messages, subscribers, versions, export, about ---
  const json = { 'content-type': 'application/json' };
  const anonymous = [
    ['GET', '/api/contact/list'], ['POST', '/api/contact/mark-read'], ['DELETE', '/api/contact/delete'],
    ['GET', '/api/newsletter/list'], ['GET', '/api/newsletter/export'], ['DELETE', '/api/newsletter/delete'],
    ['GET', '/api/site/backups'], ['POST', '/api/site/restore'], ['GET', '/api/site/export'],
  ];
  for (const [method, url] of anonymous) {
    const r = await request(url, { method, headers: json, body: method === 'GET' ? undefined : '{}' });
    assert.equal(r.status, 401, `${method} ${url} must require a session`);
  }

  assert.ok(publicJson.data.about?.skills?.length > 0, 'Public data carries the about page content');
  assert.match(publicJson.data.about.biography, /Ben Bir İsmail/);
  const aboutDraft = await request('/api/site/draft', {
    method: 'POST', headers: { cookie, ...json },
    body: JSON.stringify({ about: { ...publicJson.data.about, heading: 'Smoke Hakkımda Başlığı' } }),
  });
  assert.equal(aboutDraft.status, 200);
  assert.equal((await aboutDraft.json()).data.about.heading, 'Smoke Hakkımda Başlığı');

  const sentMessage = await request('/api/contact', {
    method: 'POST', headers: json,
    body: JSON.stringify({ name: 'Smoke Test', email: 'smoke@example.com', subject: 'Test', message: 'Merhaba' }),
  });
  assert.equal(sentMessage.status, 200);
  const messages = (await (await request('/api/contact/list', { headers: { cookie } })).json()).messages;
  const message = messages.find((m) => m.email === 'smoke@example.com');
  assert.ok(message && message.read === false, 'Message appears unread in the panel');
  await request('/api/contact/mark-read', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify({ id: message.id }) });
  const afterRead = (await (await request('/api/contact/list', { headers: { cookie } })).json()).messages;
  assert.equal(afterRead.find((m) => m.id === message.id).read, true, 'Message can be marked as read');
  await request('/api/contact/delete', { method: 'DELETE', headers: { cookie, ...json }, body: JSON.stringify({ id: message.id }) });
  const afterDelete = (await (await request('/api/contact/list', { headers: { cookie } })).json()).messages;
  assert.equal(afterDelete.some((m) => m.id === message.id), false, 'Message can be deleted');

  const subscribed = await request('/api/newsletter/subscribe', {
    method: 'POST', headers: json, body: JSON.stringify({ email: 'smoke-sub@example.com', consent: true }),
  });
  assert.equal(subscribed.status, 200);
  const subs = (await (await request('/api/newsletter/list', { headers: { cookie } })).json()).subscribers;
  const sub = subs.find((s) => s.email === 'smoke-sub@example.com');
  assert.ok(sub, 'Subscriber appears in the panel');
  const csv = await request('/api/newsletter/export', { headers: { cookie } });
  assert.equal(csv.status, 200);
  assert.match(await csv.text(), /smoke-sub@example\.com/);
  const removed = await request('/api/newsletter/delete', { method: 'DELETE', headers: { cookie, ...json }, body: JSON.stringify({ id: sub.id }) });
  assert.equal(removed.status, 200);
  const subsAfter = (await (await request('/api/newsletter/list', { headers: { cookie } })).json()).subscribers;
  assert.equal(subsAfter.some((s) => s.id === sub.id), false, 'Subscriber can be deleted');

  // Turkish-only: legacy *_en keys are stripped from imported / restored data.
  const legacy = JSON.parse(JSON.stringify(publicJson.data));
  legacy.settings.siteTitle_en = 'Legacy English title';
  legacy.menu[0].label_en = 'Home';
  legacy.events[0].title_en = 'English event';
  legacy.trainings[0].syllabus_en = ['Week 1'];
  legacy.about.extra = { nested_en: 'x', keep: 'tr' };
  const imported = await request('/api/site/import', {
    method: 'POST', headers: { cookie, ...json }, body: JSON.stringify({ data: legacy }),
  });
  assert.equal(imported.status, 200, 'Legacy data with _en keys can be imported');
  const importedDraft = await (await request('/api/site/draft', { headers: { cookie } })).json();
  const importedText = JSON.stringify(importedDraft.data);
  assert.equal(/"[A-Za-z0-9]+_en"\s*:/.test(importedText), false, 'No *_en keys remain after import');
  assert.equal(importedDraft.data.menu[0].label, legacy.menu[0].label, 'Turkish content is preserved');
  assert.equal(importedDraft.data.about.extra.keep, 'tr');

  const exported = await request('/api/site/export', { headers: { cookie } });
  assert.equal(exported.status, 200);
  assert.ok((await exported.json()).data?.settings, 'Server export contains site data');

  const uploadData = new FormData();
  const tinyPng = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/6DkAAAAASUVORK5CYII=', 'base64');
  uploadData.append('file', new Blob([tinyPng], { type: 'image/png' }), 'smoke-test.png');
  const uploaded = await request('/api/media/upload', { method:'POST', headers:{ cookie }, body:uploadData });
  assert.equal(uploaded.status, 200, 'Admin can upload a picture');
  const uploadJson = await uploaded.json();
  assert.ok(uploadJson.file.url.startsWith('/uploads/'));
  const loadedImage = await request(uploadJson.file.url);
  assert.equal(loadedImage.status, 200, 'Uploaded image is publicly retrievable');
  const svgUpload = new FormData();
  svgUpload.append('file', new Blob(['<svg xmlns="http://www.w3.org/2000/svg"><script>console.log(1)</script></svg>'], {type:'image/svg+xml'}), 'danger.svg');
  const svgResponse = await request('/api/media/upload', { method:'POST', headers:{cookie}, body:svgUpload });
  assert.ok(svgResponse.status >= 400, 'SVG script files should never be accepted');
  const badUpload = await request('/api/media/upload', { method:'POST', body:uploadData });
  assert.equal(badUpload.status, 401, 'Public users cannot upload media');

  // --- Stage 4: hidden content, validation, rate limits, limits, headers, CSV ---
  const draftNow = (await (await request('/api/site/draft', { headers: { cookie } })).json()).data;
  const secretDraft = JSON.parse(JSON.stringify(draftNow));
  secretDraft.articles[0].published = false;
  secretDraft.events[0].published = false;
  secretDraft.heroSlides[0].active = false;
  const hiddenIds = [secretDraft.articles[0].id, secretDraft.events[0].id, secretDraft.heroSlides[0].id];
  assert.equal((await request('/api/site/draft', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify(secretDraft) })).status, 200);
  assert.equal((await request('/api/site/publish', { method: 'POST', headers: { cookie, ...json }, body: '{}' })).status, 200);
  const publicAfter = await (await request('/api/site')).json();
  for (const key of ['events', 'highlights', 'instagramPosts', 'podcasts', 'articles', 'trainings', 'press']) {
    assert.ok((publicAfter.data[key] || []).every((item) => item.published !== false), 'No unpublished ' + key + ' in public data');
  }
  assert.ok(publicAfter.data.heroSlides.every((slide) => slide.active !== false), 'No inactive hero slide in public data');
  const publicText = JSON.stringify(publicAfter);
  for (const id of hiddenIds) assert.equal(publicText.includes('"id":"' + id + '"'), false, 'Hidden item ' + id + ' leaked');
  const adminDraft = await (await request('/api/site/draft', { headers: { cookie } })).json();
  assert.equal(adminDraft.data.articles[0].published, false, 'Admin draft keeps hidden items');
  assert.equal(adminDraft.data.heroSlides[0].active, false);

  const ipHeaders = (ip) => ({ ...json, 'x-forwarded-for': ip });
  const contactBody = { name: 'Test', email: 'valid@example.com', subject: 'Konu', message: 'Merhaba' };
  const post = (url, ip, body) => request(url, { method: 'POST', headers: ipHeaders(ip), body: typeof body === 'string' ? body : JSON.stringify(body) });
  const badContacts = [
    { ...contactBody, name: 42 }, { ...contactBody, email: 'not-an-email' }, { ...contactBody, name: 'x'.repeat(101) },
    { ...contactBody, email: 'a'.repeat(250) + '@b.co' }, { ...contactBody, subject: 's'.repeat(151) },
    { ...contactBody, message: 'm'.repeat(5001) }, { ...contactBody, message: '   ' }, { ...contactBody, subject: ['x'] },
  ];
  for (let i = 0; i < badContacts.length; i++) {
    const r = await post('/api/contact', '10.1.0.' + i, badContacts[i]);
    assert.equal(r.status, 400, 'Invalid contact payload #' + i + ' must be rejected');
    assert.match((await r.json()).error, /[a-zıöüçğş]/i);
  }
  const atLimit = await post('/api/contact', '10.1.1.1', { ...contactBody, name: 'n'.repeat(100), subject: 's'.repeat(150), message: 'm'.repeat(5000) });
  assert.equal(atLimit.status, 200, 'Maximum-length valid contact is accepted');
  for (const bad of [{ email: 'nope', consent: true }, { email: 123, consent: true }, { email: 'a@b', consent: true }, { email: 'a'.repeat(250) + '@b.co', consent: true }]) {
    assert.equal((await post('/api/newsletter/subscribe', '10.2.0.1', bad)).status, 400, 'Invalid subscriber rejected');
  }
  assert.equal((await post('/api/newsletter/subscribe', '10.2.0.2', { email: 'dup-test@example.com', consent: true })).status, 200);
  const dup = await post('/api/newsletter/subscribe', '10.2.0.3', { email: 'DUP-TEST@example.com', consent: true });
  assert.equal(dup.status, 200);
  assert.match((await dup.json()).message, /zaten/, 'Duplicate subscriber keeps the existing behaviour');

  // Rate limits are counted per forwarded client IP (TRUST_PROXY=1).
  for (let i = 0; i < 5; i++) assert.equal((await post('/api/contact', '10.3.0.1', contactBody)).status, 200);
  const limited = await post('/api/contact', '10.3.0.1', contactBody);
  assert.equal(limited.status, 429, 'Sixth contact message from one IP is rate limited');
  assert.match((await limited.json()).error, /Çok fazla/);
  assert.ok(limited.headers.get('retry-after'));
  assert.equal((await post('/api/contact', '10.3.0.2', contactBody)).status, 200, 'A different IP has its own bucket');
  for (let i = 0; i < 10; i++) assert.equal((await post('/api/newsletter/subscribe', '10.3.1.1', { email: 'rl' + i + '@example.com', consent: true })).status, 200);
  assert.equal((await post('/api/newsletter/subscribe', '10.3.1.1', { email: 'rl-over@example.com', consent: true })).status, 429);
  assert.equal((await post('/api/newsletter/subscribe', '10.3.1.2', { email: 'rl-other@example.com', consent: true })).status, 200);

  // Body size limits.
  const tooBig = await post('/api/contact', '10.4.0.1', JSON.stringify({ ...contactBody, message: 'x'.repeat(1024 * 1024) }));
  assert.equal(tooBig.status, 413, '1 MB body is rejected on public endpoints');
  assert.match((await tooBig.json()).error, /büyük/);
  const bigDraft = { ...draftNow, about: { ...draftNow.about, biography: 'b'.repeat(1024 * 1024) } };
  assert.equal((await request('/api/site/draft', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify(bigDraft) })).status, 200, 'Admin draft may exceed 50 KB');
  assert.equal((await request('/api/site/draft', { method: 'POST', headers: json, body: JSON.stringify(bigDraft) })).status, 401, 'Anonymous big draft is refused');
  assert.equal((await request('/api/site/draft', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify({ ...draftNow, about: { ...draftNow.about, biography: 'b'.repeat(6 * 1024 * 1024) } }) })).status, 413, 'Admin bodies above 5 MB are rejected');
  assert.equal((await request('/api/contact', { method: 'POST', headers: json, body: '{bad json' })).status, 400);

  // CSRF: cross-site browser requests are refused.
  const crossSite = await request('/api/contact', { method: 'POST', headers: { ...ipHeaders('10.5.0.1'), 'sec-fetch-site': 'cross-site' }, body: JSON.stringify(contactBody) });
  assert.equal(crossSite.status, 403);
  assert.equal((await request('/api/contact', { method: 'POST', headers: { ...ipHeaders('10.5.0.2'), 'sec-fetch-site': 'same-origin' }, body: JSON.stringify(contactBody) })).status, 200);

  // Security headers (the smoke server runs with NODE_ENV=production).
  const headerProbe = await request('/');
  assert.equal(headerProbe.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(headerProbe.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.equal(headerProbe.headers.get('referrer-policy'), 'strict-origin-when-cross-origin');
  assert.ok(headerProbe.headers.get('permissions-policy'));
  assert.match(headerProbe.headers.get('strict-transport-security') || '', /max-age=\d+/);
  const csp = headerProbe.headers.get('content-security-policy') || '';
  assert.match(csp, /script-src 'self'(;|$)/);
  for (const origin of ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.youtube-nocookie.com', 'www.youtube.com', 'player.vimeo.com', 'open.spotify.com', 'www.instagram.com']) {
    assert.ok(csp.includes(origin), 'CSP allows ' + origin);
  }
  assert.equal((await request('/api/site')).headers.get('x-content-type-options'), 'nosniff');

  // CSV export neutralises formulas and escapes quotes (records seeded straight into the isolated data dir).
  const evilEmails = ['=cmd@example.com', '+plus@example.com', '-minus@example.com', '@at@example.com', '\tTab@example.com', 'q"uote@example.com'];
  fs.writeFileSync(path.join(isolatedRoot, 'data', 'subscribers.json'),
    JSON.stringify(evilEmails.map((email, i) => ({ id: 'sub_csv_' + i, email, date: '2026-01-01T00:00:00.000Z', confirmed: true }))));
  const csvText = await (await request('/api/newsletter/export', { headers: { cookie } })).text();
  for (const prefixed of ["'=cmd@example.com", "'+plus@example.com", "'-minus@example.com", "'@at@example.com", "'\tTab@example.com"]) {
    assert.ok(csvText.includes('"' + prefixed + '"'), 'CSV cell is neutralised: ' + JSON.stringify(prefixed));
  }
  assert.ok(csvText.includes('"q""uote@example.com"'), 'Double quotes are doubled');

  // SSRF blocklist for the URL preview.
  for (const blocked of ['http://172.16.0.1/a.mp4', 'http://172.31.255.1/a.mp4', 'http://0.0.0.0/a.mp4', 'http://[::1]/a.mp4', 'http://[fd00::1]/a.mp4',
    'http://[fe80::1]/a.mp4', 'http://[::ffff:127.0.0.1]/a.mp4', 'http://printer.local/a.mp4', 'http://db.internal/a.mp4', 'http://foo.localhost/a.mp4', 'http://10.0.0.1/a.mp4']) {
    const r = await request('/api/video/preview', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify({ url: blocked }) });
    assert.equal(r.status, 400, blocked + ' must be blocked');
  }
  const publicVideo = await request('/api/video/preview', { method: 'POST', headers: { cookie, ...json }, body: JSON.stringify({ url: 'https://example.com/a.mp4' }) });
  assert.equal(publicVideo.status, 200, 'Public hosts are still allowed');

  // Instagram integration is manual-only.
  assert.equal((await request('/api/instagram/sync', { method: 'POST', headers: { cookie, ...json }, body: '{}' })).status, 404);
  const igConfig = await (await request('/api/instagram/config', { headers: { cookie } })).json();
  for (const gone of ['accessToken', 'connected', 'autoSync']) assert.equal(gone in igConfig.settings, false, gone + ' is gone');

  const logout = await request('/api/auth/logout', { method: 'POST', headers: { cookie } });
  assert.equal(logout.status, 200);
  const oldSession = await request('/api/site/draft', { headers: { cookie } });
  assert.equal(oldSession.status, 401);

  process.stdout.write('PASS: public data, login/logout, cookie auth, secret isolation, URL preview permission, removed AI endpoints, _en cleanup, hidden-content filter, form validation, rate limits, body limits, security headers, CSV escaping, SSRF list.\n');
} catch (error) {
  process.stderr.write('SMOKE TEST FAILED: ' + error.stack + '\n' + logs.slice(-1800) + '\n');
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  // The smoke suite deliberately never edits the developer's real site files.
  fs.rmSync(isolatedRoot, { recursive: true, force: true });
}
