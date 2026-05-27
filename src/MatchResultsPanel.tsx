import { useEffect, useMemo, useState } from 'react';
import { fetchMatchResults } from './api';
import { formatMatchScore, listMatchesWithScores } from './matchScore';
import { formatKickoffLabel } from './betting/odds';
import { TeamLogo } from './TeamLogo';
import type { Match } from './types';

type MatchResultsPanelProps = {
  matches?: Match[];
  loading?: boolean;
};

export function MatchResultsPanel({ loading = false }: MatchResultsPanelProps) {
  const [apiResults, setApiResults] = useState<Match[]>([]);
  const [resultsLoading, setResultsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    setResultsLoading(true);
    setError('');
    void fetchMatchResults(controller.signal)
      .then((rows) => {
        setApiResults(rows);
        if (!rows.length) {
          setError('ပွဲပြီးရလဒ် မရှိသေးပါ');
        }
      })
      .catch(() => {
        setApiResults([]);
        setError('ရလဒ် API မရပါ — ခဏနေပြီး ထပ်စမ်းပါ');
      })
      .finally(() => setResultsLoading(false));
    return () => controller.abort();
  }, []);

  const finished = useMemo(() => listMatchesWithScores(apiResults), [apiResults]);
  const busy = loading || resultsLoading;

  if (busy && !finished.length) {
    return <p className="odds-hint">ပွဲရလဒ် ဖတ်နေပါတယ်…</p>;
  }

  if (!finished.length) {
    return <p className="odds-hint">{error || 'ပွဲပြီးရလဒ် မရှိသေးပါ'}</p>;
  }

  return (
    <div className="match-results-panel">
      <p className="match-results-count">{finished.length} ပွဲ ပြီးပါပြီ</p>
      <div className="match-results-list">
        {finished.map((match) => {
          const score = formatMatchScore(match) ?? '—';
          return (
            <article className="match-result-card" key={match.id}>
              <header>
                <span className="match-result-league">{match.league.name}</span>
                <span className="match-result-time">{formatKickoffLabel(match)}</span>
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
                <div className="match-result-score-wrap" aria-label={`ရလဒ် ${score}`}>
                  <span className="match-result-score">{score}</span>
                  <small>ပြီးပါပြီ</small>
                </div>
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
          );
        })}
      </div>
    </div>
  );
}
