import { formatMmk } from '../wallet/api';
import { useAuth } from '../wallet/AuthContext';
import { openHomePage } from '../navigation';

export function MobileWalletScreen() {
  const { user, logout } = useAuth();

  if (!user) {
    return (
      <div className="m-screen m-wallet-screen">
        <p className="m-screen-lead">အကောင့် ဝင်ပြီး လက်ကျန်ငွေ ကြည့်ပါ</p>
        <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={() => (window.location.href = '/app/bet')}>
          9Mix ဝင်မည်
        </button>
      </div>
    );
  }

  return (
    <div className="m-screen m-wallet-screen">
      <div className="m-wallet-card">
        <span>လက်ကျန်ငွေ</span>
        <strong>{formatMmk(user.balance)}</strong>
        <small>{user.displayName}</small>
      </div>
      <div className="m-wallet-actions">
        <a className="m-btn m-btn-primary m-btn-block" href="/app/bet">
          ငွေသွင်း / လောင်းမှု
        </a>
        <button type="button" className="m-btn m-btn-ghost m-btn-block" onClick={() => void logout()}>
          ထွက်မည်
        </button>
        <button type="button" className="m-btn m-btn-ghost m-btn-block" onClick={openHomePage}>
          Web ပင်မ
        </button>
      </div>
    </div>
  );
}
