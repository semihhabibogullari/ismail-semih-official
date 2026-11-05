import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';

const port = 36181;
const base = `http://127.0.0.1:${port}`;
const testUsername = 'ismailsemih';
const testPassword = 'local-smoke-password-only-2026!';
const server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
  env: { ...process.env, PORT: String(port), NODE_ENV: 'production', ADMIN_USERNAME: testUsername, ADMIN_PASSWORD: testPassword },
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
}
