# Cloudflare env variables (Dashboard Add ပိတ်နေရင်)

Warning: *Environment variables are managed through wrangler.toml. Only **Secrets** can be managed via Dashboard.*

## Build (Vite) — `.env.production` သုံးပါ

Repo ထဲ `/.env.production` မှာ VITE_* ထည့်ထားပြီး — deploy မှာ auto သုံးပါသည်။

## Admin password — Dashboard မှာ **Secret** ထည့်ပါ

1. **football-9mix** Pages → **Settings** → **Variables and Secrets**
2. **+ Add**
3. **Type: Secret** (မဟုတ် plain Text)
4. Name: `WALLET_ADMIN_PASS` | Value: သင့် password
5. Save → **Retry deployment**

Optional Secret: `WALLET_ADMIN_USER` = `admin` (သို့မဟုတ် wrangler.toml [vars] မှာ ရှိပြီး)

## KV

Dashboard **Bindings**: `WALLET_KV` → `football-wallet` ✓
