import { useMemo, useState } from 'react';
import {
  compareFeaturedMatches,
  formatMatchDateLabel,
  formatKickoffLabel,
  groupMatchesByDate,
  isHomeScheduleMatch,
  isMajorLeagueMatch,
  MAJOR_LEAGUE_LABEL,
} from '../matchUi';
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
      .filter(isHomeScheduleMatch)
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

  const majorMatches = useMemo(() => visible.filter(isMajorLeagueMatch), [visible]);
  const otherMatches = useMemo(
    () => visible.filter((match) => !isMajorLeagueMatch(match)),
    [visible],
  );
  const otherGrouped = groupMatchesByDate(otherMatches);

  return (
    <div className="m-screen m-home-screen">
      <p className="m-screen-lead">နောက်လာမည့် ပွဲများ — ပြီးသွားပွဲ မပါ</p>

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

      <div className="m-section-list">
        {majorMatches.length > 0 ? (
          <section className="m-date-block m-major-leagues">
            <h3>{MAJOR_LEAGUE_LABEL}</h3>
            {majorMatches.map((match) => (
              <MobileMatchCard
                key={`major-${match.id}`}
                match={match}
                kickoffLabel={formatKickoffLabel(match)}
                onWatch={onWatch}
                onBet={onBet}
                showWatch={false}
                showBetUnderTeams
              />
            ))}
          </section>
        ) : null}

        {otherGrouped.map(([dateKey, dateMatches]) => (
          <section className="m-date-block" key={dateKey}>
            <h3>{formatMatchDateLabel(dateKey)}</h3>
            {dateMatches.map((match) => (
              <MobileMatchCard
                key={match.id}
                match={match}
                kickoffLabel={formatKickoffLabel(match)}
                onWatch={onWatch}
                onBet={onBet}
                showWatch={false}
              />
            ))}
          </section>
        ))}

        {!loading && !visible.length ? <p className="m-hint">နောက်လာမည့် ပွဲ မရှိသေးပါ</p> : null}
      </div>
    </div>
  );
}
