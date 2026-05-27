const SCRIPT_ID = 'adsense-script';

let scriptPromise: Promise<void> | null = null;

export function loadAdsenseScript(client: string) {
  if (!client) {
    return Promise.resolve();
  }

  if (typeof window === 'undefined') {
    return Promise.resolve();
  }

  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve();
        return;
      }
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('AdSense script failed')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.async = true;
    script.crossOrigin = 'anonymous';
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client)}`;
    script.onload = () => {
      script.dataset.loaded = 'true';
      resolve();
    };
    script.onerror = () => reject(new Error('AdSense script failed'));
    document.head.appendChild(script);
  });

  return scriptPromise;
}

export function pushAdSlot() {
  try {
    const queue = (window.adsbygoogle = window.adsbygoogle ?? []) as unknown[];
    queue.push({});
  } catch {
    // Ad blockers or strict CSP may block pushes.
  }
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}
