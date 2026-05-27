import type { WalletBet, WalletBetPick, WalletTransaction, WalletUser } from './types';

const TOKEN_KEY = 'mix9-auth-token';
const SAVED_USER_KEY = 'mix9-saved-username';
const SAVED_PASS_KEY = 'mix9-saved-password';

function getToken() {
  const stored = localStorage.getItem(TOKEN_KEY);
  if (stored) {
    return stored;
  }
  const legacy = sessionStorage.getItem(TOKEN_KEY);
  if (legacy) {
    localStorage.setItem(TOKEN_KEY, legacy);
    sessionStorage.removeItem(TOKEN_KEY);
    return legacy;
  }
  return '';
}

export function setAuthToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function saveLoginCredentials(username: string, password: string) {
  localStorage.setItem(SAVED_USER_KEY, username);
  localStorage.setItem(SAVED_PASS_KEY, password);
}

export function getSavedLoginCredentials() {
  const username = localStorage.getItem(SAVED_USER_KEY) || '';
  const password = localStorage.getItem(SAVED_PASS_KEY) || '';
  if (!username || !password) {
    return null;
  }
  return { username, password };
}

export function clearSavedLoginCredentials() {
  localStorage.removeItem(SAVED_USER_KEY);
  localStorage.removeItem(SAVED_PASS_KEY);
}

const WALLET_FETCH_TIMEOUT_MS = 15_000;

async function walletFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), WALLET_FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`/api/wallet/${path}`, {
      ...options,
      headers,
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('ဆာဗာ မတုံ့ပြန်ပါ — အင်တာနက် စစ်ပြီး ထပ်စမ်းပါ');
    }
    throw error;
  } finally {
    window.clearTimeout(timeoutId);
  }

  const raw = await response.text();
  let payload = {} as T & { error?: string };
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as T & { error?: string };
    } catch {
      if (response.status === 404) {
        throw new Error('Wallet API မတွေ့ပါ — /api/wallet deploy စစ်ပါ');
      }
      if (response.status >= 500) {
        throw new Error(
          'Wallet server မအလုပ်လုပ်ပါ — Cloudflare မှာ KV binding WALLET_KV ချိတ်ပြီး Redeploy လုပ်ပါ',
        );
      }
      throw new Error('Server response မမှန်ပါ — ခဏနေပြီး ထပ်စမ်းပါ');
    }
  } else if (!response.ok) {
    throw new Error(
      response.status === 404
        ? 'Wallet API မတွေ့ပါ'
        : 'Wallet API မရပါ — local မှာ npm run dev သုံးပါ',
    );
  }

  if (!response.ok) {
    throw new Error(payload.error || 'တောင်းဆိုမှု မအောင်မြင်ပါ');
  }

  return payload;
}

export function formatMmk(amount: number) {
  return `${Math.round(amount).toLocaleString('en-US')} MMK`;
}

export async function login(username: string, password: string) {
  const result = await walletFetch<{ token: string; user: WalletUser; error?: string }>('login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
  setAuthToken(result.token);
  saveLoginCredentials(username, password);
  return result.user;
}

export async function logout() {
  try {
    await walletFetch('logout', { method: 'POST' });
  } finally {
    clearAuthToken();
    clearSavedLoginCredentials();
  }
}

export async function fetchMe() {
  return walletFetch<{ user: WalletUser }>('me');
}

export async function acceptTerms() {
  return walletFetch<{ user: WalletUser }>('accept-terms', { method: 'POST' });
}

export async function changePassword(currentPassword: string, newPassword: string) {
  const result = await walletFetch<{ ok: boolean; error?: string }>('password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  const saved = getSavedLoginCredentials();
  if (saved) {
    saveLoginCredentials(saved.username, newPassword);
  }
  return result;
}

export async function fetchMyTransactions() {
  return walletFetch<{ transactions: WalletTransaction[] }>('transactions');
}

export async function requestTransaction(type: 'deposit' | 'withdraw', amount: number, note: string) {
  return walletFetch<{ transaction: WalletTransaction }>('request', {
    method: 'POST',
    body: JSON.stringify({ type, amount, note }),
  });
}

export async function placeBet(payload: {
  type: 'maung' | 'body';
  stake: number;
  picks: WalletBetPick[];
}) {
  return walletFetch<{ bet: WalletBet; user: WalletUser }>('bets', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function fetchMyBets(status: 'all' | 'open' | 'settled' = 'all') {
  const query = status === 'all' ? '' : `?status=${status}`;
  return walletFetch<{ bets: WalletBet[]; openStake: number; user: WalletUser }>(`bets${query}`);
}

export async function settleMyBets(
  matches: Array<{ matchId: string; homeScore: number; awayScore: number; finished: boolean }>,
) {
  return walletFetch<{ credited: number; settled: number; user: WalletUser }>('bets/settle', {
    method: 'POST',
    body: JSON.stringify({ matches }),
  });
}

export async function adminFetchUsers() {
  return walletFetch<{ users: WalletUser[] }>('admin/users');
}

export async function adminCreateUser(payload: {
  username: string;
  password: string;
  displayName?: string;
  balance?: number;
}) {
  return walletFetch<{ user: WalletUser }>('admin/users', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminUpdateUser(
  userId: string,
  payload: Partial<{ password: string; displayName: string; active: boolean; balance: number; balanceNote: string }>,
) {
  return walletFetch<{ user: WalletUser }>(`admin/users/${userId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function adminFetchTransactions(filters?: { userId?: string; status?: string }) {
  const params = new URLSearchParams();
  if (filters?.userId) {
    params.set('userId', filters.userId);
  }
  if (filters?.status) {
    params.set('status', filters.status);
  }
  const query = params.toString();
  return walletFetch<{ transactions: WalletTransaction[] }>(
    `admin/transactions${query ? `?${query}` : ''}`,
  );
}

export async function adminPostTransaction(payload: {
  userId: string;
  type: 'deposit' | 'withdraw';
  amount: number;
  note?: string;
}) {
  return walletFetch<{ transaction: WalletTransaction; user: WalletUser }>('admin/transactions', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function adminReviewTransaction(txId: string, decision: 'approve' | 'reject', note?: string) {
  return walletFetch<{ transaction: WalletTransaction; user: WalletUser }>(
    `admin/transactions/review/${txId}`,
    {
      method: 'POST',
      body: JSON.stringify({ decision, note }),
    },
  );
}
