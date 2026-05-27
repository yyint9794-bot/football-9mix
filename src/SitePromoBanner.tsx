import type { SiteBannerSlot } from './siteSettings';
import { useSiteSettings } from './SiteSettingsProvider';

type SitePromoBannerProps = {
  slot: SiteBannerSlot;
  className?: string;
};

export function SitePromoBanner({ slot, className = '' }: SitePromoBannerProps) {
  const settings = useSiteSettings();
  const banner = settings?.banners?.[slot];

  if (!banner?.enabled || !banner.imageUrl) {
    return null;
  }

  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.alt || 'ကြော်ငြာ'}
      className="site-promo-banner-img"
      loading="lazy"
      decoding="async"
    />
  );

  return (
    <div className={`site-promo-banner ${className}`.trim()}>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
