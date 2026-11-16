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
- `node --import tsx scripts/test-media.mjs` — medya hizmeti birim testi (sahte depo, gerçek R2'ye bağlanmaz)
- `npm run r2:check` — gerçek R2 doğrulaması (R2 değişkenleri gerekir)
- `node scripts/smoke-test.mjs` — önce `npm run build` gerekir. `DATABASE_URL` içindeki veritabanı adına `_smoke_test` ekleyerek kendi geçici veritabanını oluşturur ve sonunda siler (gerçek veritabanına dokunmaz; kullanıcının CREATE/DROP DATABASE yetkisi gerekir).

## Yönetim paneli

- Giriş: `/admin/login`. Şifre yalnızca `ADMIN_PASSWORD` ortam değişkeninden gelir.
- Değişiklikler önce taslağa kaydedilir, "Yayınla" ile canlıya alınır.

## Cloudflare R2 kurulumu (medya)

Panelden yüklenen tüm görsel ve videolar Cloudflare R2'de saklanır; sunucu diskine hiçbir şey yazılmaz. Kayıtlar `media` tablosundadır.

1. Cloudflare panelinde **R2 → Create bucket** ile bir bucket oluşturun (`R2_BUCKET`). Hesap kimliği (`R2_ACCOUNT_ID`) R2 sayfasının sağ tarafında görünür.
2. **R2 → Manage API Tokens → Create API token**: yetki **Object Read & Write**, kapsam **yalnızca bu bucket**. Çıkan *Access Key ID* ve *Secret Access Key* değerlerini `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` olarak `.env`'e yazın (yalnızca bir kez gösterilir, commit etmeyin).
3. Bucket → **Settings → Custom Domains → Connect Domain** ile alan adınızı (örn. `cdn.alanadin.com`) bağlayın ve `MEDIA_BASE_URL=https://cdn.alanadin.com` yazın (sonda `/` olmadan). `r2.dev` açık adresi üretimde önerilmez.
4. `npm run r2:check` — gerçek R2'ye küçük bir test görseli yükler, `MEDIA_BASE_URL` üzerinden HTTP 200 ve `Cache-Control` başlığını doğrular, sonra siler.

Yükleme kuralları: oturum zorunlu, en fazla 30 MB, oturum başına 10 dakikada 60 yükleme. Dosya türü uzantıya/Content-Type'a değil dosya imzasına göre doğrulanır (JPG, PNG, WebP, GIF, AVIF, MP4, WebM; SVG kabul edilmez). Görseller EXIF yönü düzeltilip meta verileri silinerek, 2560 px'den genişse küçültülerek WebP'ye çevrilir (animasyonlu GIF animasyonlu WebP olur). Videolar olduğu gibi yüklenir. Nesne anahtarı `media/YYYY/AA/<uuid>.<uzantı>`, `Cache-Control: public, max-age=31536000, immutable`.

R2 değişkenleri eksikse sunucu yine açılır (uyarı loglanır), `/api/media/upload` 503 ("Medya depolama yapılandırılmamış") döner. `MEDIA_STORAGE=memory` yalnızca otomatik testler içindir (bellekte sahte depo) ve `NODE_ENV=production` iken sunucu açılmaz.

**sharp (Aşama 8 notu):** görsel işleme `sharp` ile yapılır; `npm ci` Linux x64'te hazır (prebuilt) `@img/sharp-linux-x64` ikilisini indirir, derleme gerekmez (glibc 2.17+ / musl destekli). Plesk'te Node ortamında `npm ci` sonrası `node -e "require('sharp')"` ile yüklendiğini doğrulayın. İkili indirilemiyorsa (kapalı ağ) `npm ci` çıktısındaki `@img/sharp-*` hatasına bakın.

## Cloudflare Turnstile kurulumu (bot koruması)

İletişim formu (`POST /api/contact`) ve bülten kaydı (`POST /api/newsletter/subscribe`) Cloudflare Turnstile ile korunur. Ek olarak gizli bir tuzak alanı (dolu gelirse mesaj sessizce atılır) ve en az 2 saniyelik doldurma süresi kontrolü vardır.

1. Cloudflare panelinde **Turnstile → Add widget**. *Widget mode*: **Managed**; *Hostname management* bölümüne sitenin alan adını (örn. `alanadin.com`) ekleyin. Geliştirme için `localhost` da ekleyebilirsiniz.
2. Oluşan **Site Key** ve **Secret Key** değerlerini `.env`'e yazın (Secret Key'i commit etmeyin):
   ```
   TURNSTILE_SITE_KEY="..."
   TURNSTILE_SECRET_KEY="..."
   ```
3. Sunucuyu yeniden başlatın. Site Key tarayıcıya `GET /api/config` ile verilir; Secret Key yalnızca sunucuda kalır ve her gönderimde `siteverify` ile doğrulama için kullanılır (5 sn zaman aşımı).

Davranış:
- **Production** (`NODE_ENV=production`) `TURNSTILE_SECRET_KEY` olmadan iki uç da 503 ("Form geçici olarak kullanılamıyor") döner ve açılışta uyarı loglanır.
- **Geliştirme**'de anahtarlar tanımlı değilse Turnstile doğrulaması atlanır (tuzak alanı ve 2 sn kontrolü yine çalışır).
- Doğrulama başarısızsa 400, Cloudflare'a ulaşılamazsa 503 döner; mesaj ve abonelik kaydedilmez.
- Form tarafında kutu `interaction-only` modundadır: ziyaretçi yalnızca Cloudflare ek doğrulama isterse bir şey görür.

**Geliştirmede test anahtarları** (Cloudflare'ın resmî test çiftleri; gerçek doğrulama yapmaz):

| Amaç | Site Key | Secret Key |
| --- | --- | --- |
| Her zaman geçer | `1x00000000000000000000AA` | `1x0000000000000000000000000000000AA` |
| Her zaman reddeder | `2x00000000000000000000AB` | `2x0000000000000000000000000000000AA` |
| Token'ı "zaten kullanıldı" diye reddeder | `3x00000000000000000000FF` | `3x0000000000000000000000000000000AA` |

Test anahtarlarını yalnızca geliştirmede kullanın; production'da gerçek anahtar çifti gerekir. `TURNSTILE_TEST_VERIFIER=1` yalnızca otomatik testler içindir (sahte doğrulayıcı) ve `NODE_ENV=production` iken sunucu açılmaz.

## Güvenlik ve dağıtım ayarları

- `TRUST_PROXY=1` — Uygulama Plesk/Nginx gibi bir ters vekilin arkasında çalışıyorsa tanımlayın. Hız sınırları ve giriş kilidi `req.ip` kullanır; bu ayar olmadan vekil arkasında tüm ziyaretçiler tek IP gibi görünür. Doğrudan internete açık çalışıyorsa tanımlamayın.
- `MEDIA_BASE_URL` — R2 medya alan adı; İçerik Güvenlik Politikası'nda görsel ve video kaynağı olarak izin alır (aşağıya bakın).
- Üretimde (`NODE_ENV=production`) HSTS ve İçerik Güvenlik Politikası başlıkları gönderilir; geliştirme sunucusunda yalnızca temel başlıklar vardır.
- İletişim formu IP başına saatte 5, bülten kaydı saatte 10 istekle sınırlıdır (bellek içi, yeniden başlatmada sıfırlanır).
