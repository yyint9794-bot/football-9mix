import type { Match } from './types';

/** World Cup → Champions League → Premier League */
export const PRIORITY_LEAGUE_ALIASES = [
  ['world cup', 'fifa world cup', 'fifa wc', 'wc', 'worldcup'],
  ['champions league', 'uefa champions league', 'uefa cl', 'ucl'],
  ['premier league', 'english premier league', 'eng pr', 'epl'],
] as const;

export const MAJOR_LEAGUE_LABEL =
  'Live Football: Premier League / Champions League / World Cup';

export function getLeaguePriority(name: string) {
  const normalizedName = name.toLowerCase();
  const index = PRIORITY_LEAGUE_ALIASES.findIndex((aliases) =>
    aliases.some((alias) => normalizedName.includes(alias)),
  );
  return index === -1 ? PRIORITY_LEAGUE_ALIASES.length : index;
}

export function isMajorLeagueMatch(match: Match) {
  return getLeaguePriority(match.league?.name || '') < PRIORITY_LEAGUE_ALIASES.length;
}

export function compareLeaguePriority(a: Match, b: Match) {
  return getLeaguePriority(a.league?.name || '') - getLeaguePriority(b.league?.name || '');
}
