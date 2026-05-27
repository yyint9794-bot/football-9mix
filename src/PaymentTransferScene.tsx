import type { CSSProperties } from 'react';
import type { PaymentMethod } from './wallet/api';

type PaymentTransferSceneProps = {
  mode: 'deposit' | 'withdraw';
  method?: PaymentMethod | null;
};

const METHOD_ACCENT: Record<PaymentMethod, string> = {
  kbz: '#1d4ed8',
  wave: '#7c3aed',
};

export function PaymentTransferScene({ mode, method }: PaymentTransferSceneProps) {
  const accent = method ? METHOD_ACCENT[method] : '#0fa86b';
  const caption =
    mode === 'deposit'
      ? 'လုံခြုံစွာ ငွေလွဲပြီး အတည်ပြုချက် ပို့ပါ'
      : 'ထုတ်ယူမှု Admin စစ်ဆေးပြီး လုပ်ဆောင်ပါမည်';

  return (
    <div
      className={`payment-transfer-scene${mode === 'withdraw' ? ' is-withdraw' : ''}`}
      style={{ '--pay-accent': accent } as CSSProperties}
      aria-hidden
    >
      <div className="payment-scene-bg">
        <span className="payment-scene-ring ring-a" />
        <span className="payment-scene-ring ring-b" />
        <span className="payment-scene-ring ring-c" />
      </div>

      <div className="payment-scene-flow">
        <div className="payment-scene-node from">
          <span className="payment-scene-icon">📱</span>
          <small>သင်</small>
        </div>

        <div className="payment-scene-track">
          <span className="payment-scene-line" />
          <span className="payment-scene-packet packet-1">💵</span>
          <span className="payment-scene-packet packet-2">💴</span>
          <span className="payment-scene-packet packet-3">💶</span>
          <span className="payment-scene-arrow">➜</span>
        </div>

        <div className="payment-scene-node to">
          <span className="payment-scene-icon">{mode === 'deposit' ? '🏦' : '💳'}</span>
          <small>{mode === 'deposit' ? 'Admin' : 'Wallet'}</small>
        </div>
      </div>

      <div className="payment-scene-floats">
        <span className="payment-float-chip chip-1">MMK</span>
        <span className="payment-float-chip chip-2">✓</span>
        <span className="payment-float-chip chip-3">24/7</span>
        <span className="payment-float-chip chip-4">⚡</span>
      </div>

      <p className="payment-scene-caption">{caption}</p>
      <div className="payment-scene-scan" />
    </div>
  );
}
