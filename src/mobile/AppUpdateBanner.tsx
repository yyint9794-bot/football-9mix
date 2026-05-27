import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useState, type ReactNode } from 'react';
import {
  buildFallbackUpdateInfo,
  fetchLatestAppVersion,
  getEffectiveInstalledCode,
  getInstalledVersionCode,
  needsMinimumClientUpdate,
  openAppDownloadPage,
  requiresAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';

type AppUpdateBannerProps = {
  children: ReactNode;
};

type GateState = 'checking' | 'blocked' | 'ready';

/** Update မလုပ်ရသေးရင် App မသုံး — network မလိုဘဲ min version စစ် */
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

    const fallback = buildFallbackUpdateInfo();

    if (needsMinimumClientUpdate(localCode)) {
      setLatest(fallback);
      setGate('blocked');
      return;
    }

    try {
      const remote = (await fetchLatestAppVersion()) ?? fallback;
      setLatest(remote);

      if (requiresAppUpdate(remote, localCode)) {
        setGate('blocked');
        return;
      }

      setGate('ready');
    } catch {
      setLatest(fallback);
      setCheckError('ဗားရှင်း စစ်ဆေးမှု မအောင်မြင်ပါ — Update လုပ်ရန် လိုအပ်နိုင်သည်');
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
    const timer = globalThis.setInterval(() => void runCheck(), 3 * 60 * 1000);

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
            Update ဒေါင်းလုဒ် လုပ်ပြီး APK ထပ်သွင်းမှ App သုံးလို့ရမည်။
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

  return <>{children}</>;
}
