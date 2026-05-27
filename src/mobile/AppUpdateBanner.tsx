import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  fetchLatestAppVersion,
  getEffectiveInstalledCode,
  getInstalledVersionCode,
  isUpdateMandatory,
  openAppDownloadPage,
  requiresAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';

type AppUpdateBannerProps = {
  children: ReactNode;
};

type GateState = 'checking' | 'blocked' | 'ready';

/** Update မလုပ်ရသေးရင် App မသုံး — feature list ပါ */
export function AppUpdateBanner({ children }: AppUpdateBannerProps) {
  const [gate, setGate] = useState<GateState>('checking');
  const [latest, setLatest] = useState<AppVersionInfo | null>(null);
  const [installedCode, setInstalledCode] = useState(0);
  const [checkError, setCheckError] = useState('');

  const runCheck = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) {
      setGate('ready');
      return;
    }

    setCheckError('');
    setGate('checking');

    const localCode = await getInstalledVersionCode();
    setInstalledCode(localCode);

    try {
      const remote = await fetchLatestAppVersion();
      if (!remote?.versionCode) {
        setCheckError('ဗားရှင်း စစ်ဆေးမှု မရပါ — အင်တာနက် စစ်ပြီး ထပ်စမ်းပါ');
        setGate('blocked');
        return;
      }

      setLatest(remote);

      if (requiresAppUpdate(remote, localCode)) {
        setGate('blocked');
        return;
      }

      setGate('ready');
    } catch {
      setCheckError('ဗားရှင်း စစ်ဆေးမှု မအောင်မြင်ပါ');
      setGate('blocked');
    }
  }, []);

  useEffect(() => {
    void runCheck();

    if (!Capacitor.isNativePlatform()) {
      return;
    }

    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        void runCheck();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = globalThis.setInterval(() => void runCheck(), 5 * 60 * 1000);

    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      globalThis.clearInterval(timer);
    };
  }, [runCheck]);

  const download = () => {
    void openAppDownloadPage(latest?.apkUrl);
  };

  if (!Capacitor.isNativePlatform()) {
    return <>{children}</>;
  }

  if (gate === 'checking') {
    return (
      <div className="m-update-block" role="dialog" aria-modal="true">
        <div className="m-update-card m-update-card-block">
          <p className="m-update-checking">ဗားရှင်း စစ်ဆေးနေပါတယ်…</p>
        </div>
      </div>
    );
  }

  if (gate === 'blocked' && latest) {
    const local = getEffectiveInstalledCode(installedCode);
    const mandatory = isUpdateMandatory(latest);
    const features = latest.releaseFeatures ?? [];

    return (
      <div className="m-update-block" role="dialog" aria-modal="true">
        <div className="m-update-card m-update-card-block">
          <span className="m-update-badge">App Update</span>
          <h2>ဗားရှင်း အသစ် လိုအပ်ပါသည်</h2>
          <p>
            လက်ရှိ <strong>v{local}</strong> → အသစ်{' '}
            <strong>
              {latest.versionName} (v{latest.versionCode})
            </strong>
          </p>
          {latest.releaseNotes ? <p className="m-update-notes">{latest.releaseNotes}</p> : null}

          {features.length > 0 ? (
            <div className="m-update-features">
              <h3>ဤ update တွင် ပါဝင်သည်</h3>
              <ul>
                {features.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ) : null}

          <p className="m-update-hint">
            {mandatory
              ? 'Update ဒေါင်းလုဒ် လုပ်ပြီး APK ထပ်သွင်းမှ App သုံးလို့ရမည်။'
              : 'ဒေါင်းလုဒ်လုပ်ပြီး ထပ်သွင်းပါ။'}
          </p>

          {checkError ? <p className="m-update-error">{checkError}</p> : null}

          <div className="m-update-actions">
            <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={download}>
              Update ဒေါင်းလုဒ်
            </button>
            <button type="button" className="m-btn m-btn-ghost m-btn-block" onClick={() => void runCheck()}>
              ထပ်စမ်းမည်
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gate === 'blocked') {
    return (
      <div className="m-update-block" role="dialog" aria-modal="true">
        <div className="m-update-card m-update-card-block">
          <h2>ချိတ်ဆက်မှု မရပါ</h2>
          <p className="m-update-error">{checkError || 'အင်တာနက် စစ်ပြီး ထပ်စမ်းပါ'}</p>
          <div className="m-update-actions">
            <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={download}>
              Update ဒေါင်းလုဒ် (apk.html)
            </button>
            <button type="button" className="m-btn m-btn-ghost m-btn-block" onClick={() => void runCheck()}>
              ထပ်စမ်းမည်
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
