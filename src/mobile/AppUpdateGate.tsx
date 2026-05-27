import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  fetchLatestAppVersion,
  getInstalledVersionCode,
  installAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';

type GateState = 'checking' | 'ready' | 'blocked' | 'check-failed';

type AppUpdateGateProps = {
  children: ReactNode;
};

/** blocked သာ မှတ်ထား — ready cache မသုံး (update မလွှတ်အောင်) */
const BLOCKED_CACHE_KEY = 'ballpwal-update-blocked-v2';

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
  } catch {
    // ignore
  }
}

function needsUpdate(remote: AppVersionInfo, localCode: number) {
  return localCode < remote.versionCode;
}

/** Native App — update မလုပ်ရင် children မပြပါ */
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
  const checkedRef = useRef(false);

  const applyCheck = async () => {
    const [remote, localCode] = await Promise.all([fetchLatestAppVersion(), getInstalledVersionCode()]);

    let versionLabel = '';
    try {
      versionLabel = (await App.getInfo()).version;
    } catch {
      versionLabel = '';
    }

    if (!remote?.versionCode) {
      setGate('check-failed');
      return;
    }

    setLatest(remote);
    setInstalledCode(localCode);
    setInstalledName(versionLabel);

    if (needsUpdate(remote, localCode)) {
      setGate('blocked');
      writeBlockedCache({ latest: remote, installedCode: localCode, installedName: versionLabel });
      return;
    }

    clearBlockedCache();
    setGate('ready');
  };

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || checkedRef.current) {
      return;
    }
    checkedRef.current = true;
    void applyCheck().catch(() => setGate('check-failed'));
  }, []);

  if (!Capacitor.isNativePlatform()) {
    return children;
  }

  const handleUpdate = async () => {
    if (!latest) {
      return;
    }
    setError('');
    setUpdating(true);
    try {
      await installAppUpdate(latest.apkUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update မအောင်မြင်ပါ');
    } finally {
      setUpdating(false);
    }
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
        <p className="m-update-block-msg">
          အင်တာနက် / VPN စစ်ပြီး ပြန် စမ်းပါ။ Update အသစ် ရယူရန် ချိတ်ဆက်မှု လိုအပ်ပါသည်။
        </p>
        {error ? <p className="m-error">{error}</p> : null}
        <button type="button" className="m-btn m-btn-primary m-btn-block" onClick={handleRetry}>
          ပြန် စမ်းမည်
        </button>
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
        {latest?.releaseNotes ? <p className="m-update-notes">{latest.releaseNotes}</p> : null}
        <p className="m-update-hint">
          <strong>Update ယခု လုပ်မည်</strong> နှိပ်ပါ — App ဖျက်စရာမလိုပါ။
        </p>
        {error ? <p className="m-error">{error}</p> : null}
        <div className="m-update-actions">
          <button
            type="button"
            className="m-btn m-btn-primary m-btn-block"
            disabled={updating || !latest}
            onClick={() => void handleUpdate()}
          >
            {updating ? 'ဒေါင်းလုဒ်လုပ်နေပါတယ်…' : 'Update ယခု လုပ်မည်'}
          </button>
        </div>
      </div>
    </div>
  );
}
