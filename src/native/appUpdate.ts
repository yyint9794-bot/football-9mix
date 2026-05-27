import { Capacitor, registerPlugin } from '@capacitor/core';
import {
  PUBLISHED_APK_URL,
  PUBLISHED_RELEASE_NOTES,
  PUBLISHED_VERSION_CODE,
  PUBLISHED_VERSION_NAME,
} from './publishedVersion';

export type AppVersionInfo = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  apkUrlCdn?: string;
  releaseNotes?: string;
};

type AppUpdatePlugin = {
  installApk(options: { url: string }): Promise<{ ok: boolean }>;
};

const AppUpdateNative = registerPlugin<AppUpdatePlugin>('AppUpdate');

const GITHUB_RAW =
  'https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/app-version.json';
const JS_DELIVR =
  'https://cdn.jsdelivr.net/gh/yyint9794-bot/football-9mix@main/public/app-version.json';

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
}

function versionSources(): string[] {
  const base = [
    'https://ballpwal.org/api/app-version',
    JS_DELIVR,
    GITHUB_RAW,
    'https://ballpwal.org/app-version.json',
  ];

  if (typeof window !== 'undefined' && window.location.origin) {
    base.push(`${window.location.origin}/app-version.json`);
    base.push(`${window.location.origin}/api/app-version`);
  }

  return [...new Set(base.map(withCacheBust))];
}

function publishedFallback(): AppVersionInfo {
  return {
    versionCode: PUBLISHED_VERSION_CODE,
    versionName: PUBLISHED_VERSION_NAME,
    apkUrl: PUBLISHED_APK_URL,
    releaseNotes: PUBLISHED_RELEASE_NOTES,
  };
}

async function fetchOneVersion(url: string): Promise<AppVersionInfo | null> {
  const response = await fetch(url, {
    cache: 'no-store',
    headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' },
  });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as AppVersionInfo;
  if (!data?.versionCode || data.versionCode < 1) {
    return null;
  }
  return {
    ...data,
    apkUrl: data.apkUrlCdn || data.apkUrl || PUBLISHED_APK_URL,
  };
}

/** အင်တာနက်မှ နံပါတ်အကြီးဆုံး + APK ထဲ ဗားရှင်း */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  let best: AppVersionInfo | null = null;

  for (const url of versionSources()) {
    try {
      const data = await fetchOneVersion(url);
      if (data && (!best || data.versionCode > best.versionCode)) {
        best = data;
      }
    } catch {
      // try next
    }
  }

  const published = publishedFallback();
  if (!best || published.versionCode > best.versionCode) {
    return published;
  }

  return {
    ...best,
    versionCode: Math.max(best.versionCode, published.versionCode),
    apkUrl: best.apkUrlCdn || best.apkUrl || PUBLISHED_APK_URL,
  };
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

export async function installAppUpdate(apkUrl: string) {
  const url = apkUrl || PUBLISHED_APK_URL;

  if (!Capacitor.isNativePlatform()) {
    const { triggerApkDownload } = await import('../appDownload');
    await triggerApkDownload();
    return;
  }

  try {
    await AppUpdateNative.installApk({ url });
  } catch {
    window.location.href = url;
  }
}
