# Web deploy — app-version.json အသစ် မပေါ်ရင်

## ပြဿနာ

`https://ballpwal.org/app-version.json` မှာ **v11** ပြနေရင် App Update မပေါ်ပါ — site deploy မပြီးသေး။

## အဖြေ

1. GitHub → **Actions** → **Deploy web to Cloudflare Pages** → **Run workflow**
2. (သို့) **App + Web release** workflow အောင်မြင်ရင် အလိုအလျောက် deploy

Cloudflare Secrets လိုအပ်သည်:

- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

## စစ်ဆေးမှု

Deploy ပြီးရင် browser မှာ:

`https://ballpwal.org/app-version.json`

→ `"versionCode": 15` (သို့မဟုတ် နောက်ဆုံး version)

## APK

`https://ballpwal.org/downloads/9mix-football-v15.apk` — R2 bucket + Pages `APK_BUCKET` binding လိုသည် (`docs/APK_HOSTING_R2.md`)
