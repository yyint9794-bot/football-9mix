import type { ReactNode } from 'react';
import { SiteAnnouncementBar } from './SiteAnnouncementBar';
import { SitePromoBanner } from './SitePromoBanner';

/** User ဝင်ပြီးနောက် လောင်းကွင်း အပေါ်ဆုံး — Banner + ကြော်ငြာစာ */
export function BettingChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SitePromoBanner slot="user" className="bet-user-top-banner" />
      <SiteAnnouncementBar slot="bet" />
      {children}
    </>
  );
}
