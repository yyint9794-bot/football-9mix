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

let cachedInstalledBuild = 0;

export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const origin =
      typeof window !== 'undefined' && window.location.origin
        ? window.location.origin
        : 'https://ballpwal.org';
    const response = await fetch(`${origin}/app-version.json`, { cache: 'no-store' });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as AppVersionInfo;
  } catch {
    return null;
  }
}

export async function getInstalledVersionCode(): Promise<number> {
  if (!Capacitor.isNativePlatform()) {
    return 0;
  }

  if (cachedInstalledBuild > 0) {
    return cachedInstalledBuild;
  }

  try {
    const { App } = await import('@capacitor/app');
    const info = await App.getInfo();
    const build = Number(info.build);
    if (Number.isFinite(build) && build > 0) {
      cachedInstalledBuild = build;
      return build;
    }
    return cachedInstalledBuild;
  } catch {
    return cachedInstalledBuild;
  }
}

/** Install ပြီးပြီး app ပြန်ဖွင့်တဲ့အခါ build နံပါတ် ပြန် ဖတ်ရန် */
export function clearInstalledVersionCache() {
  cachedInstalledBuild = 0;
}

export async function installAppUpdate(apkUrl: string) {
  if (!Capacitor.isNativePlatform()) {
    const { triggerApkDownload } = await import('../appDownload');
    await triggerApkDownload();
    return;
  }

  await AppUpdateNative.installApk({ url: apkUrl });
}
