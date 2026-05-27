import { useEffect, useState, type CSSProperties, type FormEvent } from 'react';
import { PaymentTransferScene } from './PaymentTransferScene';
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

const METHOD_LOGOS: Record<PaymentMethod, string> = {
  kbz: '/images/payments/kbz-pay.png',
  wave: '/images/payments/wave-pay.png',
};

function methodLabel(method: PaymentMethod, config: PaymentConfig | null) {
  if (!config) {
    return method === 'kbz' ? 'KBZ Pay' : 'Wave Pay';
  }
  return method === 'kbz' ? config.kbz.label : config.wave.label;
}

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
    setStatus('');
    if (mode === 'deposit') {
      setStep('details');
      return;
    }
    setStep('form');
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

  const goBack = () => {
    if (step === 'form') {
      setStep(mode === 'deposit' ? 'details' : 'method');
      return;
    }
    if (step === 'details') {
      setStep('method');
    }
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

  const filteredTx = transactions.filter((tx) => tx.type === mode).slice(0, 6);

  return (
    <div className="wallet-panel payment-panel">
      <div className="payment-panel-body">
        <div className="wallet-balance-card payment-balance-card">
          <span>လက်ကျန်ငွေ</span>
          <strong>{formatMmk(user.balance)}</strong>
          <small>{user.displayName}</small>
        </div>

        {loading ? <p className="payment-loading">ဖတ်နေပါတယ်…</p> : null}

        {step === 'method' ? (
          <section className="payment-step payment-step-fill">
            <h3>{mode === 'deposit' ? 'ငွေသွင်း နည်းလမ်း ရွေးပါ' : 'ငွေထုတ် နည်းလမ်း ရွေးပါ'}</h3>
            <div className="payment-method-grid">
              {(['kbz', 'wave'] as PaymentMethod[]).map((key) => (
                <button key={key} type="button" className="payment-method-card" onClick={() => selectMethod(key)}>
                  <img src={METHOD_LOGOS[key]} alt={methodLabel(key, config)} />
                  <b>{methodLabel(key, config)}</b>
                </button>
              ))}
            </div>
          </section>
        ) : null}

        {step === 'details' && method && mode === 'deposit' ? (
          <section className="payment-step payment-step-with-scene">
            <div className="payment-step-top">
              <button type="button" className="payment-back" onClick={goBack}>
                ← နည်းလမ်း ပြန်ရွေးမည်
              </button>
              <div className="payment-admin-card">
                <img src={METHOD_LOGOS[method]} alt="" className="payment-admin-logo" />
                <div>
                  <span>{methodLabel(method, config)}</span>
                  <strong>{activeNumber || 'နံပါတ် မသတ်မှတ်ရသေးပါ'}</strong>
                </div>
                <button type="button" className="payment-copy-btn" onClick={() => void handleCopyNumber()}>
                  ကူးမည်
                </button>
              </div>
              <p className="payment-hint">
                အထက်ပါနံပါတ်သို့ ငွေလွဲပြီးပါက အောက်ပါ ခလုတ်နှိပ်ပြီး အချက်အလက် ဖြည့်ပါ
              </p>
              <div
                className="payment-action-row"
                style={
                  { '--pay-accent': method === 'kbz' ? '#1d4ed8' : '#7c3aed' } as CSSProperties
                }
              >
                <button type="button" className="payment-transfer-btn" onClick={() => setStep('form')}>
                  ငွေလွဲမည်
                </button>
              </div>
            </div>
            <PaymentTransferScene mode="deposit" method={method} />
          </section>
        ) : null}

        {step === 'form' && method ? (
          <form className="payment-form payment-step-with-scene" onSubmit={handleSubmit}>
            <button type="button" className="payment-back" onClick={goBack}>
              ← နောက်သို့
            </button>
            <p className="payment-selected">
              {methodLabel(method, config)} · {mode === 'deposit' ? 'ငွေသွင်း' : 'ငွေထုတ်'}
            </p>

            {mode === 'withdraw' ? (
              <p className="payment-hint payment-hint-light">
                {methodLabel(method, config)} သို့ ထုတ်ယူရန် အောက်ပါအချက်အလက် ဖြည့်ပါ
              </p>
            ) : (
              <p className="payment-hint payment-hint-light">လွဲပြီးပါက အောက်တွင် ဖြည့်ပြီး ပို့ပါ</p>
            )}

            <label className="search-box payment-field">
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
            <label className="search-box payment-field">
              <span>ဖုန်းနံပါတ်</span>
              <input
                type="tel"
                required
                placeholder="09xxxxxxxxx"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
              />
            </label>
            <label className="search-box payment-field">
              <span>နာမည်</span>
              <input
                type="text"
                required
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            </label>
            {mode === 'deposit' ? (
              <label className="search-box payment-field">
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

            <div className="payment-action-row">
              <button type="submit" className="payment-transfer-btn payment-submit-btn" disabled={submitting}>
                {submitting ? 'ပို့နေပါတယ်…' : mode === 'deposit' ? 'ငွေသွင်း တောင်းဆိုမည်' : 'ငွေထုတ် တောင်းဆိုမည်'}
              </button>
            </div>
            <PaymentTransferScene mode={mode} method={method} />
          </form>
        ) : null}

        {status ? <p className="account-modal-status payment-status">{status}</p> : null}
      </div>

      <div className="wallet-history payment-history">
        <strong>လုပ်ဆောင်ချက် မှတ်တမ်း</strong>
        {!filteredTx.length ? <p className="payment-history-empty">မှတ်တမ်း မရှိသေးပါ</p> : null}
        <div className="wallet-tx-list">
          {filteredTx.map((tx) => (
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
