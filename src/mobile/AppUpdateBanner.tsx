import { Capacitor } from '@capacitor/core';
import { useEffect, useState, type ReactNode } from 'react';
import {
  fetchLatestAppVersion,
  getInstalledVersionCode,
  openAppDownloadPage,
  requiresAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';

type AppUpdateBannerProps = {
  children: ReactNode;
};

const DISMISS_KEY = 'ballpwal-update-dismiss';
const DISMISS_HOURS = 24;

function readDismissed(versionCode: number) {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as { versionCode: number; until: number };
    if (parsed.versionCode !== versionCode) {
      return false;
    }
    return Date.now() < parsed.until;
  } catch {
    return false;
  }
}

function writeDismissed(versionCode: number) {
  const until = Date.now() + DISMISS_HOURS * 60 * 60 * 1000;
  localStorage.setItem(DISMISS_KEY, JSON.stringify({ versionCode, until }));
}

/** Firebase Remote Config — banner (သို့) force update */
export function AppUpdateBanner({ children }: AppUpdateBannerProps) {
  const [latest, setLatest] = useState<AppVersionInfo | null>(null);
  const [installedCode, setInstalledCode] = useState(0);
  const [bannerVisible, setBannerVisible] = useState(false);
  const [forceBlock, setForceBlock] = useState(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }

    let disposed = false;

    void (async () => {
      const localCode = await getInstalledVersionCode();
      if (disposed) {
        return;
      }

      setInstalledCode(localCode);

      try {
        const remote = await fetchLatestAppVersion();
        if (disposed || !remote?.versionCode) {
          return;
        }

        setLatest(remote);

        if (!requiresAppUpdate(remote, localCode)) {
          return;
        }

        if (remote.forceUpdate) {
          setForceBlock(true);
          return;
        }

        if (!readDismissed(remote.versionCode)) {
          setBannerVisible(true);
        }
      } catch {
        // Firebase/JSON မရရင် App ဆက်သုံး
      }
    })();

    return () => {
      disposed = true;
    };
  }, []);

  const dismissBanner = () => {
    if (latest?.versionCode) {
      writeDismissed(latest.versionCode);
    }
    setBannerVisible(false);
  };

  const download = () => {
    void openAppDownloadPage(latest?.apkUrl);
  };

  if (forceBlock && latest) {
    return (
      <div className="m-update-block" role="dialog" aria-modal="true">
        <div className="m-update-card m-update-card-block">
          <span className="m-update-badge">Firebase Update</span>
          <h2>ဗားရှင်း အသစ် လိုအပ်ပါသည်</h2>
          <p>
            လက်ရှိ v{installedCode} → အသစ်{' '}
            <strong>
              {latest.versionName} (v{latest.versionCode})
            </strong>
          </p>
          {latest.releaseNotes ? <p className="m-update-notes">{latest.releaseNotes}</p> : null}
          <p className="m-update-hint">Firebase Console မှ ထိန်းချုပ်ထားသော update — ဒေါင်းလုဒ်ပြီး ထပ်သွင်းပါ။</p>
          <div className="m-update-actions">
            <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={download}>
              Update ဒေါင်းလုဒ်
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {bannerVisible && latest ? (
        <div className="m-app-update-banner" role="status">
          <p className="m-app-update-banner-text">
            ဗားရှင်း အသစ် v{latest.versionCode} ({latest.versionName})
            {latest.source === 'firebase' ? ' · Firebase' : ''}
          </p>
          <div className="m-app-update-banner-actions">
            <button type="button" className="m-app-update-btn-primary" onClick={download}>
              ဒေါင်းလုဒ်
            </button>
            <button type="button" className="m-app-update-btn-ghost" onClick={dismissBanner}>
              နောက်မှ
            </button>
          </div>
        </div>
      ) : null}
      {children}
    </>
  );
}
