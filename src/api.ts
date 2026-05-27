import {
  applyScoresToMatch,
  hasMatchScore,
  isMatchFinished,
  isRecentMatchTime,
  parseMmkScoresPayload,
} from './matchScore';
import { enrichMatchesWithLogos } from './teamLogoIndex';
import { resolveMissingTeamLogos } from './teamLogoResolver';
import { extractMmkTeamLogo, normalizeLogoUrl } from './teamLogoUrl';
import type { FootballResponse, Match } from './types';

const API_KEY = import.meta.env.VITE_HTAY_API_KEY ?? 'demoapi';
const BASE_URL = 'https://htayapi.com';
const PRIMARY_VERSION: string = import.meta.env.VITE_HTAY_FOOTBALL_VERSION ?? 'v7';
const MMK_ENDPOINTS = [
  '/mmk-autokyay/livedata',
  '/mmk-autokyay/v3/body-goalboung',
  '/mmk-autokyay/v3/moung',
  '/mmk-autokyay/v3/live',
  '/mmk-autokyay/v2/body-goalboung',
  '/mmk-autokyay/v2/moung',
  '/mmk-autokyay/body-goalboung',
  '/mmk-autokyay/moung',
];

const MMK_RESULTS_ENDPOINTS = ['/mmk-autokyay/v3/results', '/mmk-autokyay/v2/results'];

type MmkTeam = {
  name?: string;
  engName?: string;
  league?: {
    name?: string;
  };
};

type MmkMatch = {
  id?: string | number;
  matchId?: string | number;
  league_name?: string;
  league_name_mm?: string;
  home_team?: string;
  home_team_mm?: string;
  home_team_image_url?: string;
  away_team?: string;
  away_team_mm?: string;
  away_team_image_url?: string;
  match_time?: string;
  startTime?: string;
  status?: string;
  is_finished?: boolean;
  completed?: boolean;
  odds?: unknown;
  price?: unknown;
  home?: MmkTeam;
  away?: MmkTeam;
  [key: string]: unknown;
};

type MmkResponse = {
  data?: unknown;
};

function footballEndpoint(version: string) {
  return `${BASE_URL}/football/${version}/all?key=${API_KEY}`;
}

function normalizeTeamToken(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u1000-\u109f]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function getMatchTimeBucket(time: string) {
  const raw = String(time).trim().replace(/^(live|finished|completed)\s+/i, '');
  const attempts = [raw, raw.replace(' ', 'T'), raw.includes('T') ? raw : ''];

  for (const value of attempts) {
    if (!value) {
      continue;
    }

    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return `${parsed.getFullYear()}-${parsed.getMonth()}-${parsed.getDate()}-${parsed.getHours()}:${parsed.getMinutes()}`;
    }
  }

  return raw.toLowerCase();
}

function getMatchNameTokens(match: Match, side: 'home' | 'away') {
  const team = side === 'home' ? match.homeTeam : match.awayTeam;
  const extras =
    side === 'home'
      ? [match.homeEngName, match.home_team, match.home_team_mm]
      : [match.awayEngName, match.away_team, match.away_team_mm];

  return [...normalizeTeamToken(team?.name || ''), ...extras.flatMap((name) => normalizeTeamToken(String(name || '')))];
}

function hasStructuredOdds(match: Match) {
  const payload = match.myanmarOdds;
  if (!payload || typeof payload !== 'object') {
    return false;
  }

  const record = payload as Record<string, unknown>;
  return Boolean(record.handicap || record.over_under || record.body != null || record.goalTotal != null);
}

function buildMmkOddsPayload(match: MmkMatch) {
  if (match.odds && typeof match.odds === 'object' && !Array.isArray(match.odds)) {
    const record = match.odds as Record<string, unknown>;
    if (record.handicap || record.over_under) {
      return match.odds;
    }
  }

  if (match.price != null || match.bodyGap != null || match.goalTotal != null || match.body != null) {
    return {
      body: match.bodyGap ?? match.body,
      price: match.price,
      goalTotal: match.goalTotal,
      goalTotalPrice: match.goalTotalPrice,
      goalsGap: match.goalsGap,
      homeUpper: match.homeUpper,
    };
  }

  return undefined;
}

