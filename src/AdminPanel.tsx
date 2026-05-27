import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { AdminSiteSettings } from './AdminSiteSettings';
import {
  adminCreateUser,
  adminFetchTransactions,
  adminFetchUsers,
  adminPostTransaction,
  adminReviewTransaction,
  adminUpdateUser,
  formatMmk,
} from './wallet/api';
import type { WalletTransaction, WalletUser } from './wallet/types';

type AdminPanelProps = {
  onClose: () => void;
  layout?: 'modal' | 'page';
};

export function AdminPanel({ onClose, layout = 'modal' }: AdminPanelProps) {
  const [tab, setTab] = useState<'users' | 'transactions' | 'settings'>('users');
  const [users, setUsers] = useState<WalletUser[]>([]);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [status, setStatus] = useState('');
  const [txFilter, setTxFilter] = useState<'all' | 'pending'>('pending');

  const [newUser, setNewUser] = useState({
    username: '',
    password: '',
    displayName: '',
    balance: '0',
  });

  const [quickTx, setQuickTx] = useState({
    userId: '',
    type: 'deposit' as 'deposit' | 'withdraw',
    amount: '',
    note: '',
  });

  const loadAll = useCallback(async () => {
    const [userResult, txResult] = await Promise.all([
      adminFetchUsers(),
      adminFetchTransactions(txFilter === 'pending' ? { status: 'pending' } : undefined),
    ]);
    setUsers(userResult.users);
    setTransactions(txResult.transactions);
  }, [txFilter]);

  useEffect(() => {
    void loadAll().catch((error) => {
      setStatus(error instanceof Error ? error.message : 'မဖတ်နိုင်ပါ');
    });
  }, [loadAll]);

  const handleCreateUser = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    try {
      await adminCreateUser({
        username: newUser.username,
        password: newUser.password,
        displayName: newUser.displayName || newUser.username,
        balance: Number(newUser.balance || 0),
      });
      setNewUser({ username: '', password: '', displayName: '', balance: '0' });
      setStatus('အကောင့် ဖွင့်ပြီးပါပြီ');
      await loadAll();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const handleQuickTx = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    try {
      await adminPostTransaction({
        userId: quickTx.userId,
        type: quickTx.type,
        amount: Number(quickTx.amount),
        note: quickTx.note,
      });
      setQuickTx((current) => ({ ...current, amount: '', note: '' }));
      setStatus('ငွေလုပ်ဆောင်ချက် သိမ်းပြီးပါပြီ');
      await loadAll();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const handleReview = async (txId: string, decision: 'approve' | 'reject') => {
    setStatus('');
    try {
      await adminReviewTransaction(txId, decision);
      setStatus(decision === 'approve' ? 'အတည်ပြုပြီးပါပြီ' : 'ငြင်းပယ်ပြီးပါပြီ');
      await loadAll();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const handleToggleActive = async (user: WalletUser) => {
    try {
      await adminUpdateUser(user.id, { active: !user.active });
      await loadAll();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const handleResetPassword = async (user: WalletUser) => {
    const password = window.prompt(`${user.username} အတွက် password အသစ်`);
    if (!password?.trim()) {
      return;
    }
    try {
      await adminUpdateUser(user.id, { password });
      setStatus('Password ပြန်သတ်မှတ်ပြီးပါပြီ');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const handleSetBalance = async (user: WalletUser) => {
    const value = window.prompt(`${user.username} လက်ကျန်အသစ် (MMK)`, String(user.balance));
    if (value == null) {
      return;
    }
    try {
      await adminUpdateUser(user.id, { balance: Number(value), balanceNote: 'Admin လက်ကျန်ပြင်ဆင်' });
      await loadAll();
      setStatus('လက်ကျန်ပြင်ပြီးပါပြီ');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    }
  };

  const shellClass =
    layout === 'page' ? 'admin-page-shell' : 'video-ad-overlay admin-overlay';
  const cardClass = layout === 'page' ? 'admin-panel-card admin-panel-page' : 'admin-panel-card';

  return (
    <div
      className={shellClass}
      role={layout === 'page' ? undefined : 'dialog'}
      aria-modal={layout === 'page' ? undefined : true}
      aria-label="Admin panel"
    >
      <div className={cardClass}>
        <div className="video-ad-head">
          <span>9Mix Admin</span>
          <button type="button" className="live-close-btn" onClick={onClose}>
            {layout === 'page' ? 'ပင်မသို့' : 'ပိတ်မည်'}
          </button>
        </div>

        <div className="admin-tabs">
          <button type="button" className={tab === 'users' ? 'active' : ''} onClick={() => setTab('users')}>
            User များ
          </button>
          <button
            type="button"
            className={tab === 'transactions' ? 'active' : ''}
            onClick={() => setTab('transactions')}
          >
            ငွေသွင်း / ငွေထုတ်
          </button>
          <button
            type="button"
            className={tab === 'settings' ? 'active' : ''}
            onClick={() => setTab('settings')}
          >
            ဆက်တင် / ကြော်ငြာ
          </button>
        </div>

        {status ? <p className="account-modal-status admin-status">{status}</p> : null}

        {tab === 'settings' ? (
          <AdminSiteSettings />
        ) : tab === 'users' ? (
          <div className="admin-section">
            <form className="admin-form-card" onSubmit={handleCreateUser}>
              <strong>အကောင့်အသစ် ဖွင့်ပေးရန်</strong>
              <div className="admin-form-grid">
                <label className="search-box">
                  <span>Username</span>
                  <input
                    value={newUser.username}
                    onChange={(event) => setNewUser((s) => ({ ...s, username: event.target.value }))}
                    required
                  />
                </label>
                <label className="search-box">
                  <span>Password</span>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(event) => setNewUser((s) => ({ ...s, password: event.target.value }))}
                    required
                  />
                </label>
                <label className="search-box">
                  <span>နာမည်</span>
                  <input
                    value={newUser.displayName}
                    onChange={(event) => setNewUser((s) => ({ ...s, displayName: event.target.value }))}
                  />
                </label>
                <label className="search-box">
                  <span>ပထမသွင်း (MMK)</span>
                  <input
                    type="number"
                    min="0"
                    value={newUser.balance}
                    onChange={(event) => setNewUser((s) => ({ ...s, balance: event.target.value }))}
                  />
                </label>
              </div>
              <button type="submit" className="quality-watch live-watch">
                အကောင့်ဖွင့်ပေးမည်
              </button>
            </form>

            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>လက်ကျန်</th>
                    <th>အခြေအနေ</th>
                    <th>လုပ်ဆောင်ချက်</th>
                  </tr>
                </thead>
                <tbody>
                  {users
                    .filter((user) => user.role !== 'admin')
                    .map((user) => (
                      <tr key={user.id}>
                        <td>
                          <b>{user.displayName}</b>
                          <small>@{user.username}</small>
                        </td>
                        <td>{formatMmk(user.balance)}</td>
                        <td>
                          <span className={user.active ? 'wallet-status completed' : 'wallet-status rejected'}>
                            {user.active ? 'အသက်ဝင်' : 'ပိတ်'}
                          </span>
                        </td>
                        <td className="admin-actions">
                          <button type="button" onClick={() => void handleSetBalance(user)}>
                            လက်ကျန်
                          </button>
                          <button type="button" onClick={() => void handleResetPassword(user)}>
                            Password
                          </button>
                          <button type="button" onClick={() => void handleToggleActive(user)}>
                            {user.active ? 'ပိတ်မည်' : 'ဖွင့်မည်'}
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="admin-section">
            <form className="admin-form-card" onSubmit={handleQuickTx}>
              <strong>Admin ငွေသွင်း / ငွေထုတ် (ချက်ချင်း)</strong>
              <div className="admin-form-grid">
                <label className="search-box">
                  <span>User</span>
                  <select
                    value={quickTx.userId}
                    onChange={(event) => setQuickTx((s) => ({ ...s, userId: event.target.value }))}
                    required
                  >
                    <option value="">ရွေးပါ</option>
                    {users
                      .filter((user) => user.role !== 'admin')
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.displayName} ({formatMmk(user.balance)})
                        </option>
                      ))}
                  </select>
                </label>
                <label className="search-box">
                  <span>အမျိုးအစား</span>
                  <select
                    value={quickTx.type}
                    onChange={(event) =>
                      setQuickTx((s) => ({ ...s, type: event.target.value as 'deposit' | 'withdraw' }))
                    }
                  >
                    <option value="deposit">ငွေသွင်း</option>
                    <option value="withdraw">ငွေထုတ်</option>
                  </select>
                </label>
                <label className="search-box">
                  <span>ပမာဏ</span>
                  <input
                    type="number"
                    min="1"
                    value={quickTx.amount}
                    onChange={(event) => setQuickTx((s) => ({ ...s, amount: event.target.value }))}
                    required
                  />
                </label>
                <label className="search-box">
                  <span>မှတ်ချက်</span>
                  <input
                    value={quickTx.note}
                    onChange={(event) => setQuickTx((s) => ({ ...s, note: event.target.value }))}
                  />
                </label>
              </div>
              <button type="submit" className="quality-watch live-watch">
                သိမ်းမည်
              </button>
            </form>

            <div className="admin-filter-row">
              <button
                type="button"
                className={txFilter === 'pending' ? 'quality-chip active' : 'quality-chip'}
                onClick={() => setTxFilter('pending')}
              >
                Pending
              </button>
              <button
                type="button"
                className={txFilter === 'all' ? 'quality-chip active' : 'quality-chip'}
                onClick={() => setTxFilter('all')}
              >
                အားလုံး
              </button>
            </div>

            <div className="wallet-tx-list admin-tx-list">
              {transactions.map((tx) => (
                <article className="wallet-tx-item" key={tx.id}>
                  <div>
                    <b>
                      {tx.username} — {tx.type === 'deposit' ? 'ငွေသွင်း' : 'ငွေထုတ်'}
                    </b>
                    <small>{new Date(tx.createdAt).toLocaleString()}</small>
                  </div>
                  <div className="wallet-tx-meta">
                    <strong>{formatMmk(tx.amount)}</strong>
                    <span className={`wallet-status ${tx.status}`}>{tx.status}</span>
                  </div>
                  {tx.note ? <p>{tx.note}</p> : null}
                  {tx.status === 'pending' ? (
                    <div className="admin-actions">
                      <button type="button" onClick={() => void handleReview(tx.id, 'approve')}>
                        အတည်ပြု
                      </button>
                      <button type="button" onClick={() => void handleReview(tx.id, 'reject')}>
                        ငြင်းပယ်
                      </button>
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
