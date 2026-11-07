#!/usr/bin/env bash
# İsmail Semih Studio: complete project + site content export.
# Never includes private credentials or visitor messages.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
OUTPUT="${1:-$ROOT/ismail-semih-studio-tam-paket.zip}"

if [[ "$OUTPUT" != /* ]]; then
  OUTPUT="$ROOT/$OUTPUT"
fi
if ! command -v python3 >/dev/null; then
  echo "Python 3 bulunamadı; Codespaces ortamında tekrar deneyin." >&2
  exit 1
fi
if ! command -v git >/dev/null; then
  echo "Git bulunamadı." >&2
  exit 1
fi

TEMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TEMP_DIR"' EXIT
mkdir -p "$TEMP_DIR/site"

echo "Proje dosyaları ZIP için hazırlanıyor..."
git archive HEAD | tar -xf - -C "$TEMP_DIR/site"

# Explicitly remove data that should not travel in a downloadable archive.
rm -f "$TEMP_DIR/site/data/auth.json" \
      "$TEMP_DIR/site/data/ai-secret.json" \
      "$TEMP_DIR/site/data/ai-config.json" \
      "$TEMP_DIR/site/data/instagram-secret.json" \
      "$TEMP_DIR/site/data/messages.json" \
      "$TEMP_DIR/site/data/subscribers.json"
find "$TEMP_DIR/site" -type f -name '.env' -delete
find "$TEMP_DIR/site" -type f -name '.env.local' -delete

# Codespaces stores real site content separately from committed starter data.
mkdir -p "$TEMP_DIR/site/data" "$TEMP_DIR/site/public"
for f in data/site-data.json data/draft-data.json; do
  if [[ -f "$f" ]]; then
    cp "$f" "$TEMP_DIR/site/$f"
    echo "İçerik eklendi: $f"
  fi
done
if [[ -d public/uploads ]]; then
  mkdir -p "$TEMP_DIR/site/public/uploads"
  cp -a public/uploads/. "$TEMP_DIR/site/public/uploads/"
  echo "Yüklenen medya dosyaları eklendi."
fi

# Build can be produced after extraction with npm install && npm run build.
cat > "$TEMP_DIR/site/PAKETI_AC_BENI_OKU.txt" <<'INFO'
İSMAİL SEMİH STUDIO - TAM SİTE PAKETİ

İçerik: uygulama kaynak kodu, sunucu, yönetim paneli, GitHub'da
bulunan statik görseller, varsa Codespaces'te kaydedilmiş site verileri
(data/site-data.json ve data/draft-data.json) ve yüklenen medya
(public/uploads/).

Özel yönetici parolaları, API anahtarları, giriş oturumları, iletişim
mesajları ve bülten aboneleri pakete konulmaz.

Çalıştırmak için:
  npm install
  npm run dev

Yönetici girişi için üretim ortamında ADMIN_PASSWORD (12+ karakter)
ortam değişkenini güvenli şekilde tanımlayın.
Bu paket node_modules veya özel .env dosyaları içermez.
INFO

mkdir -p "$(dirname "$OUTPUT")"
python3 - "$TEMP_DIR/site" "$OUTPUT" <<'PY'
from pathlib import Path
import sys
from zipfile import ZipFile, ZIP_DEFLATED

source, target = Path(sys.argv[1]), Path(sys.argv[2])
with ZipFile(target, 'w', compression=ZIP_DEFLATED, compresslevel=6) as archive:
    for file in sorted(source.rglob('*')):
        if file.is_file():
            archive.write(file, 'ismail-semih-studio/' + str(file.relative_to(source)))
print(f"TAM PAKET HAZIR: {target} ({target.stat().st_size / 1024 / 1024:.1f} MB)")
PY

echo "Codespaces Dosya Gezgini içinde ZIP dosyasına sağ tıklayıp Download seçin."
