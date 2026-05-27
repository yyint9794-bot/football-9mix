import { useEffect, useRef, useState, type FormEvent } from 'react';
import { UserBettingApp } from '../UserBettingApp';
import { getSavedLoginCredentials } from '../wallet/api';
import { useAuth } from '../wallet/AuthContext';

const CONTACT_DISPLAY = '09674646102';
const CONTACT_INTL = '959674646102';

type MobileBetScreenProps = {
  onBack: () => void;
};

export function MobileBetScreen({ onBack }: MobileBetScreenProps) {
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
      .finally(() => setAutoTrying(false));
  }, [loading, user, login]);

  const handleLogin = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');
    if (!username.trim() || !password.trim()) {
      setStatus('Username နှင့် Password ထည့်ပါ');
      return;
    }
    try {
      await login(username.trim(), password.trim());
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ဝင်ရန် မအောင်မြင်ပါ');
    }
  };

  if (loading || autoTrying) {
    return (
      <div className="m-screen m-bet-auth">
        <p className="m-hint">9Mix ဖွင့်နေပါတယ်…</p>
      </div>
    );
  }

  if (user) {
    return (
      <div className="m-bet-embed">
        <UserBettingApp layout="page" onClose={onBack} />
      </div>
    );
  }

  return (
    <div className="m-screen m-bet-auth">
      <button type="button" className="m-icon-btn m-auth-back" onClick={onBack}>
        ←
      </button>
      <div className="m-auth-card">
        <span className="m-auth-badge">9Mix</span>
        <h2>လောင်းမှု ဝင်ရန်</h2>
        <p className="m-auth-contact">
          Viber / Telegram — <a href={`viber://chat?number=${CONTACT_INTL}`}>{CONTACT_DISPLAY}</a>
        </p>
        <form onSubmit={handleLogin}>
          <label>
            <span>Username</span>
            <input value={username} onChange={(e) => setUsername(e.target.value)} required />
          </label>
          <label>
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {status ? <p className="m-error">{status}</p> : null}
          <button type="submit" className="m-btn m-btn-primary m-btn-block">
            ဝင်မည်
          </button>
        </form>
      </div>
    </div>
  );
}
