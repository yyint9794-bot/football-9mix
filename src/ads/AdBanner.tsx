import { useEffect, useRef } from 'react';
import { loadAdsenseScript, pushAdSlot } from './adsense';
import { ADSENSE_CLIENT, isAdsEnabled, isSlotConfigured } from './config';

type AdBannerProps = {
  slot: string;
  label?: string;
  compact?: boolean;
  variant?: 'light' | 'dark';
  className?: string;
};

export function AdBanner({
  slot,
  label = 'ကြော်ငြာ',
  compact = false,
  variant = 'light',
  className = '',
}: AdBannerProps) {
  const pushed = useRef(false);
  const enabled = isAdsEnabled() && isSlotConfigured(slot);

  useEffect(() => {
    if (!enabled || pushed.current) {
      return;
    }

    let cancelled = false;

    void loadAdsenseScript(ADSENSE_CLIENT)
      .then(() => {
        if (cancelled || pushed.current) {
          return;
        }
        pushAdSlot();
        pushed.current = true;
      })
      .catch(() => {
        // AdSense blocked — skip unit.
      });

    return () => {
      cancelled = true;
    };
  }, [enabled, slot]);

  const cardClass = [
    'ad-card',
    compact ? 'compact' : '',
    variant === 'dark' ? 'dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (!enabled) {
    return null;
  }

  return (
    <aside className={cardClass} aria-label={label}>
      <span className="ad-label">{label}</span>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </aside>
  );
}
