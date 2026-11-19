#!/bin/sh
# Genera modos-griegos.pdf desde index.html con Chrome headless (mismo motor que el navegador).
set -e
cd "$(dirname "$0")"
node build.mjs
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
"$CHROME" --headless=new --disable-gpu --no-pdf-header-footer --virtual-time-budget=10000 \
  --print-to-pdf="$PWD/modos-griegos.pdf" "file://$PWD/index.html" 2>/dev/null
echo "modos-griegos.pdf listo"
