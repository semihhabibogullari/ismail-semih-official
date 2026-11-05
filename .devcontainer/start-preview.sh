#!/usr/bin/env bash
set -euo pipefail

if curl --silent --fail http://127.0.0.1:3000/ >/dev/null 2>&1; then
  echo "Önizleme zaten http://localhost:3000 adresinde çalışıyor."
  exit 0
fi

if [ ! -d node_modules ]; then
  npm install
fi

nohup npm run dev >/tmp/ismail-semih-preview.log 2>&1 </dev/null &
echo "Web sitesi başlatılıyor. Codespaces > Ports > 3000 > Open in Browser."
echo "Sunucu günlüğü: /tmp/ismail-semih-preview.log"
