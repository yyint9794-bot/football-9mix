import { Capacitor } from '@capacitor/core';
import { fetchFirebaseAppVersion } from './firebaseUpdate';
import { APP_DOWNLOAD_PAGE, type AppVersionInfo } from './appVersionInfo';
import { parseReleaseFeatures } from './parseReleaseFeatures';
import { PUBLISHED_VERSION_CODE } from './publishedVersion';

export type { AppVersionInfo } from './appVersionInfo';
export { APP_DOWNLOAD_PAGE } from './appVersionInfo';

const FETCH_MS = 8000;

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
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
    const data = JSON.parse(text) as AppVersionInfo & {
      releaseFeatures?: string[] | string;
      forceUpdate?: boolean;
    };
    if (!data?.versionCode || data.versionCode < 1) {
      return null;
    }

    const features =
      Array.isArray(data.releaseFeatures)
        ? data.releaseFeatures.map((item) => String(item).trim()).filter(Boolean)
        : parseReleaseFeatures(typeof data.releaseFeatures === 'string' ? data.releaseFeatures : '');

    return {
      versionCode: data.versionCode,
      versionName: String(data.versionName || data.versionCode),
      apkUrl: APP_DOWNLOAD_PAGE,
      apkUrlSite: APP_DOWNLOAD_PAGE,
      releaseNotes: data.releaseNotes,
      releaseFeatures: features,
      forceUpdate: data.forceUpdate !== false,
      minVersionCode: data.versionCode,
      source: 'json',
    };
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

/** Firebase Remote Config → ballpwal.org/app-version.json (bundled ဗားရှင်းကို latest အဖြစ် မသုံး) */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  const firebase = await fetchFirebaseAppVersion();
  if (firebase?.versionCode) {
    return firebase;
  }

  const jsonUrl = withCacheBust('https://ballpwal.org/app-version.json');
  return fetchJsonVersion(jsonUrl);
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
    const versionDigits = String(info.version || '').replace(/\D/g, '');
    const fromName = Number.parseInt(versionDigits, 10);
    if (Number.isFinite(fromName) && fromName > 0) {
      return fromName;
    }
  } catch {
    // fall through
  }

  return 0;
}

export function requiresAppUpdate(remote: AppVersionInfo, localCode: number) {
  const required = Math.max(remote.minVersionCode ?? 0, remote.versionCode);
  if (!Number.isFinite(required) || required < 1) {
    return false;
  }

  const local = localCode > 0 ? localCode : 1;
  return local < required;
}

export function isUpdateMandatory(remote: AppVersionInfo) {
  return remote.forceUpdate !== false;
}

export function getEffectiveInstalledCode(localCode: number) {
  return localCode > 0 ? localCode : 1;
}

/** APK ထဲ bundled version — remote မရရင် နှိုင်းယှဉ်မသုံး */
export function getBundledVersionCode() {
  return PUBLISHED_VERSION_CODE;
}
