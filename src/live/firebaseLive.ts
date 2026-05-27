import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { loadFirebaseWebConfig } from '../native/firebaseConfig';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export async function getLiveFirestore(): Promise<Firestore | null> {
  if (db) {
    return db;
  }

  const config = await loadFirebaseWebConfig();
  if (!config) {
    return null;
  }

  const { enabled: _enabled, ...options } = config;
  app = initializeApp(options, 'live-chat');
  db = getFirestore(app);
  return db;
}
