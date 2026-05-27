import App from './App';
import { AdminWebPage } from './AdminWebPage';
import { AdsenseProvider, isAdsAllowedPath } from './ads';
import { BetWebPage } from './BetWebPage';
import { PrivacyPage } from './PrivacyPage';
import { getAppPath } from './navigation';

export function RootApp() {
  const path = getAppPath();
  const adsEnabled = isAdsAllowedPath(path);

  return (
    <AdsenseProvider enabled={adsEnabled}>
      {path === '/admin' ? (
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
