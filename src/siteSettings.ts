export type SiteBannerSlot = 'web' | 'bet' | 'hub' | 'app';

export type SiteBanner = {
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
  alt: string;
};

export type SiteSettings = {
  payment: {
    kbz: { number: string; label: string };
    wave: { number: string; label: string };
  };
  announcement: {
    text: string;
    enabled: boolean;
  };
  banners: Record<SiteBannerSlot, SiteBanner>;
};

export function notifySiteSettingsUpdated() {
  window.dispatchEvent(new Event('site-settings-updated'));
}
