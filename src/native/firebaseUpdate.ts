import { Capacitor } from '@capacitor/core';
import { fetchAndActivate, fetchConfig, getRemoteConfig, getValue, type RemoteConfig } from 'firebase/remote-config';
import { getFirebaseApp } from './firebaseApp';
import { APP_DOWNLOAD_PAGE, type AppVersionInfo } from './appVersionInfo';
import { parseReleaseFeatures } from './parseReleaseFeatures';
import {
  MINIMUM_REQUIRED_VERSION_CODE,
  PUBLISHED_RELEASE_NOTES,
  PUBLISHED_VERSION_CODE,
  PUBLISHED_VERSION_NAME,
} from './publishedVersion';

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

function rcBool(rc: RemoteConfig, key: string, fallback = false) {
  const raw = getValue(rc, key).asString().trim().toLowerCase();
  if (!raw) {
    return fallback;
  }
  return raw === 'true' || raw === '1' || raw === 'yes';
}

async function ensureRemoteConfig() {
  if (remoteConfig) {
    return remoteConfig;
  }

  const firebaseApp = await getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  remoteConfig = getRemoteConfig(firebaseApp);

  remoteConfig.defaultConfig = {
    app_min_version_code: String(MINIMUM_REQUIRED_VERSION_CODE),
    app_latest_version_code: String(PUBLISHED_VERSION_CODE),
    app_version_name: PUBLISHED_VERSION_NAME,
    app_download_url: APP_DOWNLOAD_PAGE,
    app_release_notes: PUBLISHED_RELEASE_NOTES,
    app_release_features: '',
    app_force_update: 'true',
  };

  remoteConfig.settings = {
    minimumFetchIntervalMillis: 0,
    fetchTimeoutMillis: 15_000,
  };

  if (Capacitor.isNativePlatform()) {
    await fetchConfig(remoteConfig);
    await fetchAndActivate(remoteConfig);
  } else {
    await fetchAndActivate(remoteConfig);
  }
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
    const versionCode = Math.max(latestCode, minCode);
    const downloadUrl = rcString(rc, 'app_download_url', APP_DOWNLOAD_PAGE);
    const featuresRaw = rcString(rc, 'app_release_features', '');

    return {
      versionCode,
      versionName: rcString(rc, 'app_version_name', PUBLISHED_VERSION_NAME),
      apkUrl: downloadUrl,
      apkUrlSite: downloadUrl,
      releaseNotes: rcString(rc, 'app_release_notes', PUBLISHED_RELEASE_NOTES),
      releaseFeatures: parseReleaseFeatures(featuresRaw),
      forceUpdate: rcBool(rc, 'app_force_update', true),
      minVersionCode: minCode,
      source: 'firebase',
    };
  } catch {
    return null;
  }
}
