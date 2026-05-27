import type { Match } from '../types';

export function getEnglishTeamName(match: Match, side: 'home' | 'away') {
  const english =
    side === 'home' ? String(match.homeEngName || '').trim() : String(match.awayEngName || '').trim();
  const fallback = side === 'home' ? match.homeTeam.name : match.awayTeam.name;
  return english || fallback;
}
