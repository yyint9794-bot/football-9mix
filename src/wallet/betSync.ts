import type { Match } from '../types';

function isMatchFinished(match: Match) {
  const status = String(match.status || '').toLowerCase();
  return (
    status.includes('finished') ||
    status.includes('completed') ||
    status.includes('ft') ||
    status.includes('ended') ||
    match.is_finished === true ||
    match.completed === true
  );
}

export function buildMatchResults(matches: Match[]) {
  return matches.map((match) => ({
    matchId: String(match.id),
    homeScore: Number(match.homeScore ?? match.home_score ?? 0),
    awayScore: Number(match.awayScore ?? match.away_score ?? 0),
    finished: isMatchFinished(match),
  }));
}
