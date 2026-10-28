# Contributing
1. Fork, create a branch, make a focused change.
2. Website code lives in `web/`. After any change run `bash tools/sync-www.sh` (copies `web/` into `mobile/www`).
3. Run the demo test: `bash demo/build-demo.sh && python3 tests/test_demo.py 8181` (needs `pip install playwright && playwright install chromium`).
4. Never commit real keys, URLs, e-mails or database dumps. `ifinex-config.json` is git-ignored on purpose.
5. Open a pull request describing what changed and how you tested it.
