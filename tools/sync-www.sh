#!/bin/bash
# Rebuilds the website copy that ships inside the app. Run after ANY change in web/:   bash tools/sync-www.sh
#   web/  ->  mobile/www      (the ONE app: both modes are in the same files)
set -e
R=$(cd "$(dirname "$0")/.." && pwd)
rm -rf "$R/mobile/www"; cp -r "$R/web" "$R/mobile/www"
echo "synced: mobile/www"
