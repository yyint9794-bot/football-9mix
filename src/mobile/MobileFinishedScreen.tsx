import { useEffect, useMemo, useState } from 'react';
import { fetchMatchResults } from '../api';
import { formatKickoffLabel } from '../matchUi';
import { formatMatchScore, listMatchesWithScores } from '../matchScore';
import { TeamLogo } from '../TeamLogo';
import type { Match } from '../types';

export function MobileFinishedScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    void fetchMatchResults(controller.signal)
      .then(setMatches)
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  const finished = useMemo(() => listMatchesWithScores(matches), [matches]);

  return (
    <div className="m-screen m-finished-screen">
      <p className="m-screen-lead">ပြီးခဲ့သော ပွဲများ — ရလဒ်</p>
      {loading ? <p className="m-hint">ဖတ်နေပါတယ်…</p> : null}
      <div className="m-section-list">
        {finished.map((match) => {
          const score = formatMatchScore(match) ?? '—';
          return (
            <article className="m-match-card finished" key={match.id}>
              <div className="m-match-top">
                <span className="m-match-league">{match.league.name}</span>
                <span className="m-finished-pill">ပြီး</span>
              </div>
              <div className="m-match-teams">
                <div className="m-team">
                  <TeamLogo src={match.homeTeam.logo} name={match.homeTeam.name} />
                  <strong>{match.homeTeam.name}</strong>
                </div>
                <div className="m-match-center">
                  <span className="m-score">{score}</span>
                  <small>{formatKickoffLabel(match)}</small>
                </div>
                <div className="m-team">
                  <TeamLogo src={match.awayTeam.logo} name={match.awayTeam.name} />
                  <strong>{match.awayTeam.name}</strong>
                </div>
              </div>
            </article>
          );
        })}
        {!loading && !finished.length ? (
          <p className="m-hint">ပြီးခဲ့သော ပွဲရလဒ် မရှိသေးပါ</p>
        ) : null}
      </div>
    </div>
  );
}
