# APK ဒေါင်းလုဒ် ပြင်ရန် — ၅ မိနစ်

## ပြဿနာ

`APK not found` = R2 bucket ထဲမှာ ဖိုင် မရှိသေး။

## နည်းလမ်း A — GitHub (အကြံပြု)

### ၁) R2 S3 keys ဖန်တီး

Cloudflare → **R2** → **Manage R2 API Tokens** → **Create API token**

- Permission: **Object Read & Write**
- Bucket: **9mix-football-apk**

Access Key ID + Secret Access Key ကို copy။

### ၂) GitHub Secrets

`football-9mix` → Settings → Secrets:

| Secret | Value |
|--------|--------|
| `CLOUDFLARE_API_TOKEN` | `football-9mix build token` (cfut_...) |
| `CLOUDFLARE_ACCOUNT_ID` | `6bf98f7ca096abc0bf87e011b3e3a9d3` |
| `R2_ACCESS_KEY_ID` | R2 S3 key |
| `R2_SECRET_ACCESS_KEY` | R2 S3 secret |

### ၃) Workflow

Actions → **Upload APK to R2** → **Run workflow**

### ၄) Binding

Pages **football-9mix** → Bindings → `APK_BUCKET` → `9mix-football-apk`

---

## နည်းလမ်း B — PC (local)

```powershell
cd e:\FootBall
copy .env.cloudflare.local.example .env.cloudflare.local
notepad .env.cloudflare.local
```

`CLOUDFLARE_API_TOKEN=` နောက်မှာ **football-9mix build token** ထည့် → save

```powershell
npm run upload:apk
npm run pages:deploy
```

---

## စစ်

`https://ballpwal.org/downloads/9mix-football-v15.apk` → ဒေါင်းလုဒ် စရမည်
