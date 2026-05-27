import { Capacitor } from '@capacitor/core';
import { fetchFirebaseAppVersion } from './firebaseUpdate';
import { APP_DOWNLOAD_PAGE, type AppVersionInfo } from './appVersionInfo';
import {
  PUBLISHED_RELEASE_NOTES,
  PUBLISHED_VERSION_CODE,
  PUBLISHED_VERSION_NAME,
} from './publishedVersion';

export type { AppVersionInfo } from './appVersionInfo';
export { APP_DOWNLOAD_PAGE } from './appVersionInfo';

const FETCH_MS = 5000;

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
}

function publishedFallback(): AppVersionInfo {
  return {
    versionCode: PUBLISHED_VERSION_CODE,
    versionName: PUBLISHED_VERSION_NAME,
    apkUrl: APP_DOWNLOAD_PAGE,
    apkUrlSite: APP_DOWNLOAD_PAGE,
    releaseNotes: PUBLISHED_RELEASE_NOTES,
    source: 'bundled',
  };
}

async function fetchJsonVersion(url: string): Promise<AppVersionInfo | null> {
  const controller = new AbortController();
  const timer = globalThis.setTimeout(() => controller.abort(), FETCH_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: 'no-store',
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (!response.ok) {
      return null;
    }
    const text = await response.text();
    if (!text.trim().startsWith('{')) {
      return null;
    }
    const data = JSON.parse(text) as AppVersionInfo;
    if (!data?.versionCode || data.versionCode < 1) {
      return null;
    }
    return {
      ...data,
      apkUrl: APP_DOWNLOAD_PAGE,
      apkUrlSite: APP_DOWNLOAD_PAGE,
      source: 'json',
    };
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/** Firebase Remote Config ဦးစား → app-version.json → APK ထဲ ဗားရှင်း */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo> {
  const published = publishedFallback();

  const firebase = await fetchFirebaseAppVersion();
  if (firebase?.versionCode) {
    return firebase;
  }

  const jsonUrl = withCacheBust('https://ballpwal.org/app-version.json');
  const json = await fetchJsonVersion(jsonUrl);
  if (json && json.versionCode >= published.versionCode) {
    return {
      ...json,
      versionCode: Math.max(json.versionCode, published.versionCode),
    };
  }

  return published;
}

export async function openAppDownloadPage(url?: string) {
  const target = (url || APP_DOWNLOAD_PAGE).trim() || APP_DOWNLOAD_PAGE;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: target });
      return;
    } catch {
      // Browser plugin missing
    }
  }

  window.location.href = target;
}

export async function getInstalledVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 0;
  }

  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const build = Number.parseInt(String(info.build), 10);
    if (Number.isFinite(build) && build > 0) {
      return build;
    }
  } catch {
    // fall through
  }

  return 0;
}

export function requiresAppUpdate(remote: AppVersionInfo, localCode: number) {
  const required = Math.max(
    remote.minVersionCode ?? remote.versionCode,
    PUBLISHED_VERSION_CODE,
  );
  return localCode > 0 && localCode < required;
}
