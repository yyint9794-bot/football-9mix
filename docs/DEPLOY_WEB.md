# Web deploy — app-version.json v15 မပေါ်ရင်

## ပြဿနာ

`https://ballpwal.org/app-version.json` မှာ **v11** ပြနေရင် GitHub Actions deploy **မအောင်မြင်သေး** (သို့) Secrets မရှိ။

### Secret မှားလျှင် deploy ပျက်

| မှား | မှန် |
|------|-----|
| curl command တစ်ခုလုံး | `cfut_...` token သာ |
| URL / `Authorization` ပါ | token သာ |
| Account ID မှာ `football-9mix` | `6bf98f7ca096abc0bf87e011b3e3a9d3` (32 လုံး hex) |

## GitHub Actions ပြင်ဆင်ချက်

Workflow: **Deploy web to Cloudflare Pages**

### Secrets (Settings → Secrets and variables → Actions)

| Secret | လိုအပ် |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | API Token — Permission: **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard URL ထဲ account id |

Token ဖန်တီးရန်: Cloudflare Dashboard → My Profile → API Tokens → Create Token → **Edit Cloudflare Workers** template (Pages ပါ)

### Run workflow

Actions → **Deploy web to Cloudflare Pages** → **Run workflow**

အနီရောင် ✓ ဖြစ်ရမည်။ `whoami` step မှာ account ပြရမည်။

## စစ်ဆေးမှု

Deploy ပြီးရင်:

- `https://ballpwal.org/app-version.json` → `"versionCode": 15`
- `https://ballpwal.org/api/app-version` → v15 (function backup)

## PC မှ deploy (token ရှိရင်)

```bash
set CLOUDFLARE_API_TOKEN=your_token
set CLOUDFLARE_ACCOUNT_ID=your_account_id
npm run pages:deploy
```

## APK

`https://ballpwal.org/downloads/9mix-football-v15.apk` — R2 (`docs/APK_HOSTING_R2.md`)
