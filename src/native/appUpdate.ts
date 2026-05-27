import { Capacitor } from '@capacitor/core';
import { fetchFirebaseAppVersion } from './firebaseUpdate';
import { NativeAppUpdate } from './appUpdatePlugin';
import { APP_DOWNLOAD_PAGE, type AppVersionInfo } from './appVersionInfo';
import { parseReleaseFeatures } from './parseReleaseFeatures';
import {
  MINIMUM_REQUIRED_VERSION_CODE,
  PUBLISHED_RELEASE_NOTES,
  PUBLISHED_VERSION_CODE,
  PUBLISHED_VERSION_NAME,
} from './publishedVersion';

export type { AppVersionInfo } from './appVersionInfo';
export { APP_DOWNLOAD_PAGE } from './appVersionInfo';

const FETCH_MS = 10_000;
const VERSION_URLS = [
  'https://ballpwal.org/app-version.json',
  'https://www.ballpwal.org/app-version.json',
];

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
}

async function fetchNative(url: string) {
  try {
    const { CapacitorHttp } = await import('@capacitor/core');
    const response = await CapacitorHttp.get({
      url,
      headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
    });
    if (response.status < 200 || response.status >= 300) {
      return null;
    }
    const text = typeof response.data === 'string' ? response.data : JSON.stringify(response.data);
    return text;
  } catch {
    return null;
  }
}

async function fetchWeb(url: string) {
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
    return await response.text();
  } catch {
    return null;
  } finally {
    globalThis.clearTimeout(timer);
  }
}

function parseVersionPayload(text: string): AppVersionInfo | null {
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
    minVersionCode: Math.max(data.versionCode, MINIMUM_REQUIRED_VERSION_CODE),
    source: 'json',
  };
}

async function fetchJsonVersion(url: string): Promise<AppVersionInfo | null> {
  const text = Capacitor.isNativePlatform() ? (await fetchNative(url)) ?? (await fetchWeb(url)) : await fetchWeb(url);
  if (!text) {
    return null;
  }
  try {
    return parseVersionPayload(text);
  } catch {
    return null;
  }
}

export function buildFallbackUpdateInfo(): AppVersionInfo {
  return {
    versionCode: PUBLISHED_VERSION_CODE,
    versionName: PUBLISHED_VERSION_NAME,
    apkUrl: APP_DOWNLOAD_PAGE,
    apkUrlSite: APP_DOWNLOAD_PAGE,
    releaseNotes: PUBLISHED_RELEASE_NOTES,
    releaseFeatures: parseReleaseFeatures(
      'Live Chat — ချက်ချင်း မြင်ရမည်|Update မလုပ်ရသေးရင် App မဖွင့်|မောင်း/ဘော်ဒီ UI|Live ကြည့်ရှု + Chat',
    ),
    forceUpdate: true,
    minVersionCode: Math.max(MINIMUM_REQUIRED_VERSION_CODE, PUBLISHED_VERSION_CODE),
    source: 'bundled',
  };
}

/** Firebase → web JSON → APK ထဲ bundled app-version.json */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  const firebase = await fetchFirebaseAppVersion();
  if (firebase?.versionCode) {
    return {
      ...firebase,
      minVersionCode: Math.max(
        firebase.minVersionCode ?? 0,
        firebase.versionCode,
        MINIMUM_REQUIRED_VERSION_CODE,
      ),
      forceUpdate: true,
    };
  }

  for (const base of VERSION_URLS) {
    const remote = await fetchJsonVersion(withCacheBust(base));
    if (remote?.versionCode) {
      return remote;
    }
  }

  const bundled = await fetchJsonVersion('/app-version.json');
  if (bundled?.versionCode) {
    return bundled;
  }

  return buildFallbackUpdateInfo();
}

export async function openAppDownloadPage(url?: string) {
  const target = (url || APP_DOWNLOAD_PAGE).trim() || APP_DOWNLOAD_PAGE;

  if (Capacitor.isNativePlatform()) {
    try {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url: target });
      return;
    } catch {
      // fall through
    }
  }

  window.location.href = target;
}

export async function getInstalledVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 0;
  }

  try {
    const native = await NativeAppUpdate.getVersionCode();
    const code = Number.parseInt(String(native.code), 10);
    if (Number.isFinite(code) && code > 0) {
      return code;
    }
  } catch {
    // fall through
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
    remote.minVersionCode ?? 0,
    remote.versionCode,
    MINIMUM_REQUIRED_VERSION_CODE,
  );
  if (!Number.isFinite(required) || required < 1) {
    return false;
  }

  const local = localCode > 0 ? localCode : 1;
  return local < required;
}

export function isUpdateMandatory(_remote: AppVersionInfo) {
  return true;
}

export function getEffectiveInstalledCode(localCode: number) {
  return localCode > 0 ? localCode : 1;
}

export function needsMinimumClientUpdate(localCode: number) {
  const local = getEffectiveInstalledCode(localCode);
  return local < MINIMUM_REQUIRED_VERSION_CODE;
}
