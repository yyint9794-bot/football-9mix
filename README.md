# Football Stream Hub

Premium football match web app built with React, TypeScript and Vite. It uses the Htay Football API endpoint and is configured as a mobile-friendly PWA.

## Run Locally

```bash
npm install
npm run dev
```

The app currently uses `VITE_HTAY_API_KEY=demoapi` from `.env`.

API docs: https://htayapi.com/doc.html#football_api

Optional API version settings:

```bash
VITE_HTAY_FOOTBALL_VERSION=v7
VITE_HTAY_ODDS_FALLBACK_VERSIONS=v1,v2
```

## Ads

Google AdSense slots are wired on the main site, 9Mix betting hub, payment screens, and live player. Copy `.env.example` → `.env` and see **[docs/ADS.md](docs/ADS.md)** for `ads.txt`, slot IDs, and Cloudflare env vars.

## App release (APK + Web download — တစ်ခါတည်း)

`android/app/build.gradle` → `versionCode` +1, ပြီးရင်:

```bash
npm run release
```

သို့မဟုတ် `npm run release:bump` (version auto + push). Web မှာ APK သီးခြား upload **မလို** — CI deploy လုပ်ပေး။

## Deploy (Cloudflare Pages + ballpwal.org)

Production deploy guide: **[docs/CLOUDFLARE_PAGES.md](docs/CLOUDFLARE_PAGES.md)**

Quick summary:

- Build: `npm run build` → output `dist`
- Connect Git repo in Cloudflare Pages
- Bind KV namespace as **`WALLET_KV`** for wallet/login
- Add custom domain **`ballpwal.org`**
- Set `STREAM_REFERER=https://ballpwal.org/` in Pages env vars

## Features

- Htay Football API integration
- Ad-ready sponsor slots
- Responsive web and app-like mobile UI
- Match search and status filters
- League grouped fixtures
- PWA manifest and service worker
