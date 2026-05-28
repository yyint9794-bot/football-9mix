import type { ReactNode } from 'react';
import { SiteAnnouncementBar } from './SiteAnnouncementBar';
import { SitePromoBanner } from './SitePromoBanner';

type BettingChromeProps = {
  children: ReactNode;
  /** App (MobileAppChrome) မှာ promo ထပ်မပြရ — ကြော်ငြာ ၂ ခု မဖြစ်အောင် */
  showPromo?: boolean;
};

/** User ဝင်ပြီးနောက် လောင်းကွင်း အပေါ်ဆုံး — Banner + ကြော်ငြာစာ */
export function BettingChrome({ children, showPromo = true }: BettingChromeProps) {
  return (
    <>
      {showPromo ? <SitePromoBanner slot="user" className="bet-user-top-banner" /> : null}
      <SiteAnnouncementBar slot="bet" />
      {children}
    </>
  );
}
