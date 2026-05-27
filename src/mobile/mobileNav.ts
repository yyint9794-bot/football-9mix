export type MobileTab = 'home' | 'live' | 'finished' | 'bet' | 'wallet';

export function getMobileTabFromPath(path: string): MobileTab {
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/app' || normalized === '/app/home') {
    return 'home';
  }
  if (normalized === '/app/live') {
    return 'live';
  }
  if (normalized === '/app/finished') {
    return 'finished';
  }
  if (normalized === '/app/bet') {
    return 'bet';
  }
  if (normalized === '/app/wallet') {
    return 'wallet';
  }
  return 'home';
}

export function mobileTabToPath(tab: MobileTab) {
  if (tab === 'home') {
    return '/app';
  }
  return `/app/${tab}`;
}

export function navigateMobileTab(tab: MobileTab) {
  const next = mobileTabToPath(tab);
  if (window.location.pathname !== next) {
    window.history.pushState(null, '', next);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
}

export function isMobileAppPath(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/';
  return normalized === '/app' || normalized.startsWith('/app/');
}
