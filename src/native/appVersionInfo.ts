/** App update — တစ်ခုတည်းသော ဒေါင်းလုဒ်စာမျက်နှာ */
export const APP_DOWNLOAD_PAGE = 'https://ballpwal.org/apk.html';

export type AppVersionInfo = {
  versionCode: number;
  versionName: string;
  apkUrl: string;
  apkUrlSite?: string;
  releaseNotes?: string;
  forceUpdate?: boolean;
  minVersionCode?: number;
  source?: 'firebase' | 'json' | 'bundled';
};