function getMatchKey(match: Match) {
  return `${getMatchTimeBucket(match.time)}|${match.homeTeam?.name}|${match.awayTeam?.name}`.toLowerCase();
}

function tokensOverlap(tokensA: string[], tokensB: string[]) {
  return tokensA.some((word) =>
    tokensB.some((other) => word.length > 2 && (other.includes(word) || word.includes(other))),
  );
}

function teamsLikelySame(matchA: Match, matchB: Match) {
  const homeA = getMatchNameTokens(matchA, 'home');
  const homeB = getMatchNameTokens(matchB, 'home');
  const awayA = getMatchNameTokens(matchA, 'away');
  const awayB = getMatchNameTokens(matchB, 'away');

  return tokensOverlap(homeA, homeB) && tokensOverlap(awayA, awayB);
}

function normalizeLeagueKey(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\u1000-\u109f]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2);
}

function leaguesLikelySame(leagueA: string, leagueB: string) {
  const tokensA = normalizeLeagueKey(leagueA);
  const tokensB = normalizeLeagueKey(leagueB);

  return tokensA.some((word) =>
    tokensB.some((other) => word.includes(other) || other.includes(word)),
  );
}

function matchOddsScore(streamMatch: Match, oddsMatch: Match) {
  let score = 0;

  if (getMatchTimeBucket(streamMatch.time) === getMatchTimeBucket(oddsMatch.time)) {
    score += 4;
  }

  if (teamsLikelySame(streamMatch, oddsMatch)) {
    score += 8;
  }

  const streamLeague = String(streamMatch.league?.name || '');
  const oddsLeague = String(oddsMatch.league?.name || '');
  if (streamLeague && oddsLeague && leaguesLikelySame(streamLeague, oddsLeague)) {
    score += 5;
  }

  return score;
}

export function buildLeagueLogoIndex(matches: Match[]) {
  const index = new Map<string, string>();

  for (const match of matches) {
    const name = match.league?.name?.trim();
    const logo = match.league?.logo?.trim();

    if (name && logo) {
      index.set(name, logo);
    }
  }

  return index;
}

export function resolveLeagueLogoForGroup(
  leagueName: string,
  leagueMatches: Match[],
  logoIndex: Map<string, string>,
) {
  const cached = logoIndex.get(leagueName);
  if (cached) {
    return cached;
  }

  for (const [name, logo] of logoIndex) {
    if (leaguesLikelySame(leagueName, name)) {
      return logo;
    }
  }

  for (const match of leagueMatches) {
    const logo = match.league?.logo?.trim();
    if (logo) {
      return logo;
    }
  }

  for (const match of leagueMatches) {
    const teamLogo = match.homeTeam?.logo?.trim();
    if (teamLogo) {
      return teamLogo;
    }
  }

  return '';
}

export function isOddsClosed(match: Match) {
  if (match.oddsClosed === true || match.canceled === true) {
    return true;
  }

  if (match.active === false) {
    return true;
  }

  if (match.hdpFinished === true && match.ouFinished === true) {
    return true;
  }

  const closeTime = String(match.closeTime || match.odds_close_time || '');
  if (closeTime) {
    const closedAt = new Date(closeTime);
    if (!Number.isNaN(closedAt.getTime()) && closedAt.getTime() <= Date.now()) {
      return true;
    }
  }

  return false;
}

export function hasMyanmarOdds(match: Match) {
  if (buildMmkOddsPayload(match as MmkMatch) || hasStructuredOdds(match)) {
    return true;
  }

  return Boolean(
    (match.odds && typeof match.odds === 'object') ||
      match.handicap ||
      match.price != null ||
      match.goalTotal != null ||
      match.goalTotalPrice != null ||
      match.bodyGap != null
  );
}

