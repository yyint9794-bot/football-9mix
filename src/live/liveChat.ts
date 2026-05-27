import {
  addDoc,
  collection,
  doc,
  limit,
  onSnapshot,
  query,
  setDoc,
  type Timestamp,
} from 'firebase/firestore';
import { extractFixtureId } from '../matchExtras';
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

function slugTeam(name: string) {
  return (
    name
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\u1000-\u109f]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 32) || 'team'
  );
}

function pairRoomKey(match: Match) {
  const home = slugTeam(String(match.homeTeam?.name || 'home'));
  const away = slugTeam(String(match.awayTeam?.name || 'away'));
  const [a, b] = home <= away ? [home, away] : [away, home];
  return `pair-${a}-vs-${b}`;
}

/** App/Web တစ်ခုတည်း room — fixture သို့မဟုတ် င်းအမည် pair (စာပို့/မြင်ရ တူညီအောင်) */
export function getMatchChatRoomId(match: Match) {
  const fixture = extractFixtureId(match);
  if (fixture) {
    return `fixture-${fixture}`;
  }

  for (const raw of [match.id, match.matchId, match.fixture_id]) {
    const id = String(raw ?? '').trim();
    if (!id || id === '0' || id === 'undefined') {
      continue;
    }
    const numeric = id.match(/(\d{4,})/)?.[1];
    if (numeric) {
      return `fixture-${numeric}`;
    }
  }

  return pairRoomKey(match);
}

export function getMatchChatRoomLabel(match: Match) {
  return getMatchChatRoomId(match);
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

function sortMessages(list: LiveChatMessage[]) {
  return [...list].sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));
}

export function subscribeLiveChat(
  roomId: string,
  onMessages: (messages: LiveChatMessage[]) => void,
  onError?: (message: string) => void,
) {
  let cancelled = false;
  let unsubscribe = () => {};

  void (async () => {
    const firestore = await getLiveFirestore();
    if (cancelled) {
      return;
    }
    if (!firestore) {
      onError?.('Chat မရသေးပါ — Firebase config စစ်ပါ');
      return;
    }

    const q = query(collection(firestore, 'live_rooms', roomId, 'messages'), limit(200));

    unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (cancelled) {
          return;
        }
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
        onMessages(sortMessages(list));
      },
      (err) => {
        if (!cancelled) {
          onError?.(err.message || 'Chat ချိတ်ဆက်မှု မအောင်မြင်ပါ');
        }
      },
    );
  })();

  return () => {
    cancelled = true;
    unsubscribe();
  };
}

export async function sendLiveChatMessage(
  roomId: string,
  text: string,
  displayName: string,
): Promise<number> {
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

  const createdAt = Date.now();
  await setDoc(
    doc(firestore, 'live_rooms', roomId),
    { updatedAt: createdAt, title: roomId },
    { merge: true },
  );
  await addDoc(collection(firestore, 'live_rooms', roomId, 'messages'), {
    userId: getChatUserId(),
    displayName: name,
    text: trimmed,
    createdAt,
  });
  return createdAt;
}
