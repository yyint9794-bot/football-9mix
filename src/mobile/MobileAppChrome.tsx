import type { ReactNode } from 'react';
import { SiteAnnouncementBar } from '../SiteAnnouncementBar';
import { SitePromoBanner } from '../SitePromoBanner';

type MobileAppChromeProps = {
  children: ReactNode;
  /** လောင်းမျက်နှာ — ကြော်ငြာပုံ မထပ်ပြရ */
  showPromo?: boolean;
};

/** Admin Web ဆက်တင် — App တစ်ခုလုံးတွင် ကြော်ငြာ + Banner */
export function MobileAppChrome({ children, showPromo = true }: MobileAppChromeProps) {
  return (
    <>
      {showPromo ? (
        <SitePromoBanner slot="user" className="bet-user-top-banner m-app-promo" />
      ) : null}
      {showPromo ? <SiteAnnouncementBar slot="web" /> : null}
      <SiteAnnouncementBar slot="bet" />
      {children}
    </>
  );
}
