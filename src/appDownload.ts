/** APK — versioned filename (full bundle >=10MB) */
export const APP_APK_VERSION = 11;
export const APP_APK_FILENAME = `9mix-football-v11.apk`;
const GH_APK = `https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/downloads/9mix-football-v11.apk`;
export const APP_APK_CDN_URL = GH_APK;
export const APP_APK_BUILD = `v${APP_APK_VERSION}`;

export function resolveAppDownloadHref() {
  return `${GH_APK}?cb=${Date.now()}`;
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
