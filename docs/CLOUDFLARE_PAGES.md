# Cloudflare Pages — ballpwal.org

Deploy the 9Mix / Football Myanmar app on **Cloudflare Pages** with **ballpwal.org**.

## 1. GitHub (or GitLab) သို့ push

Repo ကို Git hosting ပေါ် တင်ထားပါ။

## 2. Cloudflare Pages project ဖန်တီးခြင်း

1. [Cloudflare Dashboard](https://dash.cloudflare.com) → **Workers & Pages** → **Create** → **Pages** → **Connect to Git**
2. Repository ရွေးပါ
3. Build settings:

| Setting | Value |
|--------|--------|
| Framework preset | None |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Root directory | `/` (repo root) |

4. **Environment variables** (Production):

| Name | Example |
|------|---------|
| `VITE_HTAY_API_KEY` | your Htay API key |
| `VITE_HTAY_FOOTBALL_VERSION` | `v7` |
| `VITE_TELEGRAM_URL` | `https://t.me/yourchannel` |
| `STREAM_REFERER` | `https://ballpwal.org/` |
| `WALLET_ADMIN_USER` | `admin` |
| `WALLET_ADMIN_PASS` | strong password (change default) |
| `VITE_ADSENSE_CLIENT` | `ca-pub-...` (optional — see [docs/ADS.md](ADS.md)) |
| `VITE_ADSENSE_SLOT_TOP` | Ad unit slot ID |
| `VITE_ADSENSE_SLOT_INLINE` | Ad unit slot ID |
| `VITE_ADSENSE_SLOT_BOTTOM` | Ad unit slot ID |
| `VITE_ADSENSE_SLOT_BET` | 9Mix screens (optional) |
| `VITE_ADSENSE_SLOT_PAYMENT` | Deposit/withdraw (optional) |
| `VITE_ADSENSE_SLOT_LIVE` | Live player (optional) |
| `VITE_VIDEO_AD_URL` | Optional MP4 pre-roll ad |

ကြော်ငြာ setup အသေးစိတ်: **[docs/ADS.md](ADS.md)** — `public/ads.txt` ကိုလည်း AdSense မှ ထည့်ပါ။

5. **Save and Deploy**

## 3. KV namespace (wallet / login) — မဖြစ်မနေ

Admin (`/admin`) နဲ့ User login (`/bet`) သည် **KV** မချိတ်ရင် ဝင်ရန် မရပါ။

1. Dashboard → **Workers & Pages** → **KV** → **Create a namespace**  
   Name: `football-wallet` (ဥပမာ)
2. Pages project **`football-9mix`** → **Settings** → **Functions** → **KV namespace bindings**
3. Add binding:
   - **Variable name:** `WALLET_KV` (အတိအကျ — စာလုံးမှားရင် login fail)
   - **KV namespace:** `football-wallet`
4. **Deployments** → **Retry deployment** (သို့မဟုတ် Git push)

မှားရင် error: `WALLET_KV binding မရှိပါ` သို့မဟုတ် `Server response မမှန်ပါ`

`wrangler.toml` ထဲ `REPLACE_WITH_*` IDs ကို local `wrangler pages dev` အတွက်သာ — Git deploy မှာ Dashboard binding သည် လုံလောက်ပါသည်။

## 4. Custom domain — ballpwal.org

Domain က Cloudflare မှာ **Active** ဖြစ်ပြီးသား ဖြစ်ပါက:

1. Pages project → **Custom domains** → **Set up a custom domain**
2. `ballpwal.org` ထည့်ပါ
3. `www.ballpwal.org` ထည့်ပြီး **Redirect** → `ballpwal.org` (optional)
4. DNS record တွေ auto ထည့်ပေးပါလိမ့်မယ်

**SSL/TLS** (zone settings): **Full (strict)** ထားပါ။

## 5. စစ်ဆေးခြင်း

Deploy ပြီးရင်:

- `https://ballpwal.org` — app ဖွင့်ရမယ်
- `https://ballpwal.org/api/hls-proxy?url=...` — live stream proxy
- Login / wallet — admin credentials ဖြင့် စမ်းပါ

Phone: browser menu → **Add to Home Screen** (PWA)

## 6. Local preview (optional)

```bash
npm install
npm run build
npx wrangler pages dev dist --compatibility-flags=nodejs_compat
```

KV binding အတွက် `wrangler.toml` ထဲ namespace ID များ ဖြည့်ပါ။

## Troubleshooting

| Problem | Fix |
|--------|-----|
| Wallet login fails | KV binding `WALLET_KV` ရှိမရှိ၊ redeploy |
| Stream မဖွင့်ဘူး | `STREAM_REFERER` env var စစ်ပါ |
| Blank page on refresh | `public/_redirects` → `dist` ထဲ ရှိမရှိ (build ပြန် run) |
| Old cache | Hard refresh သို့မဟုတ် Cloudflare **Purge cache** |
