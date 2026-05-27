import { parseKickoffTime } from './liveMatch';
import type { Match } from './types';

type ScorePair = { home?: number; away?: number };

type MmkScoresPayload = {
  full_time?: ScorePair;
  half_time?: ScorePair;
};

function readScorePair(pair?: ScorePair) {
  if (!pair) {
    return null;
  }

  const home = Number(pair.home);
  const away = Number(pair.away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return null;
  }

  return { home, away };
}

export function parseMmkScoresPayload(match: Record<string, unknown>) {
  const raw = match.scores;
  if (raw && typeof raw === 'object') {
    const scores = raw as MmkScoresPayload;
    const fullTime = readScorePair(scores.full_time);
    if (fullTime) {
      const halfTime = readScorePair(scores.half_time);
      return {
        homeScore: fullTime.home,
        awayScore: fullTime.away,
        halfTimeHomeScore: halfTime?.home,
        halfTimeAwayScore: halfTime?.away,
        scores: raw,
      };
    }
  }

  const homeScore = Number(match.homeScore ?? match.home_score);
  const awayScore = Number(match.awayScore ?? match.away_score);
  if (Number.isFinite(homeScore) && Number.isFinite(awayScore)) {
    return {
      homeScore,
      awayScore,
      halfTimeHomeScore: undefined,
      halfTimeAwayScore: undefined,
      scores: match.scores,
    };
  }

  return null;
}

export function isMatchFinished(match: Match) {
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

export function hasMatchScore(match: Match) {
  const home = getMatchHomeScore(match);
  const away = getMatchAwayScore(match);
  return home != null && away != null;
}

export function getMatchHomeScore(match: Match) {
  const value = Number(match.homeScore ?? match.home_score);
  return Number.isFinite(value) ? value : null;
}

export function getMatchAwayScore(match: Match) {
  const value = Number(match.awayScore ?? match.away_score);
  return Number.isFinite(value) ? value : null;
}

export function formatMatchScore(match: Match) {
  const home = getMatchHomeScore(match);
  const away = getMatchAwayScore(match);
  if (home == null || away == null) {
    return null;
  }

  return `${home} - ${away}`;
}

export function formatHalfTimeScore(match: Match) {
  const home = Number(match.halfTimeHomeScore ?? match.half_time_home);
  const away = Number(match.halfTimeAwayScore ?? match.half_time_away);
  if (!Number.isFinite(home) || !Number.isFinite(away)) {
    return null;
  }

  return `ပထမပိုင်း ${home} - ${away}`;
}

export function applyScoresToMatch(match: Match, source: Match): Match {
  if (!hasMatchScore(source)) {
    return match;
  }

  return {
    ...match,
    homeScore: source.homeScore,
    awayScore: source.awayScore,
    halfTimeHomeScore: source.halfTimeHomeScore,
    halfTimeAwayScore: source.halfTimeAwayScore,
    scores: source.scores ?? match.scores,
    liveScoreFromApi: true,
    resultFromApi: true,
    status: isMatchFinished(source) ? String(source.status || 'completed') : match.status,
    completed: source.completed ?? match.completed,
    is_finished: source.is_finished ?? match.is_finished,
  };
}

export function isRecentMatchTime(time: string, maxDays = 21) {
  const parsed = parseKickoffTime(time);
  if (!parsed) {
    return true;
  }

  const ageMs = Date.now() - parsed.getTime();
  return ageMs >= 0 && ageMs <= maxDays * 24 * 60 * 60 * 1000;
}

export function listFinishedMatchesWithScores(matches: Match[]) {
  return matches
    .filter((match) => isMatchFinished(match) && hasMatchScore(match))
    .sort((a, b) => {
      const timeA = parseKickoffTime(a.time)?.getTime() ?? 0;
      const timeB = parseKickoffTime(b.time)?.getTime() ?? 0;
      return timeB - timeA;
    });
}
