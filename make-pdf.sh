#!/bin/sh
# Genera la web y los PDF con Chrome headless (mismo motor que el navegador).
set -e
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
pdf() { "$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf="$PWD/$2" "file://$PWD/$1" 2>/dev/null; echo "$2 listo"; }
node build.mjs
node build-v2.mjs
pdf index.html modos-griegos.pdf
pdf "v2/index.html?v=negro" v2/modos-tonica-negra.pdf
pdf "v2/index.html?v=colores" v2/modos-colores.pdf
