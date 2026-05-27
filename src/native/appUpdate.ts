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

const VERSION_SOURCES = [
  'https://ballpwal.org/api/app-version',
  'https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/app-version.json',
  'https://ballpwal.org/app-version.json',
];

function versionUrls(): string[] {
  const urls = [...VERSION_SOURCES];
  if (typeof window !== 'undefined' && window.location.origin) {
    urls.push(`${window.location.origin}/app-version.json`);
    urls.push(`${window.location.origin}/api/app-version`);
  }
  return [...new Set(urls)];
}

async function fetchOneVersion(url: string): Promise<AppVersionInfo | null> {
  const response = await fetch(url, { cache: 'no-store' });
  if (!response.ok) {
    return null;
  }
  const data = (await response.json()) as AppVersionInfo;
  if (!data?.versionCode || data.versionCode < 1) {
    return null;
  }
  return data;
}

/** Server API + GitHub + static — နံပါတ်အကြီးဆုံး */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  let best: AppVersionInfo | null = null;

  for (const url of versionUrls()) {
    try {
      const data = await fetchOneVersion(url);
      if (data && (!best || data.versionCode > best.versionCode)) {
        best = data;
      }
    } catch {
      // try next
    }
  }

  if (best) {
    return best;
  }

  for (const url of VERSION_SOURCES) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        await new Promise((resolve) => window.setTimeout(resolve, 600 * (attempt + 1)));
        const data = await fetchOneVersion(url);
        if (data) {
          return data;
        }
      } catch {
        // retry
      }
    }
  }

  return null;
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
