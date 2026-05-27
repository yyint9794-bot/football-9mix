import { useState, type FormEvent } from 'react';
import { AdminPanel } from './AdminPanel';
import { openHomePage } from './navigation';
import { useAuth } from './wallet/AuthContext';

export function AdminWebPage() {
  const { user, login, loading, logout } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    try {
      const nextUser = await login(username.trim(), password);
      if (nextUser.role !== 'admin') {
        await logout();
        setStatus('Admin account ဖြင့်သာ ဝင်နိုင်ပါသည်');
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ဝင်ရန် မအောင်မြင်ပါ');
    }
  };

  if (loading) {
    return (
      <div className="standalone-page">
        <p className="standalone-loading">Admin panel ဖွင့်နေပါတယ်…</p>
      </div>
    );
  }

  if (user?.role === 'admin') {
    return <AdminPanel layout="page" onClose={openHomePage} />;
  }

  return (
    <div className="standalone-page standalone-auth">
      <div className="standalone-auth-card">
        <div className="standalone-auth-head">
          <span className="account-modal-badge">9Mix</span>
          <div>
            <strong>Admin Panel</strong>
            <small>ballpwal.org/admin — ငွေသွင်း/ထုတ်၊ user စီမံခန့်ခွဲမှု</small>
          </div>
        </div>

        <form className="account-modal-form" onSubmit={handleLogin}>
          <label className="search-box">
            <span>Admin Username</span>
            <input value={username} onChange={(event) => setUsername(event.target.value)} required />
          </label>
          <label className="search-box">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {status ? <p className="account-modal-status">{status}</p> : null}
          <button type="submit" className="quality-watch live-watch">
            Admin ဝင်ရန်
          </button>
        </form>

        <button type="button" className="ghost-button standalone-back" onClick={openHomePage}>
          ပင်မစာမျက်နှာ
        </button>
      </div>
    </div>
  );
}
