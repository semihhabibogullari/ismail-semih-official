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

## Güvenlik ve dağıtım ayarları

- `TRUST_PROXY=1` — Uygulama Plesk/Nginx gibi bir ters vekilin arkasında çalışıyorsa tanımlayın. Hız sınırları ve giriş kilidi `req.ip` kullanır; bu ayar olmadan vekil arkasında tüm ziyaretçiler tek IP gibi görünür. Doğrudan internete açık çalışıyorsa tanımlamayın.
- `MEDIA_BASE_URL` — Medya ayrı bir alan adından (ör. R2/CDN) sunuluyorsa bu adres İçerik Güvenlik Politikası'nda görsel, ses/video ve yazı tipi kaynağı olarak izin alır.
- Üretimde (`NODE_ENV=production`) HSTS ve İçerik Güvenlik Politikası başlıkları gönderilir; geliştirme sunucusunda yalnızca temel başlıklar vardır.
- İletişim formu IP başına saatte 5, bülten kaydı saatte 10 istekle sınırlıdır (bellek içi, yeniden başlatmada sıfırlanır).
