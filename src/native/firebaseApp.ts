import { Capacitor } from '@capacitor/core';
import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';
import { loadFirebaseWebConfig } from './firebaseConfig';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export async function getFirebaseApp(): Promise<FirebaseApp | null> {
  if (app) {
    return app;
  }

  const config = await loadFirebaseWebConfig();
  if (!config) {
    return null;
  }

  const { enabled: _enabled, ...options } = config;
  const existing = getApps().find((item) => item.options.projectId === options.projectId);
  app = existing ?? initializeApp(options);
  return app;
}

/** Capacitor WebView — Firestore realtime အတွက် long polling */
export async function getFirebaseFirestore(): Promise<Firestore | null> {
  if (db) {
    return db;
  }

  const firebaseApp = await getFirebaseApp();
  if (!firebaseApp) {
    return null;
  }

  if (Capacitor.isNativePlatform()) {
    db = initializeFirestore(firebaseApp, {
      experimentalForceLongPolling: true,
    });
  } else {
    db = getFirestore(firebaseApp);
  }

  return db;
}
