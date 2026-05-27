import type { WalletTransaction, WalletUser } from './types';

const TOKEN_KEY = 'mix9-auth-token';

function getToken() {
  return sessionStorage.getItem(TOKEN_KEY) || '';
}

export function setAuthToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearAuthToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

async function walletFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  const token = getToken();
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`/api/wallet/${path}`, {
    ...options,
    headers,
  });

  const raw = await response.text();
  let payload = {} as T & { error?: string };
  if (raw.trim()) {
    try {
      payload = JSON.parse(raw) as T & { error?: string };
    } catch {
      throw new Error('Server response မမှန်ပါ — dev server ပြန် စတင်ပါ');
    }
  } else if (!response.ok) {
    throw new Error('Wallet API မရပါ — npm run dev ပြန် စတင်ပါ');
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
  return result.user;
}

export async function logout() {
  try {
    await walletFetch('logout', { method: 'POST' });
  } finally {
    clearAuthToken();
  }
}

export async function fetchMe() {
  return walletFetch<{ user: WalletUser }>('me');
}

export async function acceptTerms() {
  return walletFetch<{ user: WalletUser }>('accept-terms', { method: 'POST' });
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
