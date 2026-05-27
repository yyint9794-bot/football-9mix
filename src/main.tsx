import { Capacitor } from '@capacitor/core';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RootApp } from './RootApp';
import { SiteSettingsProvider } from './SiteSettingsProvider';
import { AuthProvider } from './wallet/AuthContext';
import './styles.css';

const rootElement = document.getElementById('root');

function showBootError(message: string) {
  if (!rootElement) {
    return;
  }
  rootElement.innerHTML = `<p style="margin:2rem 1rem;font-family:system-ui,sans-serif;color:#b91c1c;text-align:center;line-height:1.6">${message}</p>`;
}

function clearStaleServiceWorkers() {
  if (!('serviceWorker' in navigator)) {
    return Promise.resolve();
  }
  return navigator.serviceWorker.getRegistrations().then((registrations) =>
    Promise.all(registrations.map((registration) => registration.unregister())),
  );
}

if (!rootElement) {
  throw new Error('Root element not found');
}

window.addEventListener('error', (event) => {
  const detail = event.message || 'JavaScript error';
  showBootError(
    `App မဖွင့်နိုင်ပါ — ${detail}<br><br>Chrome: Settings → Site data → Clear → ပြန် refresh`,
  );
});

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const detail = reason instanceof Error ? reason.message : String(reason);
  if (Capacitor.isNativePlatform() && detail.includes('AdSense')) {
    event.preventDefault();
    return;
  }
  showBootError(`App မဖွင့်နိုင်ပါ — ${detail}<br><br>Cache ရှင်းပြီး refresh လုပ်ပါ`);
});

const appTree = (
  <AuthProvider>
    <SiteSettingsProvider>
      <RootApp />
    </SiteSettingsProvider>
  </AuthProvider>
);

void clearStaleServiceWorkers().finally(() => {
  try {
    ReactDOM.createRoot(rootElement).render(
      Capacitor.isNativePlatform() ? appTree : <React.StrictMode>{appTree}</React.StrictMode>,
    );
  } catch (error) {
    const detail = error instanceof Error ? error.message : 'အမည်မသိ အမှား';
    showBootError(`App မဖွင့်နိုင်ပါ — ${detail}<br><br>Cache ရှင်းပြီး refresh လုပ်ပါ`);
  }
});

function isPhoneTestHost() {
  const host = window.location.hostname;
  return (
    host === 'localhost' ||
    host === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host) ||
    host.endsWith('.loca.lt') ||
    host.endsWith('.trycloudflare.com') ||
    host.includes('ngrok')
  );
}

if ('serviceWorker' in navigator && !isPhoneTestHost() && !Capacitor.isNativePlatform()) {
  window.addEventListener('load', () => {
    void navigator.serviceWorker.register('/sw.js').catch(() => {
      // Offline image cache is optional.
    });
  });
}
