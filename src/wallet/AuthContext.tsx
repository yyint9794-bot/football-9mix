import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearAuthToken, fetchMe, login as apiLogin, logout as apiLogout } from './api';
import type { WalletUser } from './types';

type AuthContextValue = {
  user: WalletUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<WalletUser>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<WalletUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const result = await fetchMe();
      setUser(result.user);
    } catch {
      clearAuthToken();
      setUser(null);
    }
  }, []);

  useEffect(() => {
    let disposed = false;
    const timeoutId = window.setTimeout(() => {
      if (!disposed) {
        setLoading(false);
      }
    }, 12_000);

    void refresh().finally(() => {
      if (!disposed) {
        setLoading(false);
      }
      window.clearTimeout(timeoutId);
    });

    return () => {
      disposed = true;
      window.clearTimeout(timeoutId);
    };
  }, [refresh]);

  const login = useCallback(async (username: string, password: string) => {
    const nextUser = await apiLogin(username, password);
    setUser(nextUser);
    return nextUser;
  }, []);

  const logout = useCallback(async () => {
    await apiLogout();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      refresh,
    }),
    [user, loading, login, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
