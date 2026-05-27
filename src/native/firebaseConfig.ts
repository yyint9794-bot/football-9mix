import type { FirebaseOptions } from 'firebase/app';

export type FirebaseWebConfigFile = FirebaseOptions & {
  enabled?: boolean;
};

const ENV_KEYS = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID',
] as const;

function configFromEnv(): FirebaseWebConfigFile | null {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  if (!apiKey || !projectId) {
    return null;
  }

  return {
    enabled: true,
    apiKey,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };
}

/** ballpwal.org/firebase-config.json သို့မဟုတ် .env — Firebase Console Web app config */
export async function loadFirebaseWebConfig(): Promise<FirebaseWebConfigFile | null> {
  const fromEnv = configFromEnv();
  if (fromEnv) {
    return fromEnv;
  }

  const urls = [
    'https://ballpwal.org/firebase-config.json',
    '/firebase-config.json',
  ];

  for (const path of urls) {
    try {
      const response = await fetch(`${path}?cb=${Date.now()}`, { cache: 'no-store' });
      if (!response.ok) {
        continue;
      }
      const data = (await response.json()) as FirebaseWebConfigFile;
      if (data.enabled === false) {
        return null;
      }
      if (data.apiKey && data.projectId) {
        return data;
      }
    } catch {
      // try next
    }
  }

  return null;
}
