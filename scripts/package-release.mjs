// release/ klasörünü hazırlar: sunucuya yüklenecek her şey (derleme sunucuda yapılmaz).
// Önce `npm run build` ve `npm run build:server` çalışmış olmalıdır (`npm run package` ikisini de yapar).
import fs from 'node:fs';
import path from 'node:path';

const out = 'release';
for (const need of ['dist/index.html', 'dist-server/server.mjs', '.env.production.example', 'scripts/backup-db.mjs']) {
  if (!fs.existsSync(need)) { console.error('Eksik dosya: ' + need + ' (önce npm run build ve npm run build:server).'); process.exit(1); }
}
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(path.join(out, 'scripts'), { recursive: true });
fs.cpSync('dist', path.join(out, 'dist'), { recursive: true });
fs.cpSync('dist-server', path.join(out, 'dist-server'), { recursive: true });
for (const f of ['package.json', 'package-lock.json', '.env.production.example']) fs.copyFileSync(f, path.join(out, f));
fs.copyFileSync('scripts/backup-db.mjs', path.join(out, 'scripts', 'backup-db.mjs'));
console.log('release/ hazır. İçindekiler: dist, dist-server, scripts/backup-db.mjs, package.json, package-lock.json, .env.production.example');
console.log('Klasörü sıkıştırıp sunucuya yükleyin; rehber: README → "Plesk\'e yayın".');
