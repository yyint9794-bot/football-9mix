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
  'https://ballpwal.org/api/app-version',
  'https://ballpwal.org/app-version.json',
  'https://www.ballpwal.org/api/app-version',
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

  const apkDirect = [data.apkUrl, data.apkUrlSite, data.apkUrlCdn]
    .map((url) => String(url || '').trim())
    .find((url) => url.startsWith('http'));

  const versionCode = Number(data.versionCode);
  const minFromServer = Number(data.minVersionCode);
  const minVersionCode =
    Number.isFinite(minFromServer) && minFromServer > 0
      ? Math.max(minFromServer, versionCode)
      : versionCode;

  return {
    versionCode,
    versionName: String(data.versionName || data.versionCode),
    apkUrl: apkDirect || APP_DOWNLOAD_PAGE,
    apkUrlSite: apkDirect || APP_DOWNLOAD_PAGE,
    releaseNotes: data.releaseNotes,
    releaseFeatures: features,
    forceUpdate: data.forceUpdate !== false,
    minVersionCode,
    source: 'json',
  };
}

function normalizeRemoteVersion(remote: AppVersionInfo): AppVersionInfo {
  const apkUrl =
    remote.apkUrl?.startsWith('http')
      ? remote.apkUrl
      : remote.apkUrlSite?.startsWith('http')
        ? remote.apkUrlSite
        : APP_DOWNLOAD_PAGE;

  return {
    ...remote,
    apkUrl,
    apkUrlSite: apkUrl,
    minVersionCode: Math.max(remote.minVersionCode ?? 0, remote.versionCode),
    forceUpdate: remote.forceUpdate !== false,
  };
}

function pickLatestVersion(candidates: AppVersionInfo[]): AppVersionInfo {
  return candidates.reduce((best, current) => {
    const normalized = normalizeRemoteVersion(current);
    if (normalized.versionCode > best.versionCode) {
      return normalized;
    }
    if (normalized.versionCode === best.versionCode) {
      return normalizeRemoteVersion({
        ...best,
        releaseNotes: normalized.releaseNotes || best.releaseNotes,
        releaseFeatures: normalized.releaseFeatures?.length
          ? normalized.releaseFeatures
          : best.releaseFeatures,
        apkUrl: normalized.apkUrl.startsWith('http') ? normalized.apkUrl : best.apkUrl,
      });
    }
    return best;
  });
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

/** ballpwal.org API (R2) → static JSON → Firebase → APK bundled fallback */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  const candidates: AppVersionInfo[] = [];

  for (const base of VERSION_URLS) {
    const remote = await fetchJsonVersion(withCacheBust(base));
    if (remote?.versionCode) {
      candidates.push(remote);
    }
  }

  const bundled = await fetchJsonVersion(withCacheBust('/app-version.json'));
  if (bundled?.versionCode) {
    candidates.push(bundled);
  }

  try {
    const firebase = await fetchFirebaseAppVersion();
    if (firebase?.versionCode) {
      candidates.push(firebase);
    }
  } catch {
    // ignore
  }

  if (candidates.length) {
    return pickLatestVersion(candidates);
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
  const latest = remote.versionCode;
  if (!Number.isFinite(latest) || latest < 1) {
    return false;
  }

  const local = localCode > 0 ? localCode : 1;
  if (local < latest) {
    return true;
  }

  const minRequired = remote.minVersionCode ?? latest;
  return local < minRequired;
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
