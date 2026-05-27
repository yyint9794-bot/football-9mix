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

export async function fetchLatestAppVersion(): Promise<AppVersionInfo | null> {
  try {
    const url = Capacitor.isNativePlatform()
      ? 'https://ballpwal.org/app-version.json'
      : `${typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://ballpwal.org'}/app-version.json`;
    const response = await fetch(url, { cache: 'no-store' });
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
