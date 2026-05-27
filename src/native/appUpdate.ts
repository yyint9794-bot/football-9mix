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
const REMOTE_VERSION_URL = 'https://ballpwal.org/app-version.json';

function versionUrls(): string[] {
  const urls = [REMOTE_VERSION_URL];
  if (typeof window !== 'undefined' && window.location.origin) {
    urls.push(`${window.location.origin}/app-version.json`);
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

/** Server + APK ထဲက app-version.json — နံပါတ်အကြီးဆုံးကို ယူ */
export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  let best: AppVersionInfo | null = null;

  for (const url of versionUrls()) {
    try {
      const data = await fetchOneVersion(url);
      if (data && (!best || data.versionCode > best.versionCode)) {
        best = data;
      }
    } catch {
      // try next source
    }
  }

  if (best) {
    return best;
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await new Promise((resolve) => window.setTimeout(resolve, 800 * (attempt + 1)));
      const data = await fetchOneVersion(REMOTE_VERSION_URL);
      if (data) {
        return data;
      }
    } catch {
      // retry
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
