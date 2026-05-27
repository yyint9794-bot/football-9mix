import type { WalletUser } from './wallet/types';

type UserBetSidebarProps = {
  open: boolean;
  user: WalletUser;
  onClose: () => void;
  onNavigate: (screen: 'hub' | 'open-bets' | 'results' | 'deposit' | 'withdraw') => void;
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

export function UserBetSidebar({ open, user, onClose, onNavigate, onLogout }: UserBetSidebarProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="bet-sidebar-layer" role="presentation" onClick={onClose}>
      <aside className="bet-sidebar" onClick={(event) => event.stopPropagation()}>
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
        </header>

        <nav className="bet-sidebar-nav">
          <button type="button" onClick={() => onNavigate('open-bets')}>
            <span>📋</span>
            <b>လောင်းထားသောပွဲများ</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
          <button type="button" onClick={() => onNavigate('results')}>
            <span>🏁</span>
            <b>ပွဲပြီးရလဒ်</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
          <button type="button" onClick={() => onNavigate('deposit')}>
            <span>💵</span>
            <b>ငွေသွင်း</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
          <button type="button" onClick={() => onNavigate('withdraw')}>
            <span>💸</span>
            <b>ငွေထုတ်</b>
            <span className="bet-sidebar-arrow" aria-hidden>
              ›
            </span>
          </button>
        </nav>

        <footer className="bet-sidebar-foot">
          <small>9Mix Betting v1</small>
          <button type="button" className="bet-sidebar-logout" onClick={() => void onLogout()}>
            ထွက်မည်
          </button>
        </footer>
      </aside>
    </div>
  );
}
