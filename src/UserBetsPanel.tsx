import { useEffect, useState } from 'react';
import { fetchMyBets, formatMmk } from './wallet/api';
import type { WalletBet } from './wallet/types';

type UserBetsPanelProps = {
  mode: 'open' | 'settled';
};

function formatBetType(type: WalletBet['type']) {
  return type === 'maung' ? 'မောင်း' : 'ဘော်ဒီ';
}

function formatBetStatus(status: WalletBet['status']) {
  if (status === 'pending') {
    return 'စောင့်ဆိုင်းနေ';
  }
  if (status === 'won') {
    return 'နိုင်';
  }
  return 'ရှုံး';
}

export function UserBetsPanel({ mode }: UserBetsPanelProps) {
  const [bets, setBets] = useState<WalletBet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let disposed = false;
    setLoading(true);
    setError('');

    void fetchMyBets(mode === 'open' ? 'open' : 'settled')
      .then((result) => {
        if (!disposed) {
          setBets(result.bets);
        }
      })
      .catch((err) => {
        if (!disposed) {
          setError(err instanceof Error ? err.message : 'မဖတ်နိုင်ပါ');
        }
      })
      .finally(() => {
        if (!disposed) {
          setLoading(false);
        }
      });

    return () => {
      disposed = true;
    };
  }, [mode]);

  return (
    <div className="user-bets-panel">
      {loading ? <p className="odds-hint">ဖတ်နေပါတယ်…</p> : null}
      {error ? <p className="bet-error">{error}</p> : null}
      {!loading && !error && !bets.length ? (
        <p className="odds-hint">
          {mode === 'open' ? 'လောင်းထားသောပွဲ မရှိသေးပါ' : 'ပွဲပြီးရလဒ် မရှိသေးပါ'}
        </p>
      ) : null}

      <div className="user-bets-list">
        {bets.map((bet) => (
          <article className={`user-bet-card ${bet.status}`} key={bet.id}>
            <header>
              <strong>{formatBetType(bet.type)}</strong>
              <span className={`user-bet-status ${bet.status}`}>{formatBetStatus(bet.status)}</span>
            </header>
            <p className="user-bet-meta">
              လောင်းငွေ {formatMmk(bet.stake)}
              {bet.status === 'won' ? ` · နိုင်ကြေး ${formatMmk(bet.payout)}` : ''}
            </p>
            <ul>
              {bet.picks.map((pick) => (
                <li key={`${bet.id}-${pick.matchId}-${pick.side}`}>{pick.summary}</li>
              ))}
            </ul>
            <small>{new Date(bet.createdAt).toLocaleString()}</small>
          </article>
        ))}
      </div>
    </div>
  );
}
