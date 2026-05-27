import { useState, type FormEvent } from 'react';
import { UserBettingApp } from './UserBettingApp';
import { useAuth } from './wallet/AuthContext';

const CONTACT_DISPLAY = '09674646102';
const CONTACT_INTL = '959674646102';

type AccountLoginModalProps = {
  onClose: () => void;
};

export function AccountLoginModal({ onClose }: AccountLoginModalProps) {
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');

    if (!username.trim() || !password.trim()) {
      setStatus('Username နှင့် Password ထည့်ပါ');
      return;
    }

    try {
      await login(username.trim(), password);
      setStatus('');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ဝင်ရန် မအောင်မြင်ပါ');
    }
  };

  if (user) {
    return <UserBettingApp onClose={onClose} />;
  }

  return (
    <div className="video-ad-overlay" role="dialog" aria-modal="true" aria-label="9Mix အကောင့်">
      <div className="account-modal-card">
        <div className="video-ad-head">
          <span>9Mix ဝင်ရန်</span>
          <button type="button" className="live-close-btn" onClick={onClose}>
            ပိတ်မည်
          </button>
        </div>

        <>
            <div className="account-modal-brand">
              <span className="account-modal-badge">9Mix</span>
              <div>
                <strong>အကောင့်ဝင်ရန်</strong>
                <small>Admin ဖွင့်ပေးထားသော account ဖြင့်ဝင်ပါ</small>
              </div>
            </div>

            <p className="account-modal-contact">
              Viber / Telegram —{' '}
              <a href={`viber://chat?number=${CONTACT_INTL}`}>{CONTACT_DISPLAY}</a>
            </p>

            <form className="account-modal-form" onSubmit={handleSubmit}>
              <label className="search-box">
                <span>Username</span>
                <input
                  type="text"
                  name="username"
                  placeholder="သင့် username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  disabled={loading}
                />
              </label>

              <label className="search-box">
                <span>Password</span>
                <input
                  type="password"
                  name="password"
                  placeholder="သင့် password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={loading}
                />
              </label>

              <button type="submit" className="quality-watch live-watch account-modal-submit" disabled={loading}>
                ဝင်မည်
              </button>

              {status ? <p className="account-modal-status">{status}</p> : null}
            </form>
        </>
      </div>
    </div>
  );
}
