# Cloudflare API Token — APK upload အတွက်

GitHub Actions **Upload APK to R2** ပျက်ရင် token permission မလုံလောက်ပါ။

## Token ဖန်တီးနည်း

1. [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) → **Create Token**
2. **Create Custom Token**
3. Permissions:

| Resource | Permission |
|----------|------------|
| Account → **R2** | **Edit** |
| Account → **Workers R2 Storage** | **Edit** |
| Account → **Cloudflare Pages** | **Edit** |

4. Account Resources: **Include** → သင့် account (`yyint9794@gmail.com`)
5. Create → token ကို copy (`cfut_...`)

## GitHub Secrets

Repository → Settings → Secrets → Actions:

| Name | Value |
|------|--------|
| `CLOUDFLARE_API_TOKEN` | `cfut_...` သာ (curl မထည့်ရ) |
| `CLOUDFLARE_ACCOUNT_ID` | `6bf98f7ca096abc0bf87e011b3e3a9d3` |

## R2 bucket + Pages binding

1. R2 → bucket **`9mix-football-apk`** (workflow က create လုပ်ပေးနိုင်သည်)
2. Workers & Pages → **football-9mix** → Settings → **Bindings** → R2 **`APK_BUCKET`** → `9mix-football-apk`

## Run workflow

Actions → **Upload APK to R2** → Run workflow

စစ်: `https://ballpwal.org/downloads/9mix-football-v15.apk` → ဒေါင်းလုဒ် စရမည်
