import { registerPlugin } from '@capacitor/core';

export type AppUpdateNativePlugin = {
  getVersionCode(): Promise<{ code: number; name: string }>;
  installApk(options: { url: string }): Promise<{ ok: boolean }>;
};

export const NativeAppUpdate = registerPlugin<AppUpdateNativePlugin>('AppUpdate');
