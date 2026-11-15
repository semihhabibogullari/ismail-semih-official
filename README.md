# İsmail Semih Habiboğulları — Resmî Site

React 19 + Vite + Tailwind 4 ön yüzü ve Express sunucusu. İçerik yönetim paneli `/admin` adresindedir.

## Gereksinimler

- Node.js 22
- MySQL 8 veya MariaDB (utf8mb4). Sunucu açılışta bağlanamazsa net bir hata ile (çıkış kodu 1) durur.

## Çalıştırma

1. `npm ci`
2. `.env.example` dosyasını `.env` olarak kopyalayın; `DATABASE_URL`, `ADMIN_USERNAME` ve `ADMIN_PASSWORD` (en az 12 karakter) değerlerini girin. `.env` dosyasını asla commit etmeyin.
3. Boş bir veritabanı oluşturun (aşağıya bakın). Tablolar ilk açılışta otomatik kurulur.
4. Geliştirme: `npm run dev` (http://localhost:3000)
5. Üretim derlemesi: `npm run build`, ardından `NODE_ENV=production npm run start`

## Veritabanı (MySQL)

Tek değişken: `DATABASE_URL=mysql://kullanici:sifre@host:3306/veritabani`. Kullanıcı adı ve şifredeki özel karakterler **URL-encode** edilmelidir (`@` → `%40`, `#` → `%23`, `/` → `%2F`, `:` → `%3A`, `%` → `%25`).

```sql
CREATE DATABASE veritabani CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

- Şema `server/migrations/NNN_ad.sql` dosyalarıyla yönetilir; bekleyen migration'lar sunucu açılırken otomatik uygulanır (`schema_migrations` tablosu). Migration dosyalarında ifadelerin içinde `;` kullanmayın.
- Tablolar: `site_documents` (yayın/taslak, tek JSON belge), `content_versions` (son 20 sürüm), `messages`, `subscribers`, `admin_sessions` (token'ın sha256 özeti).
- Yayındaki içerik bellekte önbelleklenir; ziyaretçi istekleri veritabanına gitmez.
- `GET /api/health` veritabanına ping atar ve `{"ok":true}` döner.
- Hız sınırı sayaçları bellektedir: uygulama **tek süreç** olarak çalıştırılmalıdır (birden çok örnek/cluster desteklenmez).
- Tek yönetici hesabı `ADMIN_USERNAME`/`ADMIN_PASSWORD` ile tanımlanır; şifreyi değiştirmek için `.env` değerini güncelleyip yeniden başlatın.

### Eski JSON verisini aktarma

`npm run db:import-json` — `data/site-data.json`, `draft-data.json`, `backups/*.json`, `messages.json`, `subscribers.json` dosyalarını okuyup tablolara aktarır (olmayan dosyalar atlanır). Tekrar çalıştırılabilir: mesaj, abone ve sürümler kimliğe göre tekrarlanmaz; yayın/taslak yalnızca veritabanı hâlâ ilk tohum içeriğindeyse yazılır (`-- --force` ile zorlanır). Başka bir klasör için: `npm run db:import-json -- ./klasor`. Betik ayrıca gömülü base64 görsel ve `/uploads/` yolu sayısını raporlar.

## Kontroller

- `npm run lint` — tür denetimi
- `node --import tsx scripts/test-section-appearance.mjs`
- `node scripts/smoke-test.mjs` — önce `npm run build` gerekir. `DATABASE_URL` içindeki veritabanı adına `_smoke_test` ekleyerek kendi geçici veritabanını oluşturur ve sonunda siler (gerçek veritabanına dokunmaz; kullanıcının CREATE/DROP DATABASE yetkisi gerekir).

## Yönetim paneli

- Giriş: `/admin/login`. Şifre yalnızca `ADMIN_PASSWORD` ortam değişkeninden gelir.
- Değişiklikler önce taslağa kaydedilir, "Yayınla" ile canlıya alınır.

## Güvenlik ve dağıtım ayarları

- `TRUST_PROXY=1` — Uygulama Plesk/Nginx gibi bir ters vekilin arkasında çalışıyorsa tanımlayın. Hız sınırları ve giriş kilidi `req.ip` kullanır; bu ayar olmadan vekil arkasında tüm ziyaretçiler tek IP gibi görünür. Doğrudan internete açık çalışıyorsa tanımlamayın.
- `MEDIA_BASE_URL` — Medya ayrı bir alan adından (ör. R2/CDN) sunuluyorsa bu adres İçerik Güvenlik Politikası'nda görsel, ses/video ve yazı tipi kaynağı olarak izin alır.
- Üretimde (`NODE_ENV=production`) HSTS ve İçerik Güvenlik Politikası başlıkları gönderilir; geliştirme sunucusunda yalnızca temel başlıklar vardır.
- İletişim formu IP başına saatte 5, bülten kaydı saatte 10 istekle sınırlıdır (bellek içi, yeniden başlatmada sıfırlanır).
