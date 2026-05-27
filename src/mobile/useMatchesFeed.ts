import { useEffect, useState } from 'react';
import { getFootballMatches } from '../api';
import type { Match } from '../types';

export function useMatchesFeed() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;

    const load = (signal?: AbortSignal) => {
      getFootballMatches(signal)
        .then((next) => {
          if (!disposed) {
            setMatches(next);
          }
        })
        .catch((err: Error) => {
          if (!disposed && err.name !== 'AbortError') {
            setError('ဒေတာ မရပါ — ခဏနေပြီး ထပ်စမ်းပါ');
          }
        })
        .finally(() => {
          if (!disposed) {
            setLoading(false);
          }
        });
    };

    const controller = new AbortController();
    load(controller.signal);

    const timer = window.setInterval(() => load(), 45000);

    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, []);

  return { matches, loading, error, refresh: () => getFootballMatches().then(setMatches) };
}
