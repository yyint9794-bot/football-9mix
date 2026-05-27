/** APK — GitHub main (jsDelivr). Site deploy ဟောင်းဖြစ်ရင်လည်း အသစ် ရမည် */
export const APP_APK_CDN_URL =
  'https://cdn.jsdelivr.net/gh/yyint9794-bot/football-9mix@main/public/downloads/9mix-football.apk';
export const APP_APK_BUILD = 'v8';
export const APP_APK_FILENAME = '9mix-football.apk';

/** Cache bust — ballpwal.org static APK ဟောင်းမသုံးအောင် CDN ဦးစား */
export function resolveAppDownloadHref() {
  return `${APP_APK_CDN_URL}?v=${APP_APK_BUILD}`;
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

const APK_FETCH_URLS = () => [
  `${APP_APK_CDN_URL}?v=${APP_APK_BUILD}&cb=${Date.now()}`,
  `https://raw.githubusercontent.com/yyint9794-bot/football-9mix/main/public/downloads/9mix-football.apk?cb=${Date.now()}`,
  `/downloads/9mix-football.apk?v=${APP_APK_BUILD}&cb=${Date.now()}`,
];

export async function triggerApkDownload() {
  if (isIosDevice()) {
    window.location.href = '/app';
    return;
  }

  for (const url of APK_FETCH_URLS()) {
    try {
      const response = await fetch(url, { cache: 'no-store', mode: 'cors' });
      if (!response.ok) continue;
      const blob = await response.blob();
      if (blob.size < 1_000_000) continue;
      const objectUrl = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = objectUrl;
      anchor.download = APP_APK_FILENAME;
      anchor.rel = 'noopener';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
      return;
    } catch {
      /* try next mirror */
    }
  }

  window.location.href = resolveAppDownloadHref();
}
