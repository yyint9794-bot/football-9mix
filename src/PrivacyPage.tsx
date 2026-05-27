import { openHomePage } from './navigation';

export function PrivacyPage() {
  return (
    <main className="legal-page">
      <header className="legal-head">
        <button type="button" className="payment-back" onClick={openHomePage}>
          ← ပင်မသို့
        </button>
        <h1>ကိုယ်ရေးအချက်အလက် မူဝါဒ</h1>
      </header>

      <article className="legal-body">
        <p>
          Football Myanmar / 9Mix (ballpwal.org) သည် ဝန်ဆောင်မှုပေးရာတွင် Google AdSense ကြော်ငြာများ
          အသုံးပြုနိုင်ပါသည်။ AdSense သည် cookie နှင့် device အချက်အလက်ဖြင့် သင့်လျော်သော
          ကြော်ငြာများ ပြသနိုင်ပါသည်။
        </p>
        <h2>စုဆောင်းသော အချက်အလက်</h2>
        <ul>
          <li>အကောင့် ဝင်ရောက်မှု (username — wallet ဝန်ဆောင်မှုအတွက်)</li>
          <li>ငွေသွင်း/ထုတ် တောင်းဆိုချက် (ဖုန်း၊ ပမာဏ — admin စစ်ဆေးရန်)</li>
          <li>ပွဲကြည့်ရှု နှင့် လောင်းမှု အသုံးပြုမှု မှတ်တမ်း (ဝန်ဆောင်မှုအတွင်း)</li>
        </ul>
        <h2>ကြော်ငြာ (Google)</h2>
        <p>
          Google partner sites နှင့် apps တွင် ကြော်ငြခြင်းအတွက် Google သည် cookie
          အသုံးပြုနိုင်ပါသည်။{' '}
          <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noreferrer">
            Google Ads အကြောင်း
          </a>
        </p>
        <h2>ဆက်သွယ်ရန်</h2>
        <p>
          Viber / Telegram — <a href="tel:+959674646102">09674646102</a>
        </p>
        <p>
          <small>နောက်ဆုံး ပြင်ဆင်ချိန် — 2026</small>
        </p>
      </article>
    </main>
  );
}
