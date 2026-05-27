# Google AdSense — ငွေရှာဖို့ (Monetization)

ဤ app သည် **Google AdSense** နှင့် ချိတ်ထားပြီးဖြစ်ပါသည်။ သင် လုပ်ရမည့်အရာမှာ AdSense account ဖွင့်ပြီး **`ca-pub-` ID** ထည့်ရုံသာဖြစ်ပါသည်။

## အဆင့် ၁ — AdSense account

1. [https://www.google.com/adsense](https://www.google.com/adsense) သို့ ဝင်ပါ (Google account လိုပါသည်)
2. **Sites** → **Add site** → `ballpwal.org` ထည့်ပါ
3. Site **စစ်ဆေးခြင်း (approval)** — ပြီးမှ ကြော်ငြာပြပြီး ဝင်ငွေ စတင်ပါမည် (ရက် ၁–၂ ပတ်ခန့် ကြာနိုင်သည်)

**အရေးကြီး (approval လွယ်အောင်)**

- `https://ballpwal.org/privacy` — ကိုယ်ရေးမူဝါဒ စာမျက်နှာ ရှိပြီးသား
- `https://ballpwal.org/ads.txt` — AdSense ထဲမှ ads.txt ကို `public/ads.txt` မှာ ထည့်ပါ
- Site တွင် အကြောင်းအရာ ရှိရမည် (ပွဲစဉ်၊ stream — ယခု app မှာ ရှိပြီး)

## အဆင့် ၂ — Publisher ID ထည့်ခြင်း

AdSense → **Account** → **Publisher ID** (`ca-pub-xxxxxxxxxxxxxxxx`)

Cloudflare Pages → **Settings** → **Environment variables** (Production):

| Name | Value |
|------|--------|
| `VITE_ADSENSE_CLIENT` | `ca-pub-xxxxxxxxxxxxxxxx` |

ထည့်ပြီး **Retry deployment** လုပ်ပါ (build အသစ် လိုသည်)။

**ဒီတစ်ခုတည်းနဲ့** AdSense dashboard မှာ **Auto ads** ဖွင့်ထားရင် Google က site တစ်လုံးလုံးမှာ ကြော်ငြာ အလိုအလျောက် ထားပေးပါမည် — slot ID မလိုသေးပါ။

## အဆင့် ၃ — Auto ads (အကြံပြု)

AdSense → **Ads** → **Auto ads** → `ballpwal.org` → **ON**

- In-page, Anchor, Vignette စသည် ဖွင့်နိုင်ပါသည်
- Traffic များလာလေ impressions များလာ → **ဝင်ငွေ တိုး**

## အဆင့် ၄ — Ad unit ထပ်ဖန်တီးခြင်း (optional — ဝင်ငွေ ပိုရန်)

**Ads** → **By ad unit** → **Display ads** → Responsive ဖန်တီးပြီး **Slot ID** ကူးယူပါ။

Env ထဲ ထပ်ထည့်ပါ:

| Variable | နေရာ |
|----------|--------|
| `VITE_ADSENSE_SLOT_TOP` | ပင်မ အပေါ် |
| `VITE_ADSENSE_SLOT_INLINE` | ပွဲစဉ်ကြား |
| `VITE_ADSENSE_SLOT_BOTTOM` | ပင်မ အောက် |
| `VITE_ADSENSE_SLOT_LIVE` | Live player (ပင်မ site) |

**မပြပါ:** `/bet` (လောင်းမှု၊ ငွေသွင်း/ထုတ်) နှင့် `/admin` — AdSense script လည်း ဤ route များတွင် မတင်ပါ။

## ads.txt

AdSense → Sites → `ballpwal.org` → **ads.txt** ကူးယူ → `public/ads.txt` ထည့်ပြီး deploy။

ဥပမာ:

```text
google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0
```

## ငွေရရှိခြင်း

- AdSense → **Payments** — ဘဏ်အကောင့် ချိတ်ပါ
- အနည်းဆုံး payout threshold (ဥပမာ $100) ရောက်မှ လွှဲပေးပါမည်
- ဝင်ငွေ = ad impressions + clicks (နိုင်ငံ၊ niche၊ traffic ပေါ် မူတည်)

## မရသေးရင်

| ပြဿနာ | ဖြေရှင်း |
|--------|----------|
| ကြော်ငြာ မပေါ် | Ad blocker ပိတ်ပါ; approval ပြီးပြီလား |
| Site disapproved | Gambling/betting policy — AdSense သည် betting site များကို မလက်ခံချိန်ရှိသည်; **ပွဲကြည့်ရှု + sports content** အဖြစ် present လုပ်ပါ |
| Build后 ID မသုံး | `VITE_*` deploy မတိုင်မီ ထည့်ပြီး rebuild |

**မှတ်ချက်:** လောင်းကြေး (betting) အကြောင်းအရာများပါသော site များကို AdSense က ငြင်းပယ်နိုင်ပါသည်။ Approval မရရင် sports streaming / news focus ဖြင့် သီးခြား section သို့မဟုတ် AdSense support နဲ့ တိုင်ပင်ပါ။
