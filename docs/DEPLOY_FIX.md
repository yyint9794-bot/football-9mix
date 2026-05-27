# Web deploy မတက်ရင် (တစ်ခါသာ)

GitHub Actions **Deploy site files** အောင်မြင်ပေမယ့် `ballpwal.org` ဟောင်းနေရင် Cloudflare Git deploy သို့မဟုတ် API token လိုပါတယ်။

## GitHub Secrets (တစ်ခါ ထည့်ပါ)

Repo → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

| Name | ဘယ်ကရမလဲ |
|------|------------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare → My Profile → API Tokens → Create → **Edit Cloudflare Pages** template |
| `CLOUDFLARE_ACCOUNT_ID` | Dashboard URL: `dash.cloudflare.com/<ACCOUNT_ID>` |

ထည့်ပြီးရင် **Actions** → **Deploy site files** → **Run workflow**။

## Cloudflare Dashboard (login လိုသည်)

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** → **football-9mix**
2. **Deployments** → နောက်ဆုံး commit → **Retry deployment**
3. Build command: `npm run build` · Output: `dist`

## APK အသစ် (optional)

**Actions** → **Build Android APK** → **Run workflow** (Java build — မိနစ် ၁၀+)

Web ဒေါင်းလုဒ် ချက်ချင်း: `https://cdn.jsdelivr.net/gh/yyint9794-bot/football-9mix@main/public/downloads/9mix-football.apk`