function mergeOddsInto(target: Match, source: Match): Match {
  if (!hasMyanmarOdds(source)) {
    return target;
  }

  const sourceOdds = source.myanmarOdds ?? buildMmkOddsPayload(source as MmkMatch);
  const targetHasStructured = hasStructuredOdds(target);
  const sourceHasStructured = Boolean(
    sourceOdds &&
      typeof sourceOdds === 'object' &&
      ((sourceOdds as Record<string, unknown>).handicap ||
        (sourceOdds as Record<string, unknown>).over_under ||
        (sourceOdds as Record<string, unknown>).goalTotal != null),
  );

  if (targetHasStructured && !sourceHasStructured) {
    return target;
  }

  const sameTeams = teamsLikelySame(target, source);

  const mergeSideLogo = (side: 'home' | 'away') => {
    const targetLogo = normalizeLogoUrl(side === 'home' ? target.homeTeam?.logo : target.awayTeam?.logo);
    if (targetLogo) {
      return targetLogo;
    }
    if (!sameTeams) {
      return '';
    }
    return normalizeLogoUrl(side === 'home' ? source.homeTeam?.logo : source.awayTeam?.logo) || '';
  };

  return {
    ...target,
    league: {
      ...target.league,
      logo: normalizeLogoUrl(target.league?.logo) || normalizeLogoUrl(source.league?.logo) || '',
    },
    homeTeam: {
      ...target.homeTeam,
      logo: mergeSideLogo('home'),
    },
    awayTeam: {
      ...target.awayTeam,
      logo: mergeSideLogo('away'),
    },
    myanmarOdds: sourceOdds ?? target.myanmarOdds,
    oddsTeam: source.oddsTeam ?? target.oddsTeam,
    odds_team: source.odds_team ?? target.odds_team,
    odds: source.odds ?? target.odds,
    handicap: source.handicap ?? target.handicap,
    price: source.price ?? target.price,
    goalTotal: source.goalTotal ?? target.goalTotal,
    goalTotalPrice: source.goalTotalPrice ?? target.goalTotalPrice,
    homeEngName: sameTeams ? target.homeEngName || source.homeEngName : target.homeEngName,
    awayEngName: sameTeams ? target.awayEngName || source.awayEngName : target.awayEngName,
    ...(teamsLikelySame(target, source) && source.liveScoreFromApi === true
      ? {
          startTime: source.startTime ?? target.startTime,
          homeScore: source.homeScore,
          awayScore: source.awayScore,
          liveScoreFromApi: true,
        }
      : {}),
    active: source.active ?? target.active,
    canceled: source.canceled ?? target.canceled,
    closeTime: source.closeTime ?? target.closeTime,
    hdpFinished: source.hdpFinished ?? target.hdpFinished,
    ouFinished: source.ouFinished ?? target.ouFinished,
    oddsClosed: source.oddsClosed ?? target.oddsClosed,
  };
}

function findOddsByLeague(streamMatch: Match, oddsPool: Match[]) {
  const leagueName = streamMatch.league?.name || '';
  if (!leagueName) {
    return null;
  }

  return (
    oddsPool.find(
      (candidate) => hasMyanmarOdds(candidate) && leaguesLikelySame(leagueName, candidate.league?.name || ''),
    ) ?? null
  );
}

