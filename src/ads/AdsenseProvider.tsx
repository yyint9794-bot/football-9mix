import { useEffect, type ReactNode } from 'react';
import { initGoogleAdsenseMonetization } from './initAdsense';

type AdsenseProviderProps = {
  children: ReactNode;
  /** Load AdSense script only when true (e.g. not on /bet). */
  enabled?: boolean;
};

export function AdsenseProvider({ children, enabled = true }: AdsenseProviderProps) {
  useEffect(() => {
    if (!enabled) {
      return;
    }
    initGoogleAdsenseMonetization();
  }, [enabled]);

  return children;
}
