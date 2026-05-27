import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { fetchSiteSettings } from './wallet/api';
import { notifySiteSettingsUpdated, type SiteSettings } from './siteSettings';

const SiteSettingsContext = createContext<SiteSettings | null>(null);

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings | null>(null);

  const load = () => {
    void fetchSiteSettings()
      .then(setSettings)
      .catch(() => setSettings(null));
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const onRefresh = () => load();
    window.addEventListener('site-settings-updated', onRefresh);
    return () => window.removeEventListener('site-settings-updated', onRefresh);
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
