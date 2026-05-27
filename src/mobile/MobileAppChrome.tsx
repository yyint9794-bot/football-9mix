import type { ReactNode } from 'react';
import { SiteAnnouncementBar } from '../SiteAnnouncementBar';
import { SitePromoBanner } from '../SitePromoBanner';

/** Admin Web ဆက်တင် — App တစ်ခုလုံးတွင် ကြော်ငြာ + Banner */
export function MobileAppChrome({ children }: { children: ReactNode }) {
  return (
    <>
      <SitePromoBanner slot="user" className="bet-user-top-banner m-app-promo" />
      <SiteAnnouncementBar slot="web" />
      <SiteAnnouncementBar slot="bet" />
      {children}
    </>
  );
}
