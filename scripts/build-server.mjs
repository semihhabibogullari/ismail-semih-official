// Sunucuyu ve yardımcı betikleri esbuild ile paketler (üretimde tsx gerekmez).
// Çıktı: dist-server/server.mjs, import-json.mjs, r2-check.mjs ve migrations/*.sql
// node_modules'taki bağımlılıklar paketlenmez (--packages=external): sharp gibi native modüller
// sunucuda `npm ci --omit=dev` ile kurulur.
import { build } from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';

const outdir = 'dist-server';
fs.rmSync(outdir, { recursive: true, force: true });
await build({
  entryPoints: {
    server: 'server.ts',
    'import-json': 'scripts/import-json.ts',
    'r2-check': 'scripts/r2-check.ts',
  },
  outdir,
  outExtension: { '.js': '.mjs' },
  bundle: true,
  platform: 'node',
  target: 'node22',
  format: 'esm',
  packages: 'external',
  sourcemap: false,
  legalComments: 'none',
  logLevel: 'info',
});
// SQL migration dosyaları paketin yanında (server/db.ts bunları import.meta.url'e göre okur).
fs.cpSync(path.join('server', 'migrations'), path.join(outdir, 'migrations'), { recursive: true });
console.log('Sunucu paketi hazır: ' + outdir + '/');
