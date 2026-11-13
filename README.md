# İsmail Semih Habiboğulları — Resmî Site

React 19 + Vite + Tailwind 4 ön yüzü ve Express sunucusu. İçerik yönetim paneli `/admin` adresindedir.

## Gereksinimler

- Node.js 22

## Çalıştırma

1. `npm ci`
2. `.env.example` dosyasını `.env` olarak kopyalayın ve `ADMIN_USERNAME` ile `ADMIN_PASSWORD` (en az 12 karakter) değerlerini girin. `.env` dosyasını asla commit etmeyin.
3. Geliştirme: `npm run dev` (http://localhost:3000)
4. Üretim derlemesi: `npm run build`, ardından `NODE_ENV=production npm run start`

## Kontroller

- `npm run lint` — tür denetimi
- `node --import tsx scripts/test-section-appearance.mjs`
- `node scripts/smoke-test.mjs` — önce `npm run build` gerekir

## Yönetim paneli

- Giriş: `/admin/login`. Şifre yalnızca `ADMIN_PASSWORD` ortam değişkeninden gelir.
- Değişiklikler önce taslağa kaydedilir, "Yayınla" ile canlıya alınır.
