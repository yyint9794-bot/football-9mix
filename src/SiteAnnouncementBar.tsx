import { useSiteSettings } from './SiteSettingsProvider';

export function SiteAnnouncementBar() {
  const settings = useSiteSettings();
  const announcement = settings?.announcement;

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
