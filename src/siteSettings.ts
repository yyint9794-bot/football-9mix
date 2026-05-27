export type SiteBannerSlot = 'web' | 'user';

export type AnnouncementSlot = 'web' | 'bet';

export type SiteBanner = {
  imageUrl: string;
  linkUrl: string;
  enabled: boolean;
  alt: string;
};

export type SiteAnnouncement = {
  text: string;
  enabled: boolean;
};

export type SiteSettings = {
  payment: {
    kbz: { number: string; label: string };
    wave: { number: string; label: string };
  };
  announcements: Record<AnnouncementSlot, SiteAnnouncement>;
  banners: Record<SiteBannerSlot, SiteBanner>;
};

export function notifySiteSettingsUpdated() {
  window.dispatchEvent(new Event('site-settings-updated'));
}
