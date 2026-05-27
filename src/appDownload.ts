/** APK hosted on site after `npm run android:apk` */
export const APP_APK_URL = '/downloads/9mix-football.apk';
export const APP_APK_FILENAME = '9mix-football.apk';

export function isAndroidDevice() {
  return /android/i.test(navigator.userAgent);
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

/** Android → APK file; iOS / desktop → mobile web app */
export function resolveAppDownloadHref() {
  if (isAndroidDevice()) {
    return APP_APK_URL;
  }
  return '/app';
}

export function shouldDownloadApkFile() {
  return isAndroidDevice();
}
