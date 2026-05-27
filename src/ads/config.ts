/** Google AdSense publisher ID — ca-pub-xxxxxxxxxxxxxxxx (ငွေရှာရန် မဖြစ်မနေ) */
export const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT ?? '';

/** Search Console / AdSense site verification meta content (optional) */
export const ADSENSE_VERIFICATION = import.meta.env.VITE_ADSENSE_VERIFICATION ?? '';

export const AD_SLOTS = {
  top: import.meta.env.VITE_ADSENSE_SLOT_TOP ?? '',
  inline: import.meta.env.VITE_ADSENSE_SLOT_INLINE ?? '',
  bottom: import.meta.env.VITE_ADSENSE_SLOT_BOTTOM ?? '',
  bet: import.meta.env.VITE_ADSENSE_SLOT_BET ?? '',
  payment: import.meta.env.VITE_ADSENSE_SLOT_PAYMENT ?? '',
  live: import.meta.env.VITE_ADSENSE_SLOT_LIVE ?? '',
} as const;

export type AdSlotKey = keyof typeof AD_SLOTS;

export const VIDEO_AD_URL = import.meta.env.VITE_VIDEO_AD_URL ?? '';

export function isAdsEnabled() {
  return Boolean(ADSENSE_CLIENT?.trim());
}

/** Betting / admin screens — no ads (AdSense policy + UX). */
export function isAdsAllowedPath(path: string) {
  const normalized = path.replace(/\/+$/, '') || '/';
  if (normalized === '/bet' || normalized === '/admin') {
    return false;
  }
  if (normalized === '/app' || normalized.startsWith('/app/')) {
    return false;
  }
  return true;
}

export function isSlotConfigured(slot: string) {
  return Boolean(slot?.trim());
}

export function resolveAdSlot(key: AdSlotKey, fallback?: AdSlotKey) {
  const primary = AD_SLOTS[key];
  if (isSlotConfigured(primary)) {
    return primary;
  }
  if (fallback) {
    return AD_SLOTS[fallback];
  }
  return '';
}
