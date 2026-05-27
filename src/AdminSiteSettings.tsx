import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { readImageFileAsDataUrl } from './adminImageUpload';
import { notifySiteSettingsUpdated, type SiteSettings } from './siteSettings';
import { adminFetchSiteSettings, adminUpdateSiteSettings } from './wallet/api';

const emptySettings = (): SiteSettings => ({
  payment: {
    kbz: { number: '', label: 'KBZ Pay' },
    wave: { number: '', label: 'Wave Pay' },
  },
  announcements: {
    web: { text: '', enabled: false },
    bet: { text: '', enabled: false },
  },
  banners: {
    web: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    user: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
  },
});

export function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);
  const userBannerInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const result = await adminFetchSiteSettings();
      setSettings(result.settings);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ဆက်တင်များ မဖတ်နိုင်ပါ');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSave = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setStatus('');
    try {
      const result = await adminUpdateSiteSettings(settings);
      setSettings(result.settings);
      notifySiteSettingsUpdated();
      setStatus('သိမ်းပြီးပါပြီ');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မသိမ်းနိုင်ပါ');
    } finally {
      setSaving(false);
    }
  };

  const handleUserBannerFile = async (file: File | null) => {
    if (!file) {
      return;
    }
    setStatus('');
    try {
      const dataUrl = await readImageFileAsDataUrl(file);
      setSettings((current) => ({
        ...current,
        banners: {
          ...current.banners,
          user: { ...current.banners.user, imageUrl: dataUrl, enabled: true },
        },
      }));
      setStatus('ပုံ ရွေးပြီးပါပြီ — သိမ်းမည် နှိပ်ပါ');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'ပုံ မတင်နိုင်ပါ');
    }
  };

  return (
    <div className="admin-section admin-site-settings">
      <form className="admin-form-card" onSubmit={handleSave}>
        <strong>ငွေလွဲ (နာမည် + နံပါတ်)</strong>
        <div className="admin-form-grid">
          <label className="search-box">
            <span>KBZ / KPay ပြသမည့်နာမည်</span>
            <input
              value={settings.payment.kbz.label}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  payment: {
                    ...current.payment,
                    kbz: { ...current.payment.kbz, label: event.target.value },
                  },
                }))
              }
            />
          </label>
          <label className="search-box">
            <span>KBZ Pay နံပါတ်</span>
            <input
              value={settings.payment.kbz.number}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  payment: {
                    ...current.payment,
                    kbz: { ...current.payment.kbz, number: event.target.value },
                  },
                }))
              }
            />
          </label>
          <label className="search-box">
            <span>Wave Pay ပြသမည့်နာမည်</span>
            <input
              value={settings.payment.wave.label}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  payment: {
                    ...current.payment,
                    wave: { ...current.payment.wave, label: event.target.value },
                  },
                }))
              }
            />
          </label>
          <label className="search-box">
            <span>Wave Pay နံပါတ်</span>
            <input
              value={settings.payment.wave.number}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  payment: {
                    ...current.payment,
                    wave: { ...current.payment.wave, number: event.target.value },
                  },
                }))
              }
            />
          </label>
        </div>

        <strong className="admin-settings-subhead">ကြော်ငြာစာ — Home Web (မဝင်ခင်)</strong>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={settings.announcements.web.enabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcements: {
                  ...current.announcements,
                  web: { ...current.announcements.web, enabled: event.target.checked },
                },
              }))
            }
          />
          <span>ပင်မဝဘ်ဆိုက် တွင် ပြမည်</span>
        </label>
        <label className="search-box">
          <span>စာသား</span>
          <textarea
            rows={2}
            value={settings.announcements.web.text}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcements: {
                  ...current.announcements,
                  web: { ...current.announcements.web, text: event.target.value },
                },
              }))
            }
          />
        </label>

        <strong className="admin-settings-subhead">ကြော်ငြာစာ — User ဝင်ပြီးနောက်</strong>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={settings.announcements.bet.enabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcements: {
                  ...current.announcements,
                  bet: { ...current.announcements.bet, enabled: event.target.checked },
                },
              }))
            }
          />
          <span>လောင်းကွင်း တွင် ပြမည်</span>
        </label>
        <label className="search-box">
          <span>စာသား</span>
          <textarea
            rows={2}
            value={settings.announcements.bet.text}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcements: {
                  ...current.announcements,
                  bet: { ...current.announcements.bet, text: event.target.value },
                },
              }))
            }
          />
        </label>

        <strong className="admin-settings-subhead">Banner — User ဝင်ပြီးနောက် အပေါ်ဆုံး</strong>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={settings.banners.user.enabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                banners: {
                  ...current.banners,
                  user: { ...current.banners.user, enabled: event.target.checked },
                },
              }))
            }
          />
          <span>Banner ပြမည်</span>
        </label>
        <div className="admin-banner-upload-row">
          <input
            ref={userBannerInputRef}
            type="file"
            accept="image/*"
            className="admin-file-input"
            onChange={(event) => void handleUserBannerFile(event.target.files?.[0] ?? null)}
          />
          <button
            type="button"
            className="admin-secondary-btn"
            onClick={() => userBannerInputRef.current?.click()}
          >
            ဖုန်းမှ ပုံရွေးမည်
          </button>
          <span className="admin-upload-hint">Gallery / Camera — သိမ်းမည် နှိပ်ရန် လိုသည်</span>
        </div>
        <label className="search-box">
          <span>လင့်ခ် (မထည့်လည်း ရ)</span>
          <input
            value={settings.banners.user.linkUrl}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                banners: {
                  ...current.banners,
                  user: { ...current.banners.user, linkUrl: event.target.value },
                },
              }))
            }
          />
        </label>
        {settings.banners.user.imageUrl ? (
          <img src={settings.banners.user.imageUrl} alt="" className="admin-banner-preview" />
        ) : null}

        <button type="submit" className="admin-primary-btn" disabled={saving}>
          {saving ? 'သိမ်းနေပါတယ်…' : 'ဆက်တင်များ သိမ်းမည်'}
        </button>
      </form>
      {status ? <p className="account-modal-status admin-status">{status}</p> : null}
    </div>
  );
}
