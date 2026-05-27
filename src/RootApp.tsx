import { Capacitor } from '@capacitor/core';
import App from './App';
import { AdminWebPage } from './AdminWebPage';
import { AdsenseProvider, isAdsAllowedPath } from './ads';
import { BetWebPage } from './BetWebPage';
import { MobileApp } from './mobile/MobileApp';
import { isMobileAppPath } from './mobile/mobileNav';
import { PrivacyPage } from './PrivacyPage';
import { getAppPath } from './navigation';

function shouldShowMobileShell(path: string) {
  if (Capacitor.isNativePlatform()) {
    return true;
  }
  return isMobileAppPath(path);
}

export function RootApp() {
  const path = getAppPath();
  const adsEnabled = isAdsAllowedPath(path);

  return (
    <AdsenseProvider enabled={adsEnabled}>
      {shouldShowMobileShell(path) ? (
        <MobileApp />
      ) : path === '/admin' ? (
        <AdminWebPage />
      ) : path === '/bet' ? (
        <BetWebPage />
      ) : path === '/privacy' ? (
        <PrivacyPage />
      ) : (
        <App />
      )}
    </AdsenseProvider>
  );
}
