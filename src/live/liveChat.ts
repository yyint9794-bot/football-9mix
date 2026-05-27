import {
  addDoc,
  collection,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore';
import type { Match } from '../types';
import { getLiveFirestore } from './firebaseLive';

export type LiveChatMessage = {
  id: string;
  roomId: string;
  userId: string;
  displayName: string;
  text: string;
  createdAt: number;
};

const NAME_KEY = 'ballpwal-chat-display-name';
const USER_KEY = 'ballpwal-chat-user-id';

export function getMatchChatRoomId(match: Match) {
  const id = String(match.id || '').trim();
  if (id) {
    return `match-${id}`;
  }
  const home = String(match.homeTeam?.name || 'home').slice(0, 24);
  const away = String(match.awayTeam?.name || 'away').slice(0, 24);
  return `match-${home}-${away}`.replace(/\s+/g, '-').toLowerCase();
}

export function getChatUserId() {
  try {
    let id = localStorage.getItem(USER_KEY);
    if (!id) {
      id = `u_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(-4)}`;
      localStorage.setItem(USER_KEY, id);
    }
    return id;
  } catch {
    return `u_${Date.now()}`;
  }
}

export function getChatDisplayName() {
  try {
    return localStorage.getItem(NAME_KEY)?.trim() || '';
  } catch {
    return '';
  }
}

export function saveChatDisplayName(name: string) {
  const trimmed = name.trim().slice(0, 24);
  if (!trimmed) {
    return;
  }
  try {
    localStorage.setItem(NAME_KEY, trimmed);
  } catch {
    // ignore
  }
}

function tsToMs(value: Timestamp | number | null | undefined) {
  if (!value) {
    return Date.now();
  }
  if (typeof value === 'number') {
    return value;
  }
  return value.toMillis?.() ?? Date.now();
}

export function subscribeLiveChat(
  roomId: string,
  onMessages: (messages: LiveChatMessage[]) => void,
  onError?: (message: string) => void,
) {
  let unsubscribe = () => {};

  void (async () => {
    const firestore = await getLiveFirestore();
    if (!firestore) {
      onError?.('Chat မရသေးပါ — Firebase config စစ်ပါ');
      return;
    }

    const q = query(
      collection(firestore, 'live_rooms', roomId, 'messages'),
      orderBy('createdAt', 'asc'),
      limit(200),
    );

    unsubscribe = onSnapshot(
      q,
      (snap) => {
        const list: LiveChatMessage[] = snap.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            roomId,
            userId: String(data.userId || ''),
            displayName: String(data.displayName || 'Guest'),
            text: String(data.text || ''),
            createdAt: tsToMs(data.createdAt as Timestamp | number),
          };
        });
        onMessages(list);
      },
      (err) => {
        onError?.(err.message || 'Chat ချိတ်ဆက်မှု မအောင်မြင်ပါ');
      },
    );
  })();

  return () => unsubscribe();
}

export async function sendLiveChatMessage(roomId: string, text: string, displayName: string) {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 400) {
    throw new Error('စာသား မမှန်ပါ');
  }

  const firestore = await getLiveFirestore();
  if (!firestore) {
    throw new Error('Firebase မချိတ်ရသေးပါ');
  }

  const name = displayName.trim().slice(0, 24) || 'Guest';
  saveChatDisplayName(name);

  await addDoc(collection(firestore, 'live_rooms', roomId, 'messages'), {
    userId: getChatUserId(),
    displayName: name,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}
