import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import App from './App';
import { AdminWebPage } from './AdminWebPage';
import { AdsenseProvider, isAdsAllowedPath } from './ads';
import { BetWebPage } from './BetWebPage';
import { AppUpdateGate } from './mobile/AppUpdateGate';
import { MobileApp } from './mobile/MobileApp';
import { isMobileAppPath, mobileTabToPath } from './mobile/mobileNav';
import { PrivacyPage } from './PrivacyPage';
import { getAppPath } from './navigation';

export function RootApp() {
  const path = getAppPath();
  const nativeApp = Capacitor.isNativePlatform();
  const adsEnabled = isAdsAllowedPath(path) && !nativeApp;
  const showMobileShell = nativeApp || isMobileAppPath(path);

  useEffect(() => {
    if (!nativeApp) {
      return;
    }

    if (!isMobileAppPath(path)) {
      window.location.replace(mobileTabToPath('home'));
    }
  }, [nativeApp, path]);

  return (
    <AdsenseProvider enabled={adsEnabled}>
      {showMobileShell ? (
        <AppUpdateGate>
          <MobileApp />
        </AppUpdateGate>
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
