import type { AnnouncementSlot } from './siteSettings';
import { useSiteSettings } from './SiteSettingsProvider';

type SiteAnnouncementBarProps = {
  slot: AnnouncementSlot;
};

export function SiteAnnouncementBar({ slot }: SiteAnnouncementBarProps) {
  const settings = useSiteSettings();
  const announcement = settings?.announcements?.[slot];

  if (!announcement?.enabled || !announcement.text) {
    return null;
  }

  return (
    <div className="site-announcement" role="marquee" aria-live="polite">
      <div className="site-announcement-track">
        <span>{announcement.text}</span>
        <span aria-hidden>{announcement.text}</span>
      </div>
    </div>
  );
}
