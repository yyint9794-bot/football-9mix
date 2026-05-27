# KV ချိတ်ခြင်း — Dashboard Add မရရင် (သေချာအလုပ်လုပ်တဲ့နည်း)

Bindings box နှိပ်လို့မရရင် **ဒီနည်းသာ** သုံးပါ။

---

## အဆင့် ၁ — KV Namespace ID ယူပါ (Bindings page မသွားပါ)

Browser မှာ ဒီ link ဖွင့်ပါ (login လုပ်ထားရပါမယ်):

**https://dash.cloudflare.com/6bf98f7ca096abc0bf87e011b3e3a9d3/workers/kv/namespaces**

သို့မဟုတ် ဘယ်ဘက် menu: **Workers & Pages** → **KV**

1. **Create a namespace** နှိပ်ပါ  
2. Name: `football-wallet` → Save  
3. list ထဲက **football-wallet** ကို **နာမည်ကို နှိပ်ပါ** (box မဟုတ်)  
4. ညာဘက် (သို့မဟုတ် အပေါ်) **Namespace ID** ပေါ်မယ် — **Copy** နှိပ်ပါ  

ဥပမာ ID ပုံစံ: `a1b2c3d4e5f6789012345678901234567` (32 လုံးခန့်)

---

## အဆင့် ၂ — PC မှာ wrangler.toml ပြင်ပါ

`e:\FootBall\wrangler.toml` ဖွင့်ပြီး အောက်က ၃ လိုင်း **ဖြည့်ပါ** (comment `#` ဖယ်ပြီး):

```toml
[[kv_namespaces]]
binding = "WALLET_KV"
id = "ဒီနေရာမှာ_copy_လုပ်ထားတဲ့_ID"
```

---

## အဆင့် ၃ — GitHub သို့ push

PowerShell:

```powershell
cd e:\FootBall
git add wrangler.toml
git commit -m "chore: bind WALLET_KV namespace"
git push
```

၁–၂ မိနစ် စောင့်ပါ (Cloudflare auto deploy)။

---

## အဆင့် ၄ — Admin စမ်းပါ

**https://ballpwal.org/admin**

- Username: `admin`  
- Password: Cloudflare **Build** env မှာ ထားထားတဲ့ `WALLET_ADMIN_PASS` (မထားရသေးရင် အောက်ကြည့်)

---

## Admin password (Build env — Functions မဟုတ်)

**football-9mix Pages project** → **Settings** → ဘယ်ဘက် **Build**  

**Environment variables** → Production → Add (ဒီမှာ Add ရနိုင်တတ်ပါတယ်):

| Name | Value |
|------|--------|
| `WALLET_ADMIN_USER` | `admin` |
| `WALLET_ADMIN_PASS` | `Ball9mix2026` (ကိုယ်ကြိုက်) |
| `NODE_VERSION` | `22` |
| `VITE_HTAY_API_KEY` | `demoapi` |

Save → **Retry deployment**

---

## Namespace ID ပို့ပေးပါ

Copy လုပ်ထားတဲ့ **Namespace ID** ကို chat မှာ paste လုပ်ပေးပါ —  
ငါ `wrangler.toml` ထည့်ပြီး push လုပ်ပေးပါမယ် (သင် push မလုပ်ရရင်)။
