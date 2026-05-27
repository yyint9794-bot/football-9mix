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

const FETCH_MS = 4500;

export function isAppUpdatePluginAvailable() {
  return Capacitor.isNativePlatform() && Capacitor.isPluginAvailable('AppUpdate');
}

async function openApkDownload(url: string) {
  try {
    const { Browser } = await import('@capacitor/browser');
    await Browser.open({ url });
    return;
  } catch {
    // Browser plugin missing
  }
  window.location.href = url;
}

const GITHUB_RAW =
  'https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/app-version.json';
const JS_DELIVR =
  'https://cdn.jsdelivr.net/gh/yyint9794-bot/football-9mix@main/public/app-version.json';

function withCacheBust(url: string) {
  const sep = url.includes('?') ? '&' : '?';
  return `${url}${sep}cb=${Date.now()}`;
}

function versionSources(): string[] {
  const base = [JS_DELIVR, GITHUB_RAW, 'https://ballpwal.org/app-version.json'];
  if (!Capacitor.isNativePlatform() && typeof window !== 'undefined' && window.location.origin) {
    const o = window.location.origin;
    if (!/localhost|capacitor/i.test(o)) {
      base.push(`${o}/app-version.json`);
    }
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
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), FETCH_MS);
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
      apkUrl: data.apkUrlCdn || data.apkUrl || PUBLISHED_APK_URL,
    };
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

/** အင်တာနက်မှ နံပါတ်အကြီးဆုံး + APK ထဲ ဗားရှင်း (ချက်ချင်း fallback) */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo> {
  const published = publishedFallback();
  const results = await Promise.all(versionSources().map((url) => fetchOneVersion(url)));

  let best: AppVersionInfo | null = null;
  for (const data of results) {
    if (data && (!best || data.versionCode > best.versionCode)) {
      best = data;
    }
  }

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

  if (!isAppUpdatePluginAvailable()) {
    await openApkDownload(url);
    return;
  }

  try {
    await AppUpdateNative.installApk({ url });
  } catch {
    await openApkDownload(url);
  }
}
