import { useState, type FormEvent } from 'react';
import { changePassword } from './wallet/api';

type UserChangePasswordSheetProps = {
  onClose: () => void;
};

export function UserChangePasswordSheet({ onClose }: UserChangePasswordSheetProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setStatus('');

    if (!currentPassword || !newPassword) {
      setStatus('စကားဝှက် အားလုံး ထည့်ပါ');
      return;
    }
    if (newPassword.length < 4) {
      setStatus('စကားဝှက် အနည်းဆုံး ၄ လုံး');
      return;
    }
    if (newPassword !== confirmPassword) {
      setStatus('စကားဝှက် မတူညီပါ');
      return;
    }

    setSaving(true);
    try {
      await changePassword(currentPassword, newPassword);
      setStatus('စကားဝှက် ပြောင်းပြီးပါပြီ');
      setTimeout(onClose, 900);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မအောင်မြင်ပါ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="league-filter-overlay" role="presentation" onClick={onClose}>
      <div
        className="league-filter-sheet settings-sheet"
        role="dialog"
        aria-label="စကားဝှက် ပြောင်းရန်"
        onClick={(event) => event.stopPropagation()}
      >
        <header className="league-filter-head">
          <strong>စကားဝှက် ပြောင်းရန်</strong>
          <button type="button" className="league-filter-close" onClick={onClose}>
            ပိတ်မည်
          </button>
        </header>

        <form className="settings-sheet-form" onSubmit={handleSubmit}>
          <label className="search-box">
            <span>လက်ရှိ Password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </label>
          <label className="search-box">
            <span>Password အသစ်</span>
            <input
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              required
            />
          </label>
          <label className="search-box">
            <span>Password အသစ် ထပ်ထည့်ရန်</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              required
            />
          </label>
          {status ? <p className="account-modal-status">{status}</p> : null}
          <button type="submit" className="quality-watch live-watch" disabled={saving}>
            {saving ? 'သိမ်းနေပါတယ်…' : 'ပြောင်းမည်'}
          </button>
        </form>
      </div>
    </div>
  );
}
