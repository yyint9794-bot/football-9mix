import { createPortal } from 'react-dom';
import type { WalletUser } from './wallet/types';

const TELEGRAM_URL = import.meta.env.VITE_TELEGRAM_URL ?? 'https://t.me/livefootball902';

type UserBetSidebarProps = {
  open: boolean;
  user: WalletUser;
  onClose: () => void;
  onChangePassword: () => void;
  onChooseLanguage: () => void;
  onLogout: () => void;
};

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

export function UserBetSidebar({
  open,
  user,
  onClose,
  onChangePassword,
  onChooseLanguage,
  onLogout,
}: UserBetSidebarProps) {
  if (!open || typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <div className="bet-sidebar-layer" role="presentation" onClick={onClose}>
      <aside
        className="bet-sidebar"
        role="dialog"
        aria-label="Menu"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="bet-sidebar-head">
          <div className="bet-sidebar-profile">
            <span className="bet-sidebar-avatar" aria-hidden>
              {getInitials(user.displayName || user.username)}
            </span>
            <div>
              <strong>{user.displayName}</strong>
              <small>Username: {user.username}</small>
            </div>
          </div>
          <button type="button" className="bet-sidebar-edit" aria-label="ပရိုဖိုင်">
            ✎
          </button>
        </header>

        <nav className="bet-sidebar-nav">
          <button type="button" onClick={onChangePassword}>
            <span className="bet-sidebar-icon lock" aria-hidden />
            <b>စကားဝှက် ပြောင်းရန်</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
          <button type="button" onClick={onChooseLanguage}>
            <span className="bet-sidebar-icon globe" aria-hidden />
            <b>ဘာသာစကား ရွေးရန်</b>
            <span className="bet-sidebar-flag" aria-hidden>
              🇲🇲
            </span>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
          <a
            className="bet-sidebar-link"
            href={TELEGRAM_URL}
            target="_blank"
            rel="noreferrer"
            onClick={onClose}
          >
            <span className="bet-sidebar-icon telegram" aria-hidden />
            <b>Telegram ဆက်သွယ်ရန်</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </a>
        </nav>

        <footer className="bet-sidebar-foot">
          <small>Version 1.0.0</small>
          <button type="button" className="bet-sidebar-logout" onClick={() => void onLogout()}>
            <span className="bet-sidebar-icon logout" aria-hidden />
            ထွက်မည်
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
