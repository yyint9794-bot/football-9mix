import { createContext, useContext, type ReactNode } from 'react';

type BettingShellContextValue = {
  /** MobileAppChrome / BetWebPage က promo ကိုယ်တိုင်ပြပြီး — BettingChrome ထပ်မပြရ */
  promoHandledByParent: boolean;
};

const BettingShellContext = createContext<BettingShellContextValue>({
  promoHandledByParent: false,
});

export function BettingShellProvider({
  promoHandledByParent,
  children,
}: {
  promoHandledByParent: boolean;
  children: ReactNode;
}) {
  return (
    <BettingShellContext.Provider value={{ promoHandledByParent }}>
      {children}
    </BettingShellContext.Provider>
  );
}

export function useBettingShell() {
  return useContext(BettingShellContext);
}
