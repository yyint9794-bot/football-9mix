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

Set these values in `.env` after your ad network account is approved:

```bash
VITE_ADSENSE_CLIENT=ca-pub-your-publisher-id
VITE_ADSENSE_SLOT_TOP=your-top-slot-id
VITE_ADSENSE_SLOT_INLINE=your-inline-slot-id
VITE_ADSENSE_SLOT_BOTTOM=your-bottom-slot-id
VITE_VIDEO_AD_URL=https://example.com/video-ad.mp4
```

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
