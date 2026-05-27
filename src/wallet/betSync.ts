import { getMatchAwayScore, getMatchHomeScore, isMatchFinished } from '../matchScore';
import type { Match } from '../types';

export function buildMatchResults(matches: Match[]) {
  return matches.map((match) => ({
    matchId: String(match.id),
    homeScore: getMatchHomeScore(match) ?? 0,
    awayScore: getMatchAwayScore(match) ?? 0,
    finished: isMatchFinished(match),
  }));
}
