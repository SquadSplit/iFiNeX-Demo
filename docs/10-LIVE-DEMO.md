# 10 — Live demo on your repository page

What visitors get: a **Live demo** link in the repository sidebar and README. Click it and choose **Website** or **Mobile app** (or both side by side). Fake people, fake data, runs only in the browser.

A README cannot run an app inside itself (GitHub strips scripts and iframes). The standard way is a link plus screenshots, which is what this does.

## Publish it (5 minutes, no tools)
1. GitHub → your repository → **Settings → Pages → Source: GitHub Actions**.
2. Repository → **Actions** → *Deploy interactive demo (GitHub Pages)* → **Run workflow**. Wait for the green tick.
3. The demo address is shown in that run (usually `https://YOUR-USER.github.io/YOUR-REPO/`). Open it and check.
4. Repository main page → ⚙ next to **About** → tick **Use your GitHub Pages website** (or paste the demo address in *Website*) → Save. The link now shows in the sidebar.
5. Put the address in the README badge/link line at the top.

Only one Pages site per repository: if this repo already serves your real website, copy the built `demo/dist` into a sub-folder (e.g. `demo/`) of that site instead, or create a second repository for the demo.

## Rebuild after changing the web code
`bash demo/build-demo.sh` (or push: the workflow runs by itself on changes in `demo/` or `web/`).

## What it contains
`demo/demo-backend.js` replaces the Supabase client with an in-browser stand-in (tables, filters, RPCs, realtime). The real website code runs unchanged. Seed data: 3 users, 2 cards, expenses, 2 squads with 4 people. Tests: `python3 tests/test_demo.py 8186` and `python3 tests/test_demo_chooser.py 8185` (need Playwright).