function findBestOddsMatch(streamMatch: Match, oddsPool: Match[]) {
  let best: Match | null = null;
  let bestScore = 3;

  for (const candidate of oddsPool) {
    if (!hasMyanmarOdds(candidate) || isOddsClosed(candidate)) {
      continue;
    }

    const score = matchOddsScore(streamMatch, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best ?? findOddsByLeague(streamMatch, oddsPool);
}

function mergeMatchData(primaryMatches: Match[], fallbackMatches: Match[]) {
  const fallbackByKey = new Map(fallbackMatches.map((match) => [getMatchKey(match), match]));

  return primaryMatches.map((match) => ({
    ...fallbackByKey.get(getMatchKey(match)),
    ...match,
  }));
}

async function fetchMatches(version: string, signal?: AbortSignal) {
  const response = await fetch(footballEndpoint(version), {
    signal,
    headers: {
      'X-HtayApi-Key': API_KEY,
      'X-HtayApi-Platform': 'web',
    },
  });

  if (!response.ok) {
    throw new Error(`Football API ${version} request failed: ${response.status}`);
  }

  const data = (await response.json()) as FootballResponse;
  return (Array.isArray(data.matches) ? data.matches : []).map(normalizeFootballMatch);
}

function normalizeFootballMatch(match: Match): Match {
  const leagueName = match.league?.name || 'လိဂ်';
  const homeName = match.homeTeam?.name || 'အိမ်ရှင်';
  const awayName = match.awayTeam?.name || 'ဧည့်';

  return {
    ...match,
    league: {
      ...match.league,
      name: leagueName,
      logo: normalizeLogoUrl(match.league?.logo),
    },
    homeTeam: {
      ...match.homeTeam,
      name: homeName,
      logo: normalizeLogoUrl(match.homeTeam?.logo),
    },
    awayTeam: {
      ...match.awayTeam,
      name: awayName,
      logo: normalizeLogoUrl(match.awayTeam?.logo),
    },
  };
}

function flattenMmkData(data: unknown): MmkMatch[] {
  if (Array.isArray(data)) {
    return data.reduce<MmkMatch[]>((matches, item) => {
      if (item && typeof item === 'object' && Array.isArray((item as { matches?: unknown }).matches)) {
        matches.push(...(item as { matches: unknown[] }).matches.map((match) => match as MmkMatch));
        return matches;
      }

      matches.push(item as MmkMatch);
      return matches;
    }, []);
  }

  if (data && typeof data === 'object' && Array.isArray((data as { matches?: unknown }).matches)) {
    return (data as { matches: unknown[] }).matches.map((match) => match as MmkMatch);
  }

  return [];
}

function pickEnglishTeamName(team?: MmkTeam, teamField?: string) {
  const eng = team?.engName?.trim() || '';
  const field = teamField?.trim() || '';
  if (/[a-zA-Z]{3,}/.test(eng)) {
    return eng;
  }
  if (/[a-zA-Z]{3,}/.test(field)) {
    return field;
  }
  return eng || field;
}

function normalizeMmkMatch(match: MmkMatch, source: string): Match {
  const homeName = match.home_team_mm || match.home?.name || match.home_team || match.home?.engName || 'Home';
  const awayName = match.away_team_mm || match.away?.name || match.away_team || match.away?.engName || 'Away';
  const homeEngName = pickEnglishTeamName(match.home, match.home_team);
  const awayEngName = pickEnglishTeamName(match.away, match.away_team);
  const leagueName =
    match.league_name_mm ||
    match.league_name ||
    (match.league && typeof match.league === 'object' ? (match.league as { name?: string }).name : '') ||
    match.home?.league?.name ||
    match.away?.league?.name ||
    'မြန်မာကြေး';
  const fromResultsApi = source.includes('results');
  const parsedScores = parseMmkScoresPayload(match as Record<string, unknown>);
  const finishedFromApi =
    fromResultsApi && Boolean(parsedScores) ||
    match.is_finished === true ||
    match.completed === true ||
    String(match.status || '').toLowerCase().includes('completed');
  const status = finishedFromApi
    ? 'completed'
    : String(match.status || (match.is_finished || match.completed ? 'Completed' : 'Coming Soon'));
  const mmkOdds = buildMmkOddsPayload(match);

  return {
    id: `mmk-${source}-${match.id ?? match.matchId ?? `${homeName}-${awayName}`}`,
    league: {
      name: leagueName,
      logo: '',
    },
    time: match.match_time || match.startTime || '',
    status,
    homeTeam: {
      name: homeName,
      logo:
        extractMmkTeamLogo(match.home as Record<string, unknown> | undefined, 'home', match) ||
        normalizeLogoUrl(String(match.home_team_image_url || '')),
    },
    awayTeam: {
      name: awayName,
      logo:
        extractMmkTeamLogo(match.away as Record<string, unknown> | undefined, 'away', match) ||
        normalizeLogoUrl(String(match.away_team_image_url || '')),
    },
    streamLinks: {},
    myanmarOdds: mmkOdds,
    oddsTeam:
      typeof match.odds_team === 'string'
        ? match.odds_team
        : match.homeUpper === true
          ? 'home'
          : match.homeUpper === false
            ? 'away'
            : '',
    homeEngName: homeEngName,
    awayEngName: awayEngName,
    ...(parsedScores
      ? {
          ...parsedScores,
          liveScoreFromApi: true,
          resultFromApi: fromResultsApi || finishedFromApi,
          completed: finishedFromApi ? true : match.completed,
          is_finished: finishedFromApi ? true : match.is_finished,
        }
      : typeof match.homeScore === 'number' && typeof match.awayScore === 'number'
        ? {
            homeScore: match.homeScore,
            awayScore: match.awayScore,
            liveScoreFromApi: true,
            startTime: match.startTime,
          }
        : {}),
    price: match.price,
    goalTotal: match.goalTotal,
    goalTotalPrice: match.goalTotalPrice,
    bodyGap: match.bodyGap,
    active: match.active,
    canceled: match.canceled,
    closeTime: match.closeTime,
    hdpFinished: match.hdpFinished,
    ouFinished: match.ouFinished,
    oddsClosed:
      match.canceled === true ||
      match.active === false ||
      match.hdpFinished === true ||
      match.ouFinished === true,
    mmkSource: source,
  };
}

export function createFallbackTeamLogo(name: string) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
  let hash = 0;
  for (const char of name) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }
  const hue = hash % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160"><rect width="160" height="160" rx="42" fill="hsl(${hue} 58% 42%)"/><circle cx="80" cy="80" r="48" fill="#fff" opacity=".18"/><text x="80" y="91" text-anchor="middle" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff">${initials || 'FC'}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

export function resolveTeamLogo(logo: string | undefined, name: string) {
  const trimmed = logo?.trim();
  return trimmed || createFallbackTeamLogo(name);
}

export function resolveLeagueLogo(logo: string | undefined, name: string) {
  const trimmed = logo?.trim();
  return trimmed || createFallbackTeamLogo(name.slice(0, 2) || 'LG');
}

async function fetchMmkMatches(path: string, signal?: AbortSignal) {
  const response = await fetch(`${BASE_URL}${path}?key=${API_KEY}`, {
    signal,
    headers: {
      'X-HtayApi-Key': API_KEY,
      'X-HtayApi-Platform': 'web',
    },
  });

  if (!response.ok) {
    throw new Error(`MMK API ${path} request failed: ${response.status}`);
  }

  const json = (await response.json()) as MmkResponse;
  return flattenMmkData(json.data).map((match) => normalizeMmkMatch(match, path));
}

function mergeUniqueMatches(primaryMatches: Match[], extraMatches: Match[]) {
  const merged = new Map<string, Match>();
  const oddsPool: Match[] = [];

  for (const match of primaryMatches) {
    const key = getMatchKey(match);
    merged.set(key, match);
  }

  for (const mmk of extraMatches) {
    if (hasMyanmarOdds(mmk)) {
      oddsPool.push(mmk);
    }
  }

  for (const [key, streamMatch] of merged) {
    const exactOdds = oddsPool.find((mmk) => getMatchKey(mmk) === key);
    const bestOdds = exactOdds ?? findBestOddsMatch(streamMatch, oddsPool);
    if (bestOdds) {
      merged.set(key, mergeOddsInto(streamMatch, bestOdds));
    }
  }

  const attachedMmkKeys = new Set<string>();

  for (const [key, streamMatch] of merged) {
    if (hasMyanmarOdds(streamMatch)) {
      const exact = oddsPool.find((mmk) => getMatchKey(mmk) === key);
      const best = findBestOddsMatch(streamMatch, oddsPool);
      if (exact) {
        attachedMmkKeys.add(getMatchKey(exact));
      }
      if (best) {
        attachedMmkKeys.add(getMatchKey(best));
      }
    }
  }

  for (const mmk of extraMatches) {
    const mmkKey = getMatchKey(mmk);
    if (!hasMyanmarOdds(mmk) || attachedMmkKeys.has(mmkKey) || merged.has(mmkKey)) {
      continue;
    }

    merged.set(mmkKey, mmk);
  }

  return Array.from(merged.values());
}

function matchResultScore(streamMatch: Match, resultMatch: Match) {
  if (getMatchKey(streamMatch) === getMatchKey(resultMatch)) {
    return 20;
  }

  let score = 0;
  if (getMatchTimeBucket(streamMatch.time) === getMatchTimeBucket(resultMatch.time)) {
    score += 4;
  }
  if (teamsLikelySame(streamMatch, resultMatch)) {
    score += 8;
  }

  const streamLeague = String(streamMatch.league?.name || '');
  const resultLeague = String(resultMatch.league?.name || '');
  if (streamLeague && resultLeague && leaguesLikelySame(streamLeague, resultLeague)) {
    score += 5;
  }

  return score;
}

function mergeScoresInto(target: Match, source: Match): Match {
  if (!hasMatchScore(source)) {
    return target;
  }

  const sameTeams =
    getMatchKey(target) === getMatchKey(source) || teamsLikelySame(target, source);
  if (!sameTeams) {
    return target;
  }

  return applyScoresToMatch(target, source);
}

function findBestResultMatch(streamMatch: Match, resultPool: Match[]) {
  let best: Match | null = null;
  let bestScore = 3;

  for (const candidate of resultPool) {
    if (!hasMatchScore(candidate)) {
      continue;
    }

    const score = matchResultScore(streamMatch, candidate);
    if (score > bestScore) {
      best = candidate;
      bestScore = score;
    }
  }

  return best;
}

function mergeResultsIntoMatches(matches: Match[], resultMatches: Match[]) {
  const resultPool = resultMatches.filter((match) => hasMatchScore(match));
  if (!resultPool.length) {
    return matches;
  }

  const merged = matches.map((match) => {
    const exact = resultPool.find((result) => getMatchKey(result) === getMatchKey(match));
    const best = findBestResultMatch(match, resultPool);
    const source = exact ?? best;
    return source ? mergeScoresInto(match, source) : match;
  });

  const seen = new Set(merged.map((match) => getMatchKey(match)));
  for (const result of resultPool) {
    if (!isMatchFinished(result) || !hasMatchScore(result)) {
      continue;
    }

    const key = getMatchKey(result);
    if (seen.has(key)) {
      continue;
    }

    if (!isRecentMatchTime(result.time)) {
      continue;
    }

    merged.push(result);
    seen.add(key);
  }

  return merged;
}

export async function getFootballMatches(
  signal?: AbortSignal,
  onUpdate?: (matches: Match[]) => void,
): Promise<Match[]> {
  let matches = enrichMatchesWithLogos(await fetchMatches(PRIMARY_VERSION, signal));
  onUpdate?.(matches);

  const fallbackResults = await Promise.allSettled(MMK_ENDPOINTS.map((path) => fetchMmkMatches(path, signal)));

  for (const result of fallbackResults) {
    if (result.status === 'fulfilled') {
      matches = mergeUniqueMatches(matches, result.value);
    }
  }

  const resultResponses = await Promise.allSettled(
    MMK_RESULTS_ENDPOINTS.map((path) => fetchMmkMatches(path, signal)),
  );
  const resultMatches: Match[] = [];
  for (const result of resultResponses) {
    if (result.status === 'fulfilled') {
      resultMatches.push(...result.value);
    }
  }
  if (resultMatches.length) {
    matches = mergeResultsIntoMatches(matches, resultMatches);
  }

  matches = enrichMatchesWithLogos(matches);
  onUpdate?.(matches);

  if (!signal?.aborted) {
    matches = await resolveMissingTeamLogos(matches);
    onUpdate?.(matches);
  }

  return matches;
}

function resultDisplayKey(match: Match) {
  return `${match.homeTeam.name}|${match.awayTeam.name}|${getMatchTimeBucket(match.time)}`;
}

export async function fetchMatchResults(signal?: AbortSignal): Promise<Match[]> {
  const resultResponses = await Promise.allSettled(
    MMK_RESULTS_ENDPOINTS.map((path) => fetchMmkMatches(path, signal)),
  );

  const byKey = new Map<string, Match>();
  for (const result of resultResponses) {
    if (result.status !== 'fulfilled') {
      continue;
    }

    for (const match of result.value) {
      if (!hasMatchScore(match)) {
        continue;
      }

      const key = resultDisplayKey(match);
      const existing = byKey.get(key);
      if (!existing || !hasMatchScore(existing)) {
        byKey.set(key, match);
      }
    }
  }

  return Array.from(byKey.values())
    .filter((match) => isRecentMatchTime(match.time))
    .sort((a, b) => {
      const timeA = new Date(a.time).getTime() || 0;
      const timeB = new Date(b.time).getTime() || 0;
      return timeB - timeA;
    });
}

export type StreamQuality = 'fullhd' | 'hd' | 'sd';

export type StreamVariant = {
  quality: StreamQuality;
  label: string;
  url: string;
};

const QUALITY_ORDER: StreamQuality[] = ['fullhd', 'hd', 'sd'];
const QUALITY_LABELS: Record<StreamQuality, string> = {
  fullhd: 'Full HD',
  hd: 'HD',
  sd: 'SD',
};

function classifyStreamQuality(name: string, url: string): StreamQuality {
  const text = `${name} ${url}`.toLowerCase();

  if (text.includes('full') || text.includes('fhd') || text.includes('1080') || text.includes('uhd')) {
    return 'fullhd';
  }

  if (text.includes('lhd') || /\bhd\b/.test(text)) {
    return 'hd';
  }

  return 'sd';
}

function collectStreamEntries(match: Match) {
  const links = match.streamLinks ?? {};
  const entries: Array<{ name: string; url: string }> = [];

  for (const value of Object.values(links)) {
    if (typeof value === 'string' && value.startsWith('http')) {
      entries.push({ name: '', url: value });
      continue;
    }

    if (!value || typeof value !== 'object') {
      continue;
    }

    const record = value as Record<string, unknown>;
    const url =
      typeof record.url === 'string'
        ? record.url
        : Object.values(record).find(
            (nestedValue) => typeof nestedValue === 'string' && nestedValue.startsWith('http'),
          );

    if (typeof url === 'string') {
      entries.push({
        name: typeof record.name === 'string' ? record.name : '',
        url,
      });
    }
  }

  return entries;
}

export function getStreamVariants(match: Match): StreamVariant[] {
  const byQuality = new Map<StreamQuality, StreamVariant>();

  for (const entry of collectStreamEntries(match)) {
    const quality = classifyStreamQuality(entry.name, entry.url);
    const existing = byQuality.get(quality);

    if (!existing) {
      byQuality.set(quality, {
        quality,
        label: QUALITY_LABELS[quality],
        url: entry.url,
      });
      continue;
    }

    if (quality === 'fullhd' || (quality === 'hd' && !existing.url.includes('lhd') && entry.url.includes('lhd'))) {
      byQuality.set(quality, {
        quality,
        label: QUALITY_LABELS[quality],
        url: entry.url,
      });
    }
  }

  const seenUrls = new Set<string>();

  return QUALITY_ORDER.flatMap((quality) => {
    const variant = byQuality.get(quality);
    if (!variant || seenUrls.has(variant.url)) {
      return [];
    }

    seenUrls.add(variant.url);
    return [variant];
  });
}

export function hasStream(match: Match) {
  return getStreamVariants(match).length > 0;
}

export function getStreamUrl(match: Match, preferredQuality?: StreamQuality): string {
  const candidates = getStreamUrlCandidates(match, preferredQuality);
  return candidates[0] ?? '';
}

/** All stream URLs for a match (SD servers first, then HD) — used when one CDN fails. */
export function getStreamUrlCandidates(match: Match, preferredQuality?: StreamQuality): string[] {
  const entries = collectStreamEntries(match);
  const buckets: Record<StreamQuality, string[]> = { fullhd: [], hd: [], sd: [] };

  for (const entry of entries) {
    const quality = classifyStreamQuality(entry.name, entry.url);
    buckets[quality].push(entry.url);
  }

  const order: StreamQuality[] =
    preferredQuality === 'hd' || preferredQuality === 'fullhd'
      ? [preferredQuality, 'hd', 'sd', 'fullhd']
      : ['sd', 'hd', 'fullhd'];

  const seen = new Set<string>();
  const urls: string[] = [];

  for (const quality of order) {
    for (const url of buckets[quality]) {
      if (!seen.has(url)) {
        seen.add(url);
        urls.push(url);
      }
    }
  }

  return urls;
}

export function groupMatchesByLeague(matches: Match[]) {
  return matches.reduce<Record<string, Match[]>>((groups, match) => {
    const league = match.league?.name || 'Other';
    groups[league] = groups[league] ?? [];
    groups[league].push(match);
    return groups;
  }, {});
}
