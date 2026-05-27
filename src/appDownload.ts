/** APK v9+ — versioned filename (cache ဟောင်း မရ) */
export const APP_APK_VERSION = 9;
export const APP_APK_FILENAME = `9mix-football-v${APP_APK_VERSION}.apk`;
const GH_APK = `https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/downloads/${APP_APK_FILENAME}`;
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

/** Chrome/Android — တိုက်ရိုက် ဒေါင်းလုဒ် (blob မသုံး — ဟောင်း cache မရ) */
export async function triggerApkDownload() {
  if (isIosDevice()) {
    window.location.href = '/app';
    return;
  }
  window.location.assign(resolveAppDownloadHref());
}
