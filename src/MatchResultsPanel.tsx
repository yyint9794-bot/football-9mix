import { useMemo } from 'react';
import { listFinishedMatchesWithScores } from './matchScore';
import { MatchScoreBadge } from './MatchScoreBadge';
import { TeamLogo } from './TeamLogo';
import type { Match } from './types';

type MatchResultsPanelProps = {
  matches: Match[];
  loading?: boolean;
};

export function MatchResultsPanel({ matches, loading = false }: MatchResultsPanelProps) {
  const finished = useMemo(() => listFinishedMatchesWithScores(matches), [matches]);

  if (loading) {
    return <p className="odds-hint">ပွဲရလဒ် ဖတ်နေပါတယ်…</p>;
  }

  if (!finished.length) {
    return <p className="odds-hint">ပွဲပြီးရလဒ် မရှိသေးပါ — API မှ ရလဒ်ရောက်လာသည်နှင့် ပြပါမယ်</p>;
  }

  return (
    <div className="match-results-panel">
      <p className="match-results-count">{finished.length} ပွဲ ပြီးပါပြီ</p>
      <div className="match-results-list">
        {finished.map((match) => (
          <article className="match-result-card" key={match.id}>
            <header>
              <span className="match-result-league">{match.league.name}</span>
              <span className="match-result-time">{match.time}</span>
            </header>
            <div className="match-result-teams">
              <div className="match-result-team">
                <TeamLogo
                  src={match.homeTeam.logo}
                  name={match.homeTeam.name}
                  engName={String(match.homeEngName || '')}
                />
                <strong>{match.homeTeam.name}</strong>
              </div>
              <MatchScoreBadge match={match} showHalfTime className="match-score-badge center" />
              <div className="match-result-team">
                <TeamLogo
                  src={match.awayTeam.logo}
                  name={match.awayTeam.name}
                  engName={String(match.awayEngName || '')}
                />
                <strong>{match.awayTeam.name}</strong>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
