import { useCallback, useEffect, useState } from 'react';
import { getAppPath } from '../navigation';
import { useAuth } from '../wallet/AuthContext';
import type { Match } from '../types';
import { MobileAppChrome } from './MobileAppChrome';
import { MobileBetScreen } from './MobileBetScreen';
import { MobileFinishedScreen } from './MobileFinishedScreen';
import { MobileHomeScreen } from './MobileHomeScreen';
import { MobileLiveScreen } from './MobileLiveScreen';
import { MobileWalletScreen } from './MobileWalletScreen';
import { MobileWatchScreen } from './MobileWatchScreen';
import { getMobileTabFromPath, navigateMobileTab, type MobileTab } from './mobileNav';
import { useMatchesFeed } from './useMatchesFeed';
import './mobile.css';

const TABS: Array<{ id: MobileTab; label: string; icon: string }> = [
  { id: 'home', label: 'ပင်မ', icon: '⌂' },
  { id: 'live', label: 'တိုက်ရိုက်ကြည့်ရန်', icon: '▶' },
  { id: 'finished', label: 'ပြီးခဲ့', icon: '✓' },
  { id: 'bet', label: '9Mix', icon: '⚽' },
  { id: 'wallet', label: 'ငွေ', icon: '◉' },
];

export function MobileApp() {
  const { user } = useAuth();
  const [tab, setTab] = useState<MobileTab>(() => getMobileTabFromPath(getAppPath()));
  const [playingMatch, setPlayingMatch] = useState<Match | null>(null);
  const { matches, loading, error, refresh } = useMatchesFeed();
  const hideTabBar = tab === 'bet' && Boolean(user);

  const syncTabFromUrl = useCallback(() => {
    setTab(getMobileTabFromPath(getAppPath()));
  }, []);

  useEffect(() => {
    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, [syncTabFromUrl]);

  useEffect(() => {
    const manifest = document.querySelector('link[rel="manifest"]');
    const previous = manifest?.getAttribute('href') ?? '/manifest.webmanifest';
    manifest?.setAttribute('href', '/manifest-app.webmanifest');
    document.documentElement.classList.add('mobile-app-mode');
    return () => {
      manifest?.setAttribute('href', previous);
      document.documentElement.classList.remove('mobile-app-mode');
    };
  }, []);

  const selectTab = (next: MobileTab) => {
    setTab(next);
    navigateMobileTab(next);
  };

  if (playingMatch) {
    return (
      <div className="mobile-app">
        <MobileWatchScreen match={playingMatch} onClose={() => setPlayingMatch(null)} />
      </div>
    );
  }

  return (
    <div className="mobile-app">
      <MobileAppChrome>
        <main className="m-app-main">
          {tab === 'home' ? (
            <MobileHomeScreen
              matches={matches}
              loading={loading}
              error={error}
              onWatch={setPlayingMatch}
              onBet={() => selectTab('bet')}
              onRefresh={() => void refresh()}
            />
          ) : null}
          {tab === 'live' ? (
            <MobileLiveScreen matches={matches} loading={loading} onWatch={setPlayingMatch} />
          ) : null}
          {tab === 'finished' ? <MobileFinishedScreen /> : null}
          {tab === 'bet' ? <MobileBetScreen onBack={() => selectTab('home')} /> : null}
          {tab === 'wallet' ? <MobileWalletScreen /> : null}
        </main>

        <nav className={hideTabBar ? 'm-tab-bar is-hidden' : 'm-tab-bar'} aria-label="Mobile navigation">
          {TABS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'm-tab active' : 'm-tab'}
              onClick={() => selectTab(item.id)}
            >
              <span className="m-tab-icon">{item.icon}</span>
              <span className="m-tab-label">{item.label}</span>
            </button>
          ))}
        </nav>
      </MobileAppChrome>
    </div>
  );
}
