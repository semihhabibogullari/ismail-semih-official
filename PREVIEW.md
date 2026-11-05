# Site Önizlemesi — GitHub Codespaces

Bu depo için **tarayıcıdan tek tıkla önizleme** yapılandırıldı.

## Başlat

1. [Önizlemeli Codespace oluştur](https://codespaces.new/semihhabibogullari/ismail-semih-official/tree/security/admin-auth-and-secrets-hardening)
2. GitHub'da **Create codespace** seçeneğine tıkla. (Hesabın Codespaces kullanım hakkı/ücreti geçerli olabilir.)
3. İlk kurulumda `npm install` otomatik çalışır ve ardından `npm run dev` başlatılır.
4. Site otomatik açılmazsa **Ports** sekmesine geç, **3000** satırında **Open in Browser** seç.
5. Üst menü, slider, takvim ve mobil görünümü tarayıcının responsive görünümünde incele.

> **Güvenlik:** 3000 numaralı portu **Private** bırak. Bunu herkese açık bir yayın bağlantısına çevirmeye gerek yoktur.

## Admin paneli

- Yönetici girişi: `/admin/login`.
- Güvenlik düzeltmesi nedeniyle eski varsayılan parola **artık geçerli değil**.
- GitHub > Settings > Codespaces > Secrets bölümünden **ADMIN_PASSWORD** adlı, **en az 12 karakterli**, benzersiz bir secret ekle ve bu depo için erişim ver.
- Admin paneli **kullanıcı adı + şifre** ile giriş yapar. Varsayılan kullanıcı adı `ismailsemih`; alternatif için `ADMIN_USERNAME` ortam değişkenini ayarlayabilirsin.
- Şifreyi kaynağa ekleme. GitHub Codespaces Secret (`ADMIN_PASSWORD`) olarak tanımla; sonrasında Codespace sunucusunu yeniden başlat. Secret güncellenirse depodaki eski şifre hash'i sonraki başlatmada yenilenir.
- `/admin` artık yeni kutucuklu **Site Stüdyosu**, `/admin/advanced` ise eski gelişmiş paneldir.
- Secret'ı Codespace başlamadan önce ayarlamak en kolay yöntemdir. Daha önce açtıysan Codespace'i yeniden oluştur/yeniden başlat.
- Gerçek parola, API anahtarı ve kişisel bilgileri GitHub deposuna veya kod dosyalarına yazma.

## Bir hata olursa

Codespaces terminalinde:

```bash
cat /tmp/ismail-semih-preview.log
npm run lint
npm run build
```

Manuel başlatmak için:

```bash
npm run dev
```

Bu Codespaces önizlemesidir; kendi alan adında canlıya alınmış yayın değildir. Veriler şimdilik Codespaces dosya sistemi içinde kalır ve kalıcı üretim veritabanı yerine geçmez.

## Geliştirme ortamında giriş

Codespaces ilk açılışta ortam ayarlarının nasıl yapılandırılacağını terminal günlüğüne yazar. Kalıcı yönetici parolasını GitHub Codespaces Secrets bölümünde ADMIN_PASSWORD adıyla tanımlayın, ardından Codespace'i yeniden başlatın.
