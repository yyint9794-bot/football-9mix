import { useEffect, useRef, useState, type FormEvent } from 'react';
import { UserBettingApp } from './UserBettingApp';
import { openHomePage } from './navigation';
import { getSavedLoginCredentials } from './wallet/api';
import { useAuth } from './wallet/AuthContext';

const CONTACT_DISPLAY = '09674646102';
const CONTACT_INTL = '959674646102';

export function BetWebPage() {
  const { user, login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [autoTrying, setAutoTrying] = useState(false);
  const autoLoginStarted = useRef(false);

  useEffect(() => {
    if (loading || user) {
      return;
    }

    if (autoLoginStarted.current) {
      return;
    }

    const saved = getSavedLoginCredentials();
    if (!saved) {
      return;
    }

    autoLoginStarted.current = true;
    setAutoTrying(true);
    setUsername(saved.username);
    setPassword(saved.password);

    void login(saved.username, saved.password)
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : 'ဝင်ရန် မအောင်မြင်ပါ');
      })
      .finally(() => {
        setAutoTrying(false);
      });
  }, [loading, user, login]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    if (!username.trim() || !password.trim()) {
      setStatus('Username နှင့် Password ထည့်ပါ');
      return;
    }
    try {
      await login(username.trim(), password);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ဝင်ရန် မအောင်မြင်ပါ');
    }
  };

  if (loading || autoTrying) {
    return (
      <div className="standalone-page">
        <p className="standalone-loading">9Mix လောင်းမှု ဖွင့်နေပါတယ်…</p>
        {autoTrying ? (
          <button
            type="button"
            className="ghost-button standalone-skip-auto"
            onClick={() => {
              setAutoTrying(false);
            }}
          >
            ဝင်ရန် စာမျက်နှာ ဖွင့်မည်
          </button>
        ) : null}
      </div>
    );
  }

  if (user) {
    return <UserBettingApp layout="page" onClose={openHomePage} />;
  }

  return (
    <div className="standalone-page standalone-auth">
      <div className="standalone-auth-card">
        <div className="standalone-auth-head">
          <span className="account-modal-badge">9Mix</span>
          <div>
            <strong>ဘောလုံးလောင်းမှု</strong>
            <small>ပထမဆုံး တစ်ကြိမ် username / password ထည့်ပါ</small>
          </div>
        </div>

        <p className="account-modal-contact">
          Viber / Telegram —{' '}
          <a href={`viber://chat?number=${CONTACT_INTL}`}>{CONTACT_DISPLAY}</a>
        </p>

        <form className="account-modal-form" onSubmit={handleLogin}>
          <label className="search-box">
            <span>Username</span>
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
            ဝင်မည်
          </button>
        </form>

        <button type="button" className="ghost-button standalone-back" onClick={openHomePage}>
          ပင်မစာမျက်နှာ
        </button>
      </div>
    </div>
  );
}
