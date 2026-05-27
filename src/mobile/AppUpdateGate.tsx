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

const GATE_CACHE_KEY = 'ballpwal-update-gate-v1';

type GateCache = {
  gate: GateState;
  latest: AppVersionInfo | null;
  installedCode: number;
  installedName: string;
};

function readGateCache(): GateCache | null {
  try {
    const raw = sessionStorage.getItem(GATE_CACHE_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as GateCache;
    if (parsed.gate === 'blocked' || parsed.gate === 'ready' || parsed.gate === 'check-failed') {
      return parsed;
    }
  } catch {
    // ignore
  }
  return null;
}

function writeGateCache(cache: GateCache) {
  try {
    sessionStorage.setItem(GATE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // ignore
  }
}

function resolveGate(remote: AppVersionInfo | null, localCode: number): GateState {
  if (!remote?.versionCode) {
    return 'check-failed';
  }
  if (localCode > 0 && localCode >= remote.versionCode) {
    return 'ready';
  }
  return 'blocked';
}

/** Native App — update မလုပ်ရင် children မပြပါ (မှိတ်တုတ် မဖြစ်အောင် တစ်ကြိမ်သာ စစ်) */
export function AppUpdateGate({ children }: AppUpdateGateProps) {
  const cached = Capacitor.isNativePlatform() ? readGateCache() : null;
  const [gate, setGate] = useState<GateState>(() => {
    if (!Capacitor.isNativePlatform()) {
      return 'ready';
    }
    if (cached?.gate && cached.gate !== 'checking') {
      return cached.gate;
    }
    return 'checking';
  });
  const [latest, setLatest] = useState<AppVersionInfo | null>(cached?.latest ?? null);
  const [installedCode, setInstalledCode] = useState(cached?.installedCode ?? 0);
  const [installedName, setInstalledName] = useState(cached?.installedName ?? '');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const checkedRef = useRef(false);

  useEffect(() => {
    if (!Capacitor.isNativePlatform() || checkedRef.current) {
      return;
    }
    checkedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        const [remote, localCode] = await Promise.all([fetchLatestAppVersion(), getInstalledVersionCode()]);
        if (cancelled) {
          return;
        }

        let versionLabel = '';
        try {
          versionLabel = (await App.getInfo()).version;
        } catch {
          versionLabel = '';
        }

        const nextGate = resolveGate(remote, localCode);
        setLatest(remote);
        setInstalledCode(localCode);
        setInstalledName(versionLabel);
        setGate(nextGate);
        writeGateCache({
          gate: nextGate,
          latest: remote,
          installedCode: localCode,
          installedName: versionLabel,
        });
      } catch {
        if (!cancelled) {
          setGate('check-failed');
          writeGateCache({
            gate: 'check-failed',
            latest: null,
            installedCode: 0,
            installedName: '',
          });
        }
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
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
    checkedRef.current = false;
    sessionStorage.removeItem(GATE_CACHE_KEY);
    setGate('checking');
    setError('');
    checkedRef.current = true;

    void (async () => {
      try {
        const [remote, localCode] = await Promise.all([fetchLatestAppVersion(), getInstalledVersionCode()]);
        let versionLabel = '';
        try {
          versionLabel = (await App.getInfo()).version;
        } catch {
          versionLabel = '';
        }
        const nextGate = resolveGate(remote, localCode);
        setLatest(remote);
        setInstalledCode(localCode);
        setInstalledName(versionLabel);
        setGate(nextGate);
        writeGateCache({
          gate: nextGate,
          latest: remote,
          installedCode: localCode,
          installedName: versionLabel,
        });
      } catch {
        setGate('check-failed');
      }
    })();
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
        <p className="m-update-block-title">ချိတ်ဆက်မှု မအောင်မြင်ပါ</p>
        <p className="m-update-block-msg">အင်တာနက် စစ်ပြီး ပြန် ကြိုးစားပါ</p>
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
          လက်ရှိ <strong>{installedName || `build ${installedCode}`}</strong> → အသစ်{' '}
          <strong>{latest?.versionName ?? '—'}</strong>
        </p>
        {latest?.releaseNotes ? <p className="m-update-notes">{latest.releaseNotes}</p> : null}
        <p className="m-update-hint">
          <strong>Update</strong> နှိပ်ပါ — App ဖျက်စရာမလိုပါ။ Android တပ်ဆင်ရန် မျက်နှာပြင် ပေါ်လာပါမယ်။
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
