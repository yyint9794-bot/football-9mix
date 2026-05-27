import { useState } from 'react';
import { TERMS_FOOTER, TERMS_INTRO, TERMS_RULES } from './betting/termsContent';
import { acceptTerms } from './wallet/api';
import { useAuth } from './wallet/AuthContext';

type TermsAgreementModalProps = {
  onAgreed: () => void;
  onDisagree: () => void;
};

export function TermsAgreementModal({ onAgreed, onDisagree }: TermsAgreementModalProps) {
  const { refresh } = useAuth();
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('');

  const handleAgree = async () => {
    setBusy(true);
    setStatus('');
    try {
      await acceptTerms();
      await refresh();
      onAgreed();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="terms-overlay" role="dialog" aria-modal="true" aria-label="စည်းကမ်းသတ်မှတ်ချက်များ">
      <div className="terms-card">
        <header className="terms-head">
          <span className="terms-icon" aria-hidden="true">
            📋
          </span>
          <h2>စည်းကမ်းသတ်မှတ်ချက်များ</h2>
        </header>

        <div className="terms-scroll">
          <p className="terms-intro">{TERMS_INTRO}</p>
          {TERMS_RULES.map((rule) => (
            <section className="terms-rule" key={rule.id}>
              <h3>{rule.title}</h3>
              <ul>
                {rule.lines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </section>
          ))}
          <p className="terms-footer-text">{TERMS_FOOTER}</p>
        </div>

        {status ? <p className="account-modal-status">{status}</p> : null}

        <div className="terms-actions">
          <button type="button" className="terms-btn disagree" onClick={onDisagree} disabled={busy}>
            သဘောမတူပါ
          </button>
          <button type="button" className="terms-btn agree" onClick={() => void handleAgree()} disabled={busy}>
            သဘောတူပါသည်
          </button>
        </div>
      </div>
    </div>
  );
}
