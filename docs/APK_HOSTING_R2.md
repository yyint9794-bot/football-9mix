# APK hosting — Cloudflare R2 (GitHub မသုံး)

GitHub က file **100MB** ထက် မကြီးရ — APK က **Cloudflare R2** မှာ သိမ်းပြီး `https://ballpwal.org/downloads/...` ကနေ ဒေါင်းလုဒ် ပေးပါတယ်။

## တစ်ခါပဲ setup (Cloudflare Dashboard)

Deploy error: `R2 bucket '9mix-football-apk' not found` ဆိုရင် အောက်လုပ်ပါ။

1. **R2** → **Create bucket** → 이름: **`9mix-football-apk`** (အမည် တိတိကျကျ)
2. **Workers & Pages** → project **football-9mix** → **Settings** → **Bindings**
3. **Add binding** → **R2 bucket**
   - Variable name: `APK_BUCKET`
   - Bucket: `9mix-football-apk`
4. GitHub Secrets (ရှိပြီးသား): `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`

သို့မဟုတ် terminal:

```bash
npx wrangler r2 bucket create 9mix-football-apk
```

Web deploy (app-version.json v15) က wrangler.toml မှာ R2 မထည့်ဘဲ တက်နိုင်သည်။ APK ဒေါင်းလုဒ်အတွက် bucket + **Dashboard binding** လိုပါသေးတယ်။

## "APK not found" ပြရင်

R2 bucket ဗလာဖြစ်နေသည် — **APK တင်ရမည်**:

1. GitHub → **Actions** → **Upload APK to R2** → **Run workflow**  
   (သို့ **App + Web release** — build + R2 + web deploy)
2. Cloudflare → Pages **football-9mix** → Bindings → `APK_BUCKET` → `9mix-football-apk`
3. စစ်: `https://ballpwal.org/downloads/9mix-football-v15.apk` → HTTP **200**

## နောက်တိုင်း release

```bash
npm run release:bump   # သို့ npm run release
```

- APK build → **R2 upload** (136MB လည်း OK)
- Web + Firebase version JSON update
- GitHub သို့ APK file **မတင်**

## လက်ဖြင့် upload (PC မှာ)

```bash
npm run android:apk
set CLOUDFLARE_API_TOKEN=your_token
set CLOUDFLARE_ACCOUNT_ID=6bf98f7ca096abc0bf87e011b3e3a9d3
npm run upload:apk
```

## ဒေါင်းလုဒ် link

`https://ballpwal.org/downloads/9mix-football-v11.apk`

Firebase Remote Config `app_download_url` ကိုလည်း ဒီ link ထားပါ။
