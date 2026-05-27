import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import {
  clearInstalledVersionCache,
  fetchLatestAppVersion,
  getInstalledVersionCode,
  installAppUpdate,
  type AppVersionInfo,
} from '../native/appUpdate';

type GateState = 'checking' | 'ready' | 'blocked' | 'check-failed';

type AppUpdateGateProps = {
  children: ReactNode;
};

const RESUME_CHECK_MS = 8000;

/** Native App — update မလုပ်ရင် အောက်ပါ children မပြပါ */
export function AppUpdateGate({ children }: AppUpdateGateProps) {
  const [gate, setGate] = useState<GateState>(() =>
    Capacitor.isNativePlatform() ? 'checking' : 'ready',
  );
  const [latest, setLatest] = useState<AppVersionInfo | null>(null);
  const [installedCode, setInstalledCode] = useState(0);
  const [installedName, setInstalledName] = useState('');
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const resolvedRef = useRef(false);
  const checkInFlightRef = useRef(false);
  const lastResumeCheckRef = useRef(0);

  const applyResult = useCallback((remote: AppVersionInfo | null, localCode: number, versionLabel: string) => {
    setInstalledCode(localCode);
    setInstalledName(versionLabel);

    if (!remote?.versionCode) {
      if (resolvedRef.current) {
        return;
      }
      setGate('check-failed');
      return;
    }

    if (localCode > 0 && localCode < remote.versionCode) {
      setGate('blocked');
      resolvedRef.current = true;
      return;
    }

    if (localCode >= remote.versionCode && localCode > 0) {
      setGate('ready');
      resolvedRef.current = true;
      return;
    }

    if (localCode === 0 && remote.versionCode > 0) {
      setGate('blocked');
      resolvedRef.current = true;
    }
  }, []);

  const check = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!Capacitor.isNativePlatform()) {
        setGate('ready');
        return;
      }

      if (checkInFlightRef.current) {
        return;
      }

      const silent = options?.silent === true && resolvedRef.current;
      checkInFlightRef.current = true;

      if (!silent) {
        setError('');
        if (!resolvedRef.current) {
          setGate('checking');
        }
      }

      try {
        const [remote, localCode] = await Promise.all([fetchLatestAppVersion(), getInstalledVersionCode()]);
        setLatest(remote);

        let versionLabel = '';
        try {
          const info = await App.getInfo();
          versionLabel = info.version;
        } catch {
          versionLabel = '';
        }

        applyResult(remote, localCode, versionLabel);
      } catch {
        if (!resolvedRef.current) {
          setGate('check-failed');
        }
      } finally {
        checkInFlightRef.current = false;
      }
    },
    [applyResult],
  );

  useEffect(() => {
    void check({ silent: false });

    const resume = App.addListener('appStateChange', (state) => {
      if (!state.isActive || updating) {
        return;
      }

      const now = Date.now();
      if (now - lastResumeCheckRef.current < RESUME_CHECK_MS) {
        return;
      }
      lastResumeCheckRef.current = now;
      clearInstalledVersionCache();
      void check({ silent: true });
    });

    return () => {
      void resume.then((handle) => handle.remove());
    };
  }, [check, updating]);

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
    resolvedRef.current = false;
    void check({ silent: false });
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
