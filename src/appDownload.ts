/** APK — ballpwal.org/downloads (Cloudflare R2, GitHub မသုံး) */
export const APP_APK_VERSION = 11;
export const APP_APK_FILENAME = `9mix-football-v11.apk`;
const APK_URL = `https://ballpwal.org/downloads/9mix-football-v11.apk`;
export const APP_APK_CDN_URL = APK_URL;
export const APP_APK_BUILD = `v11`;

export function resolveAppDownloadHref() {
  return `${APK_URL}?cb=${Date.now()}`;
}

export function isAndroidDevice() {
  return /android/i.test(navigator.userAgent);
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export function shouldDownloadApkFile() {
  return true;
}

export async function triggerApkDownload() {
  if (isIosDevice()) {
    window.location.href = '/app';
    return;
  }
  window.location.assign(resolveAppDownloadHref());
}
