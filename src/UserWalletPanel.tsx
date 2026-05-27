import { useEffect, useState, type FormEvent } from 'react';
import {
  fetchMyTransactions,
  formatMmk,
  requestTransaction,
} from './wallet/api';
import { useAuth } from './wallet/AuthContext';
import type { WalletTransaction } from './wallet/types';

type UserWalletPanelProps = {
  mode?: 'deposit' | 'withdraw' | 'both';
};

export function UserWalletPanel({ mode = 'both' }: UserWalletPanelProps) {
  const { user, logout, refresh } = useAuth();
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [requestType, setRequestType] = useState<'deposit' | 'withdraw'>(
    mode === 'withdraw' ? 'withdraw' : 'deposit',
  );
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  const loadTransactions = async () => {
    const result = await fetchMyTransactions();
    setTransactions(result.transactions);
  };

  useEffect(() => {
    void loadTransactions().finally(() => setLoading(false));
  }, []);

  if (!user) {
    return null;
  }

  const handleRequest = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    try {
      await requestTransaction(requestType, Number(amount), note);
      setAmount('');
      setNote('');
      setStatus(requestType === 'deposit' ? 'ငွေသွင်း တောင်းဆိုပြီးပါပြီ' : 'ငွေထုတ် တောင်းဆိုပြီးပါပြီ');
      await Promise.all([loadTransactions(), refresh()]);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  return (
    <div className="wallet-panel">
      <div className="wallet-balance-card">
        <span>လက်ကျန်ငွေ</span>
        <strong>{formatMmk(user.balance)}</strong>
        <small>{user.displayName} (@{user.username})</small>
      </div>

      <form className="wallet-request-form" onSubmit={handleRequest}>
        {mode === 'both' ? (
          <div className="wallet-request-tabs">
            <button
              type="button"
              className={requestType === 'deposit' ? 'active' : ''}
              onClick={() => setRequestType('deposit')}
            >
              ငွေသွင်း
            </button>
            <button
              type="button"
              className={requestType === 'withdraw' ? 'active' : ''}
              onClick={() => setRequestType('withdraw')}
            >
              ငွေထုတ်
            </button>
          </div>
        ) : null}
        <label className="search-box">
          <span>ပမာဏ (MMK)</span>
          <input
            type="number"
            min="1"
            step="1"
            placeholder="ဥပမာ 10000"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            required
          />
        </label>
        <label className="search-box">
          <span>မှတ်ချက်</span>
          <input
            type="text"
            placeholder="မှတ်ချက် (မထည့်လည်းရသည်)"
            value={note}
            onChange={(event) => setNote(event.target.value)}
          />
        </label>
        <button type="submit" className="quality-watch live-watch">
          {requestType === 'deposit' ? 'ငွေသွင်း တောင်းဆိုမည်' : 'ငွေထုတ် တောင်းဆိုမည်'}
        </button>
        {status ? <p className="account-modal-status">{status}</p> : null}
      </form>

      <div className="wallet-history">
        <strong>လုပ်ဆောင်ချက် မှတ်တမ်း</strong>
        {loading ? <p className="odds-hint">ဖတ်နေပါတယ်…</p> : null}
        {!loading && !transactions.length ? <p className="odds-hint">မှတ်တမ်း မရှိသေးပါ</p> : null}
        <div className="wallet-tx-list">
          {transactions.map((tx) => (
            <article className="wallet-tx-item" key={tx.id}>
              <div>
                <b>{tx.type === 'deposit' ? 'ငွေသွင်း' : 'ငွေထုတ်'}</b>
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

      {mode === 'both' ? (
        <button type="button" className="ghost-button wallet-logout" onClick={() => void logout()}>
          ထွက်မည်
        </button>
      ) : null}
    </div>
  );
}
