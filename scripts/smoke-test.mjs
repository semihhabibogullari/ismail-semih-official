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
  env: { ...process.env, PORT: String(port), NODE_ENV: 'production', ADMIN_USERNAME: testUsername, ADMIN_PASSWORD: testPassword,
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

  const ai = await request('/api/ai/config', { headers: { cookie } });
  assert.equal(ai.status, 200);
  const aiJson = await ai.json();
  assert.ok(aiJson.config);
  assert.ok(!aiJson.config.openaiApiKey);

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

  const logout = await request('/api/auth/logout', { method: 'POST', headers: { cookie } });
  assert.equal(logout.status, 200);
  const oldSession = await request('/api/site/draft', { headers: { cookie } });
  assert.equal(oldSession.status, 401);

  process.stdout.write('PASS: public data, login/logout, cookie auth, secret isolation, URL preview permission.\n');
} catch (error) {
  process.stderr.write('SMOKE TEST FAILED: ' + error.stack + '\n' + logs.slice(-1800) + '\n');
  process.exitCode = 1;
} finally {
  server.kill('SIGTERM');
  // The smoke suite deliberately never edits the developer's real site files.
  fs.rmSync(isolatedRoot, { recursive: true, force: true });
}
