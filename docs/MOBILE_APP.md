# ဖုန်း Mobile App

Web (`/`) နဲ့ **မတူဘဲ** သီးခြား mobile UI — **`/app`**

## ဖွင့်နည်း

1. Browser: **https://ballpwal.org/app**
2. **Add to Home Screen** (Chrome menu) — app လို fullscreen
3. Web ပင်မ footer: **「Mobile App ဖွင့်မည်」**

## Tab များ

| Tab | လုပ်ဆောင်ချက် |
|-----|----------------|
| ပင်မ | ပွဲစဉ် + hero + ကြည့်မည် |
| တိုက်ရိုက် | Live ပွဲများ |
| 9Mix | လောင်းမှု (login + hub) |
| ငွေ | လက်ကျန်ငွေ / ဝင်ရန် |

## Android APK ဒေါင်းလုဒ်

Web ပင်မ **「အက်ပ်ဒေါင်းလုဒ်」** — Android ဖုန်းမှာ **APK** ဒေါင်းပြီး install လုပ်နိုင်သည် (Mobile App `/app` နဲ့ တူသည်)။

### App update + Web ဒေါင်းလုဒ် (တစ်ခါတည်း — လက်ဖြင့် Web upload **မလို**)

1. `android/app/build.gradle` ထဲ `versionCode` ကို **+1** မြှင့်ပါ (သို့မဟုတ် အောက်က `--bump` သုံး)
2. တစ်ကြောင်းတည်း:

```bash
npm run release
```

သို့မဟုတ် version အလိုအလျောက် မြှင့်ပြီး push:

```bash
npm run release:bump
```

ဒါက APK + `app-version.json` + site download ကို commit/push လုပ်ပြီး **GitHub Actions** က `ballpwal.org` ကို deploy လုပ်ပေးပါတယ်။

PC မှာ Java မရှိရင် `npm run release` မှာပဲ version ဖိုင်တွေ sync ဖြစ်ပြီး push ပြီးရင် CI က APK build လုပ်ပေးမည်။

### Play Store မဟုတ် — direct APK

Users: Settings → Install unknown apps → Chrome ခွင့်ပြီး APK install။

## Ads

Mobile app route (`/app`) မှာလည်း betting နှင့်တူသည် — **AdSense script မတင်ပါ** (`isAdsAllowedPath`).
