import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { adminFetchSiteSettings, adminUpdateSiteSettings } from './wallet/api';
import { notifySiteSettingsUpdated, type SiteBannerSlot, type SiteSettings } from './siteSettings';

const BANNER_SLOTS: Array<{ id: SiteBannerSlot; label: string }> = [
  { id: 'web', label: 'ပင်မဝဘ်ဆိုက်' },
  { id: 'bet', label: 'လောင်းကွင်း (ဘော်ဒီ/မောင်း)' },
  { id: 'hub', label: 'လောင်းမီနူး (Hub)' },
  { id: 'app', label: 'Mobile App' },
];

const emptySettings = (): SiteSettings => ({
  payment: {
    kbz: { number: '', label: 'KBZ Pay' },
    wave: { number: '', label: 'Wave Pay' },
  },
  announcement: { text: '', enabled: false },
  banners: {
    web: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    bet: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    hub: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
    app: { imageUrl: '', linkUrl: '', enabled: false, alt: 'ကြော်ငြာ' },
  },
});

export function AdminSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings>(emptySettings);
  const [status, setStatus] = useState('');
  const [saving, setSaving] = useState(false);

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
      setStatus('သိမ်းပြီးပါပြီ — Web / App / လောင်းကွင်းတွင် ပြသမည်');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'မသိမ်းနိုင်ပါ');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-section admin-site-settings">
      <form className="admin-form-card" onSubmit={handleSave}>
        <strong>ငွေလွဲနံပါတ် (KBZ Pay / Wave Pay)</strong>
        <div className="admin-form-grid">
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

        <strong className="admin-settings-subhead">ကြော်ငြာစာ (အားလုံးတွင် လှိမ့်ပြခြင်း)</strong>
        <label className="admin-check">
          <input
            type="checkbox"
            checked={settings.announcement.enabled}
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcement: { ...current.announcement, enabled: event.target.checked },
              }))
            }
          />
          <span>ကြော်ငြာစာ ဖွင့်မည်</span>
        </label>
        <label className="search-box">
          <span>စာသား</span>
          <textarea
            rows={3}
            value={settings.announcement.text}
            placeholder="ဥပမာ — Wave/KPay ငွေသွင်းပြီး screenshot ပို့ပါ"
            onChange={(event) =>
              setSettings((current) => ({
                ...current,
                announcement: { ...current.announcement, text: event.target.value },
              }))
            }
          />
        </label>

        {BANNER_SLOTS.map((slot) => (
          <div className="admin-banner-block" key={slot.id}>
            <strong className="admin-settings-subhead">Banner — {slot.label}</strong>
            <label className="admin-check">
              <input
                type="checkbox"
                checked={settings.banners[slot.id].enabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    banners: {
                      ...current.banners,
                      [slot.id]: { ...current.banners[slot.id], enabled: event.target.checked },
                    },
                  }))
                }
              />
              <span>ပြမည်</span>
            </label>
            <div className="admin-form-grid">
              <label className="search-box">
                <span>ပုံ URL</span>
                <input
                  value={settings.banners[slot.id].imageUrl}
                  placeholder="https://..."
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      banners: {
                        ...current.banners,
                        [slot.id]: { ...current.banners[slot.id], imageUrl: event.target.value },
                      },
                    }))
                  }
                />
              </label>
              <label className="search-box">
                <span>လင့်ခ် (မထည့်လည်း ရ)</span>
                <input
                  value={settings.banners[slot.id].linkUrl}
                  placeholder="https://..."
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      banners: {
                        ...current.banners,
                        [slot.id]: { ...current.banners[slot.id], linkUrl: event.target.value },
                      },
                    }))
                  }
                />
              </label>
            </div>
            {settings.banners[slot.id].imageUrl ? (
              <img
                src={settings.banners[slot.id].imageUrl}
                alt=""
                className="admin-banner-preview"
              />
            ) : null}
          </div>
        ))}

        <button type="submit" className="admin-primary-btn" disabled={saving}>
          {saving ? 'သိမ်းနေပါတယ်…' : 'ဆက်တင်များ သိမ်းမည်'}
        </button>
      </form>
      {status ? <p className="account-modal-status admin-status">{status}</p> : null}
    </div>
  );
}
