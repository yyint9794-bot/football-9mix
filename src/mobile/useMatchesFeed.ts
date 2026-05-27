import { useCallback, useEffect, useState } from 'react';
import { getFootballMatches } from '../api';
import type { Match } from '../types';

const EMPTY_ERROR = 'ဒေတာ မရပါ — အင်တာနက်/VPN စစ်ပြီး ထပ်စမ်းပါ';

export function useMatchesFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const applyMatches = useCallback((next: Match[]) => {
    setMatches(next);
    setError(next.length ? '' : EMPTY_ERROR);
  }, []);

  const load = useCallback(async (signal?: AbortSignal) => {
    const next = await getFootballMatches(signal);
    applyMatches(next);
    return next;
  }, [applyMatches]);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();

    void load(controller.signal).catch((err: Error) => {
      if (!disposed && err.name !== 'AbortError') {
        setError(EMPTY_ERROR);
      }
    }).finally(() => {
      if (!disposed) {
        setLoading(false);
      }
    });

    const timer = window.setInterval(() => {
      void load().catch(() => {
        // refresh failed — keep previous matches
      });
    }, 45000);

    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      await load();
    } catch {
      setError(EMPTY_ERROR);
    } finally {
      setLoading(false);
    }
  }, [load]);

  return { matches, loading, error, refresh };
}
