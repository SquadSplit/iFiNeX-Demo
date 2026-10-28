#!/bin/bash
# bash tools/bump-version.sh <web> <app>      e.g.  bash tools/bump-version.sh 8.6 2.2.0
# Changes the version everywhere it is shown or compared, then rebuilds every copy (sync-www + APK repos).
set -euo pipefail
W=${1:?web version e.g. 8.6}; A=${2:?app version e.g. 2.2.0}
R=$(cd "$(dirname "$0")/.." && pwd); cd "$R"
sed -i -E "s/var WEB_VER = '[^']*'/var WEB_VER = '$W'/" web/ifinex-update.js
printf '{"web":"%s","app":"%s","built":"%s"}\n' "$W" "$A" "$(date +%F)" > web/ifinex-version.json
sed -i -E "s/web v[0-9.]+ · app v[0-9.]+/web v$W · app v${A%.*}/g" web/bill-tracker.html web/squad.html
for E in mobile; do
  sed -i -E "s/versionName \"[^\"]*\"/versionName \"$A\"/" $E/android/app/build.gradle   # versionCode is computed from the clock inside build.gradle
  sed -i -E "s/\"version\": \"[^\"]*\"/\"version\": \"$A\"/" $E/package.json
done
grep -q "WEB_VER = '$W'" web/ifinex-update.js && echo "web v$W / app v$A set"
bash tools/make-apk-repos.sh
