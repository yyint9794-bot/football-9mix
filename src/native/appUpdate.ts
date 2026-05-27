import { Capacitor, registerPlugin } from '@capacitor/core';

export type AppVersionInfo = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
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
    GITHUB_RAW,
    JS_DELIVR,
    'https://ballpwal.org/app-version.json',
  ];

  if (typeof window !== 'undefined' && window.location.origin) {
    base.push(`${window.location.origin}/app-version.json`);
    base.push(`${window.location.origin}/api/app-version`);
  }

  return [...new Set(base.map(withCacheBust))];
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
  return data;
}

/** ဗားရှင်း အများဆုံး နံပါတ်ကို ယူ (GitHub cache ဟောင်း မသုံး) */
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

  return best;
}

export async function getInstalledVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 0;
  }

  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const build = Number.parseInt(String(info.build), 10);
    return Number.isFinite(build) && build > 0 ? build : 0;
  } catch {
    return 0;
  }
}

export async function installAppUpdate(apkUrl: string) {
  if (!Capacitor.isNativePlatform()) {
    const { triggerApkDownload } = await import('../appDownload');
    await triggerApkDownload();
    return;
  }

  await AppUpdateNative.installApk({ url: apkUrl });
}
