# APK hosting — Cloudflare R2 (GitHub မသုံး)

GitHub က file **100MB** ထက် မကြီးရ — APK က **Cloudflare R2** မှာ သိမ်းပြီး `https://ballpwal.org/downloads/...` ကနေ ဒေါင်းလုဒ် ပေးပါတယ်။

## တစ်ခါပဲ setup (Cloudflare Dashboard)

1. **R2** → **Create bucket** → 이름: `9mix-football-apk`
2. **Workers & Pages** → project **football-9mix** → **Settings** → **Bindings**
3. **Add binding** → **R2 bucket**
   - Variable name: `APK_BUCKET`
   - Bucket: `9mix-football-apk`
4. GitHub Secrets (ရှိပြီးသား): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

## နောက်တိုင်း release

```bash
npm run release:bump   # သို့ npm run release
```

- APK build → **R2 upload** (136MB လည်း OK)
- Web + Firebase version JSON update
- GitHub သို့ APK file **မတင်**

## လက်ဖြင့် upload

```bash
npm run android:apk
npm run upload:apk
```

## ဒေါင်းလုဒ် link

`https://ballpwal.org/downloads/9mix-football-v11.apk`

Firebase Remote Config `app_download_url` ကိုလည်း ဒီ link ထားပါ။
