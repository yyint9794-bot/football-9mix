import { ADSENSE_CLIENT, ADSENSE_VERIFICATION, isAdsEnabled } from './config';
import { loadAdsenseScript } from './adsense';

/** Loads official AdSense once per session — enables Auto ads + manual units. */
export function initGoogleAdsenseMonetization() {
  if (!isAdsEnabled()) {
    return;
  }

  ensureMeta('google-adsense-account', ADSENSE_CLIENT);

  if (ADSENSE_VERIFICATION) {
    ensureMeta('google-site-verification', ADSENSE_VERIFICATION);
  }

  void loadAdsenseScript(ADSENSE_CLIENT).catch(() => {
    // WebView / ad-block — app must still run (especially native APK).
  });
}

function ensureMeta(name: string, content: string) {
  if (!content || document.querySelector(`meta[name="${name}"]`)) {
    return;
  }

  const meta = document.createElement('meta');
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
}
