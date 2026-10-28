#!/usr/bin/env bash
# Builds the static interactive demo into demo/dist  (usage: bash demo/build-demo.sh)
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"; WEB="$HERE/../web"; OUT="$HERE/dist"
rm -rf "$OUT"; mkdir -p "$OUT/app"
cp -r "$WEB"/. "$OUT/app/"
cp "$HERE/demo-backend.js" "$OUT/app/vendor/supabase.js"          # the real client is replaced by the in-browser fake
rm -f "$OUT/app/vendor/ifinex-local.js" 2>/dev/null || true
printf '{"format":"ifinex-server","version":1,"name":"iFiNeX DEMO","site":"","supabaseUrl":"https://demo.example.invalid","supabaseKey":"demo-not-a-real-key"}\n' > "$OUT/app/ifinex-config.json"
cp "$HERE/index.html" "$OUT/index.html"; touch "$OUT/.nojekyll"
echo "demo built: $OUT"
