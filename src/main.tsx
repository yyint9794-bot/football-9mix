import React from 'react';
import ReactDOM from 'react-dom/client';
import { RootApp } from './RootApp';
import { AuthProvider } from './wallet/AuthContext';
import './styles.css';

const rootElement = document.getElementById('root');

function showBootError(message: string) {
  if (!rootElement) {
    return;
  }
  rootElement.innerHTML = `<p style="margin:2rem 1rem;font-family:system-ui,sans-serif;color:#b91c1c;text-align:center;line-height:1.6">${message}</p>`;
}

if (!rootElement) {
  throw new Error('Root element not found');
}

try {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </React.StrictMode>,
  );
} catch (error) {
  const detail = error instanceof Error ? error.message : 'အမည်မသိ အမှား';
  showBootError(`App မဖွင့်နိုင်ပါ — ${detail}<br><br>Cache ရှင်းပြီး refresh လုပ်ကြည့်ပါ။`);
}

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

if ('serviceWorker' in navigator) {
  if (isPhoneTestHost()) {
    void navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        void registration.unregister();
      }
    });
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // The app still works without offline support.
      });
    });
  }
}
