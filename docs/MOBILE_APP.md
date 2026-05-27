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

### Build (PC မှာ Android Studio / JDK လိုသည်)

```bash
npm install
npm run android:apk
```

APK ထွက်မည်: `public/downloads/9mix-football.apk`

Deploy:

```bash
git add public/downloads/9mix-football.apk
git push
```

သို့မဟုတ် `npm run build` (APK ရှိရင် `dist/downloads/` သို့ copy)

### Play Store မဟုတ် — direct APK

Users: Settings → Install unknown apps → Chrome ခွင့်ပြီး APK install။

## Ads

Mobile app route (`/app`) မှာလည်း betting နှင့်တူသည် — **AdSense script မတင်ပါ** (`isAdsAllowedPath`).
