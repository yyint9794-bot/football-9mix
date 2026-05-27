/** APK hosted on site after `npm run android:apk` — bump when rebuilding APK */
export const APP_APK_BUILD = 'v7';
export const APP_APK_URL = `/downloads/9mix-football.apk?v=${APP_APK_BUILD}`;
export const APP_APK_FILENAME = '9mix-football.apk';

export function isAndroidDevice() {
  return /android/i.test(navigator.userAgent);
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Home page download → real APK file (all platforms; install on Android). */
export function resolveAppDownloadHref() {
  return APP_APK_URL;
}

export function shouldDownloadApkFile() {
  return true;
}

export async function triggerApkDownload() {
  if (isIosDevice()) {
    window.location.href = '/app';
    return;
  }

  const response = await fetch(APP_APK_URL, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`APK မတွေ့ပါ (${response.status}) — Admin ထံ ဆက်သွယ်ပါ`);
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = APP_APK_FILENAME;
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 2000);
}
