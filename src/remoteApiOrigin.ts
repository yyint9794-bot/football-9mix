import { Capacitor } from '@capacitor/core';

/** Native APK / offline bundle — Pages API ကို ballpwal.org မှ ခေါ် */
export function remoteApiOrigin() {
  const configured = String(import.meta.env.VITE_API_ORIGIN || '').trim();
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  if (Capacitor.isNativePlatform()) {
    return 'https://ballpwal.org';
  }

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    const isLocal =
      host === 'localhost' ||
      host === '127.0.0.1' ||
      /^\d+\.\d+\.\d+\.\d+$/.test(host);
    if (isLocal) {
      return window.location.origin;
    }
    return window.location.origin;
  }

  return 'https://ballpwal.org';
}
