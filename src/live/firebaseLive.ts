import { getFirebaseFirestore } from '../native/firebaseApp';

export async function getLiveFirestore() {
  return getFirebaseFirestore();
}
