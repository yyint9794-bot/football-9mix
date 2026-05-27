import { useMemo, useState } from 'react';
import { hasStream } from '../api';
import { compareFeaturedMatches, formatMatchDateLabel, groupMatchesByDate, isCurrentOrFutureMatch, isLiveMatch } from '../matchUi';
import type { Match } from '../types';
import { MobileMatchCard } from './MobileMatchCard';

type MobileHomeScreenProps = {
  matches: Match[];
  loading: boolean;
  error: string;
  onWatch: (match: Match) => void;
  onBet: () => void;
  onRefresh: () => void;
};

export function MobileHomeScreen({
  matches,
  loading,
  error,
  onWatch,
  onBet,
  onRefresh,
}: MobileHomeScreenProps) {
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return matches
      .filter(isCurrentOrFutureMatch)
      .filter((match) => {
        if (!q) {
          return true;
        }
        const blob = [match.league.name, match.homeTeam.name, match.awayTeam.name, match.time]
          .join(' ')
          .toLowerCase();
        return blob.includes(q);
      })
      .sort(compareFeaturedMatches);
  }, [matches, query]);

  const featured = visible.find((m) => isLiveMatch(m) && hasStream(m)) ?? visible[0];
  const grouped = groupMatchesByDate(visible);

  return (
    <div className="m-screen m-home-screen">
      <div className="m-search">
        <input
          type="search"
          placeholder="လိဂ်၊ အသင်း ရှာပါ…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="button" className="m-icon-btn" onClick={onRefresh} aria-label="Refresh">
          ↻
        </button>
      </div>

      {loading ? <p className="m-hint">ပွဲစဉ် ဖတ်နေပါတယ်…</p> : null}
      {error ? <p className="m-error">{error}</p> : null}

      {featured ? (
        <section className="m-hero-card">
          <span className="m-hero-badge">{isLiveMatch(featured) ? 'တိုက်ရိုက်' : 'ထူးခြား'}</span>
          <h2>
            {featured.homeTeam.name} vs {featured.awayTeam.name}
          </h2>
          <p>{featured.league.name}</p>
          <div className="m-hero-actions">
            <button type="button" className="m-btn m-btn-primary" onClick={() => onWatch(featured)}>
              ကြည့်မည်
            </button>
            <button type="button" className="m-btn m-btn-ghost" onClick={onBet}>
              9Mix
            </button>
          </div>
        </section>
      ) : null}

      <div className="m-section-list">
        {grouped.map(([dateKey, dateMatches]) => (
          <section className="m-date-block" key={dateKey}>
            <h3>{formatMatchDateLabel(dateKey)}</h3>
            {dateMatches.map((match) => (
              <MobileMatchCard key={match.id} match={match} onWatch={onWatch} onBet={onBet} />
            ))}
          </section>
        ))}
        {!loading && !visible.length ? <p className="m-hint">ပွဲ မတွေ့ပါ</p> : null}
      </div>
    </div>
  );
}
