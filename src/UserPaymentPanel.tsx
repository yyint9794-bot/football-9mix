import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchMyTransactions,
  fetchPaymentConfig,
  formatMmk,
  requestPayment,
  type PaymentConfig,
  type PaymentMethod,
} from './wallet/api';
import { useAuth } from './wallet/AuthContext';
import type { WalletTransaction } from './wallet/types';

type UserPaymentPanelProps = {
  mode: 'deposit' | 'withdraw';
};

type Step = 'method' | 'details' | 'form';

const METHOD_META: Record<PaymentMethod, { label: string; logo: string }> = {
  kbz: { label: 'KBZ Pay', logo: '/images/payments/kbz-pay.png' },
  wave: { label: 'Wave Pay', logo: '/images/payments/wave-pay.png' },
};

export function UserPaymentPanel({ mode }: UserPaymentPanelProps) {
  const { user, refresh } = useAuth();
  const [config, setConfig] = useState<PaymentConfig | null>(null);
  const [step, setStep] = useState<Step>('method');
  const [method, setMethod] = useState<PaymentMethod | null>(null);
  const [amount, setAmount] = useState('');
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [txnRef, setTxnRef] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);

  useEffect(() => {
    void Promise.all([fetchPaymentConfig(), fetchMyTransactions()])
      .then(([paymentConfig, txResult]) => {
        setConfig(paymentConfig);
        setTransactions(txResult.transactions);
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : 'ဒေတာ မရပါ');
      })
      .finally(() => setLoading(false));
  }, []);

  if (!user) {
    return null;
  }

  const activeNumber =
    method && config
      ? method === 'kbz'
        ? config.kbz.number
        : config.wave.number
      : '';

  const selectMethod = (next: PaymentMethod) => {
    setMethod(next);
    setStep('details');
    setStatus('');
  };

  const handleCopyNumber = async () => {
    if (!activeNumber) {
      return;
    }
    try {
      await navigator.clipboard.writeText(activeNumber);
      setStatus('နံပါတ် ကူးပြီးပါပြီ');
    } catch {
      setStatus(activeNumber);
    }
  };

  const resetFlow = () => {
    setStep('method');
    setMethod(null);
    setAmount('');
    setPhone('');
    setName('');
    setTxnRef('');
    setStatus('');
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!method) {
      return;
    }

    setStatus('');
    setSubmitting(true);
    try {
      await requestPayment({
        type: mode,
        method,
        amount: Number(amount),
        phone: phone.trim(),
        name: name.trim(),
        txnRef: mode === 'deposit' ? txnRef.trim() : undefined,
      });
      setStatus(
        mode === 'deposit'
          ? 'ငွေသွင်း တောင်းဆိုပြီးပါပြီ — Admin စစ်ဆေးမည်'
          : 'ငွေထုတ် တောင်းဆိုပြီးပါပြီ — Admin စစ်ဆေးမည်',
      );
      const txResult = await fetchMyTransactions();
      setTransactions(txResult.transactions);
      await refresh();
      resetFlow();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="wallet-panel payment-panel">
      <div className="wallet-balance-card">
        <span>လက်ကျန်ငွေ</span>
        <strong>{formatMmk(user.balance)}</strong>
        <small>{user.displayName}</small>
      </div>

      {loading ? <p className="odds-hint">ဖတ်နေပါတယ်…</p> : null}

      {step === 'method' ? (
        <section className="payment-step">
          <h3>{mode === 'deposit' ? 'ငွေသွင်း နည်းလမ်း ရွေးပါ' : 'ငွေထုတ် နည်းလမ်း ရွေးပါ'}</h3>
          <div className="payment-method-grid">
            {(Object.keys(METHOD_META) as PaymentMethod[]).map((key) => (
              <button key={key} type="button" className="payment-method-card" onClick={() => selectMethod(key)}>
                <img src={METHOD_META[key].logo} alt={METHOD_META[key].label} />
                <b>{METHOD_META[key].label}</b>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {step === 'details' && method ? (
        <section className="payment-step">
          <button type="button" className="payment-back" onClick={() => setStep('method')}>
            ← နည်းလမ်း ပြန်ရွေးမည်
          </button>
          <div className="payment-admin-card">
            <img src={METHOD_META[method].logo} alt="" className="payment-admin-logo" />
            <div>
              <span>Admin {METHOD_META[method].label}</span>
              <strong>{activeNumber || 'နံပါတ် မသတ်မှတ်ရသေးပါ'}</strong>
            </div>
            <button type="button" className="payment-copy-btn" onClick={() => void handleCopyNumber()}>
              ကူးမည်
            </button>
          </div>
          <p className="payment-hint">
            {mode === 'deposit'
              ? 'အထက်ပါနံပါတ်သို့ လွဲပြီးမှ အောက်ပါအချက်အလက် ဖြည့်ပြီး ပို့ပါ'
              : 'အထက်ပါ Wallet သို့ ထုတ်ယူရန် အောက်ပါအချက်အလက် ဖြည့်ပါ'}
          </p>
          <button type="button" className="quality-watch live-watch" onClick={() => setStep('form')}>
            {mode === 'deposit' ? 'လွဲပြီးပါပြီ — ဖြည့်မည်' : 'ဆက်လက်ထုတ်မည်'}
          </button>
        </section>
      ) : null}

      {step === 'form' && method ? (
        <form className="payment-form" onSubmit={handleSubmit}>
          <button type="button" className="payment-back" onClick={() => setStep('details')}>
            ← နောက်သို့
          </button>
          <p className="payment-selected">
            {METHOD_META[method].label} · {mode === 'deposit' ? 'ငွေသွင်း' : 'ငွေထုတ်'}
          </p>

          <label className="search-box">
            <span>{mode === 'deposit' ? 'သွင်းငွေ (MMK)' : 'ထုတ်ငွေ (MMK)'}</span>
            <input
              type="number"
              min="1000"
              step="1"
              required
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label className="search-box">
            <span>ဖုန်းနံပါတ်</span>
            <input
              type="tel"
              required
              placeholder="09xxxxxxxxx"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
            />
          </label>
          <label className="search-box">
            <span>နာမည်</span>
            <input
              type="text"
              required
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          {mode === 'deposit' ? (
            <label className="search-box">
              <span>လုပ်ငန်းစဉ် နောက်ဆုံး ၆ လုံး</span>
              <input
                type="text"
                required
                minLength={6}
                maxLength={6}
                pattern="[0-9]{6}"
                placeholder="123456"
                value={txnRef}
                onChange={(event) => setTxnRef(event.target.value.replace(/\D/g, '').slice(0, 6))}
              />
            </label>
          ) : null}

          <button type="submit" className="quality-watch live-watch" disabled={submitting}>
            {submitting ? 'ပို့နေပါတယ်…' : mode === 'deposit' ? 'ငွေသွင်း တောင်းဆိုမည်' : 'ငွေထုတ် တောင်းဆိုမည်'}
          </button>
        </form>
      ) : null}

      {status ? <p className="account-modal-status">{status}</p> : null}

      <div className="wallet-history">
        <strong>လုပ်ဆောင်ချက် မှတ်တမ်း</strong>
        <div className="wallet-tx-list">
          {transactions
            .filter((tx) => tx.type === mode)
            .slice(0, 8)
            .map((tx) => (
              <article className="wallet-tx-item" key={tx.id}>
                <div>
                  <b>
                    {tx.type === 'deposit' ? 'ငွေသွင်း' : 'ငွေထုတ်'}
                    {tx.paymentMethod ? ` · ${tx.paymentMethod.toUpperCase()}` : ''}
                  </b>
                  <small>{new Date(tx.createdAt).toLocaleString()}</small>
                </div>
                <div className="wallet-tx-meta">
                  <strong>{formatMmk(tx.amount)}</strong>
                  <span className={`wallet-status ${tx.status}`}>{tx.status}</span>
                </div>
                {tx.note ? <p>{tx.note}</p> : null}
              </article>
            ))}
        </div>
      </div>
    </div>
  );
}
