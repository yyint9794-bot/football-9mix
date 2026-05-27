import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useState, type ReactNode } from 'react';
import {
  fetchLatestAppVersion,
  getInstalledVersionCode,
  installAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';
import { PUBLISHED_APK_URL, PUBLISHED_VERSION_CODE } from '../native/publishedVersion';

type GateState = 'checking' | 'ready' | 'blocked' | 'check-failed';

type AppUpdateGateProps = {
  children: ReactNode;
};

const BLOCKED_CACHE_KEY = 'ballpwal-update-blocked-v3';

type BlockedCache = {
  latest: AppVersionInfo;
  installedCode: number;
  installedName: string;
};

function readBlockedCache(): BlockedCache | null {
  try {
    const raw = sessionStorage.getItem(BLOCKED_CACHE_KEY);
    if (!raw) {
      return null;
    }
    return JSON.parse(raw) as BlockedCache;
  } catch {
    return null;
  }
}

function writeBlockedCache(cache: BlockedCache) {
  try {
    sessionStorage.setItem(BLOCKED_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function clearBlockedCache() {
  try {
    sessionStorage.removeItem(BLOCKED_CACHE_KEY);
    sessionStorage.removeItem('ballpwal-update-blocked-v2');
    sessionStorage.removeItem('ballpwal-update-gate-v1');
  } catch {
    // ignore
  }
}

function needsUpdate(remote: AppVersionInfo, localCode: number) {
  const required = Math.max(remote.versionCode, PUBLISHED_VERSION_CODE);
  return localCode < required;
}

export function AppUpdateGate({ children }: AppUpdateGateProps) {
  const blockedBoot = Capacitor.isNativePlatform() ? readBlockedCache() : null;
  const [gate, setGate] = useState<GateState>(() => {
    if (!Capacitor.isNativePlatform()) {
      return 'ready';
    }
    return blockedBoot ? 'blocked' : 'checking';
  });
  const [latest, setLatest] = useState<AppVersionInfo | null>(blockedBoot?.latest ?? null);
  const [installedCode, setInstalledCode] = useState(blockedBoot?.installedCode ?? 0);
  const [installedName, setInstalledName] = useState(blockedBoot?.installedName ?? '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [debug, setDebug] = useState('');

  const applyCheck = async () => {
    const localCode = await getInstalledVersionCode();
    const remote = await fetchLatestAppVersion();

    let versionLabel = '';
    try {
      versionLabel = (await App.getInfo()).version;
    } catch {
      versionLabel = '';
    }

    setInstalledCode(localCode);
    setInstalledName(versionLabel);
    setDebug(`ဖုန်း build ${localCode} · server v${remote?.versionCode ?? '?'} · APKထဲ v${PUBLISHED_VERSION_CODE}`);

    if (!remote?.versionCode) {
      setGate('check-failed');
      return;
    }

    setLatest(remote);

    if (needsUpdate(remote, localCode)) {
      setGate('blocked');
      writeBlockedCache({ latest: remote, installedCode: localCode, installedName: versionLabel });
      return;
    }

    clearBlockedCache();
    setGate('ready');
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    void applyCheck().catch(() => setGate('check-failed'));
  }, []);

  if (!Capacitor.isNativePlatform()) {
    return children;
  }

  const handleUpdate = async () => {
    const url = latest?.apkUrl || PUBLISHED_APK_URL;
    setError('');
    setUpdating(true);
    try {
      await installAppUpdate(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update မအောင်မြင်ပါ');
    } finally {
      setUpdating(false);
    }
  };

  const openBrowserDownload = () => {
    window.location.href = PUBLISHED_APK_URL;
  };

  const handleRetry = () => {
    setGate('checking');
    setError('');
    void applyCheck().catch(() => setGate('check-failed'));
  };

  if (gate === 'ready') {
    return children;
  }

  if (gate === 'checking') {
    return (
      <div className="m-update-block">
        <p className="m-update-block-msg">ဗားရှင်း စစ်ဆေးနေပါတယ်…</p>
      </div>
    );
  }

  if (gate === 'check-failed') {
    return (
      <div className="m-update-block">
        <p className="m-update-block-title">ဗားရှင်း စစ်၍ မရပါ</p>
        <p className="m-update-block-msg">VPN ပိတ်ပြီး WiFi သုံးပါ။ အောက်ပါ ခလုတ်နဲ့ APK တိုက်ရိုက်ဒေါင်းလုဒ်လုပ်နိုင်ပါတယ်။</p>
        {debug ? <p className="m-update-hint">{debug}</p> : null}
        {error ? <p className="m-error">{error}</p> : null}
        <div className="m-update-actions">
          <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={openBrowserDownload}>
            APK ဒေါင်းလုဒ် (v{PUBLISHED_VERSION_CODE})
          </button>
          <button type="button" className="m-btn m-btn-ghost m-btn-block" onClick={handleRetry}>
            ပြန် စမ်းမည်
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="m-update-block" role="dialog" aria-modal="true" aria-label="App update required">
      <div className="m-update-card m-update-card-block">
        <span className="m-update-badge">ဗားရှင်း အသစ် လိုအပ်ပါသည်</span>
        <h2>Update မလုပ်ရင် App သုံးမရပါ</h2>
        <p>
          လက်ရှိ <strong>{installedName || `build ${installedCode}`}</strong> (v{installedCode}) → အသစ်{' '}
          <strong>
            {latest?.versionName ?? '—'} (v{latest?.versionCode ?? '?'})
          </strong>
        </p>
        {debug ? <p className="m-update-hint">{debug}</p> : null}
        {latest?.releaseNotes ? <p className="m-update-notes">{latest.releaseNotes}</p> : null}
        <p className="m-update-hint">
          <strong>Update ယခု လုပ်မည်</strong> နှိပ်ပါ — မရရင် အောက်က APK ဒေါင်းလုဒ် သုံးပါ။
        </p>
        {error ? <p className="m-error">{error}</p> : null}
        <div className="m-update-actions">
          <button
            type="button"
            className="m-btn m-btn-primary m-btn-block"
            disabled={updating}
            onClick={() => void handleUpdate()}
          >
            {updating ? 'ဒေါင်းလုဒ်လုပ်နေပါတယ်…' : 'Update ယခု လုပ်မည်'}
          </button>
          <button type="button" className="m-btn m-btn-ghost m-btn-block" disabled={updating} onClick={openBrowserDownload}>
            APK ဒေါင်းလုဒ် (browser)
          </button>
        </div>
      </div>
    </div>
  );
}
