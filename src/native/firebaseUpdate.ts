import { initializeApp, type FirebaseApp } from 'firebase/app';
import { fetchAndActivate, getRemoteConfig, getValue, type RemoteConfig } from 'firebase/remote-config';
import { APP_DOWNLOAD_PAGE, type AppVersionInfo } from './appVersionInfo';
import { loadFirebaseWebConfig } from './firebaseConfig';
import {
  PUBLISHED_RELEASE_NOTES,
  PUBLISHED_VERSION_CODE,
  PUBLISHED_VERSION_NAME,
} from './publishedVersion';

let firebaseApp: FirebaseApp | null = null;
let remoteConfig: RemoteConfig | null = null;

function rcNumber(rc: RemoteConfig, key: string, fallback: number) {
  const raw = getValue(rc, key).asString().trim();
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function rcString(rc: RemoteConfig, key: string, fallback: string) {
  const raw = getValue(rc, key).asString().trim();
  return raw || fallback;
}

function rcBool(rc: RemoteConfig, key: string) {
  const raw = getValue(rc, key).asString().trim().toLowerCase();
  return raw === 'true' || raw === '1' || raw === 'yes';
}

async function ensureRemoteConfig() {
  if (remoteConfig) {
    return remoteConfig;
  }

  const fileConfig = await loadFirebaseWebConfig();
  if (!fileConfig) {
    return null;
  }

  const { enabled: _enabled, ...options } = fileConfig;
  firebaseApp = initializeApp(options);
  remoteConfig = getRemoteConfig(firebaseApp);

  remoteConfig.defaultConfig = {
    app_min_version_code: String(PUBLISHED_VERSION_CODE),
    app_latest_version_code: String(PUBLISHED_VERSION_CODE),
    app_version_name: PUBLISHED_VERSION_NAME,
    app_download_url: APP_DOWNLOAD_PAGE,
    app_release_notes: PUBLISHED_RELEASE_NOTES,
    app_force_update: 'false',
  };

  remoteConfig.settings = {
    minimumFetchIntervalMillis: import.meta.env.DEV ? 0 : 60 * 60 * 1000,
    fetchTimeoutMillis: 8000,
  };

  await fetchAndActivate(remoteConfig);
  return remoteConfig;
}

/** Firebase Remote Config — update ဗားရှင်း (Console မှာ ပြင်လို့ရ) */
export async function fetchFirebaseAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const rc = await ensureRemoteConfig();
    if (!rc) {
      return null;
    }

    const latestCode = rcNumber(rc, 'app_latest_version_code', PUBLISHED_VERSION_CODE);
    const minCode = rcNumber(rc, 'app_min_version_code', latestCode);
    const versionCode = Math.max(latestCode, minCode, PUBLISHED_VERSION_CODE);
    const downloadUrl = rcString(rc, 'app_download_url', APP_DOWNLOAD_PAGE);

    return {
      versionCode,
      versionName: rcString(rc, 'app_version_name', PUBLISHED_VERSION_NAME),
      apkUrl: downloadUrl,
      apkUrlSite: downloadUrl,
      releaseNotes: rcString(rc, 'app_release_notes', PUBLISHED_RELEASE_NOTES),
      forceUpdate: rcBool(rc, 'app_force_update'),
      minVersionCode: minCode,
      source: 'firebase',
    };
  } catch {
    return null;
  }
}

export function isFirebaseUpdateConfigured() {
  return Boolean(firebaseApp);
}
