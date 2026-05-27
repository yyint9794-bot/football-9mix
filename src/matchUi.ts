import { hasStream } from './api';
import { extractMyanmarOdds, formatKickoffLabel } from './betting/odds';
import { parseKickoffTime } from './liveMatch';
import { hasMatchScore, isMatchFinished } from './matchScore';
import type { Match } from './types';

export { formatKickoffLabel };

export function parseMatchTime(time: string) {
  return parseKickoffTime(time);
}

export function getMatchKickoffDate(match: Match) {
  const iso = String(match.startTime || match.start_time || '').trim();
  if (iso) {
    const parsedIso = new Date(iso);
    if (!Number.isNaN(parsedIso.getTime())) {
      return parsedIso;
    }
  }

  return parseMatchTime(match.time);
}

export function getMatchDateKey(match: Match) {
  const parsed = getMatchKickoffDate(match);
  if (!parsed) {
    return 'undated';
  }

  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const day = String(parsed.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateKey() {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isCompletedMatch(match: Match) {
  return isMatchFinished(match);
}

export function isStreamLive(match: Match) {
  if (!hasStream(match) || isCompletedMatch(match)) {
    return false;
  }

  const status = String(match.status).toLowerCase();
  return status.includes('live') || status.includes('in play') || status.includes('playing');
}

function isWithinLiveWindow(match: Match) {
  const start = parseMatchTime(match.time);
  if (!start) {
    return false;
  }

  const now = Date.now();
  const kickoff = start.getTime();
  const fullTime = kickoff + 2.5 * 60 * 60 * 1000;

  return now >= kickoff - 15 * 60 * 1000 && now <= fullTime;
}

export function isLiveMatch(match: Match) {
  if (isStreamLive(match)) {
    return true;
  }

  if (isCompletedMatch(match) || !isWithinLiveWindow(match)) {
    return false;
  }

  const status = String(match.status).toLowerCase();
  return (
    hasStream(match) &&
    (status === 'active' || status.includes('1h') || status.includes('2h') || status.includes('live'))
  );
}

export function canWatchMatch(match: Match) {
  return hasStream(match) && !isCompletedMatch(match);
}

/** မောင်း / ဘော်ဒီ — ပြီးသွားပွဲ၊ ရလဒ်ပါပွဲ မပြရ */
export function isOpenForBetting(match: Match) {
  if (isCompletedMatch(match) || hasMatchScore(match)) {
    return false;
  }

  const kickoff = getMatchKickoffDate(match);
  if (kickoff && kickoff.getTime() < Date.now() - 2 * 60 * 60 * 1000) {
    return false;
  }

  const status = String(match.status || '').toLowerCase();
  if (
    status.includes('finished') ||
    status.includes('completed') ||
    status.includes('ft') ||
    status.includes('ended')
  ) {
    return false;
  }

  return true;
}

export function isUpcomingMatch(match: Match) {
  if (isCompletedMatch(match) || isLiveMatch(match)) {
    return false;
  }

  const start = getMatchKickoffDate(match);
  if (!start) {
    const status = String(match.status || '').toLowerCase();
    return status.includes('coming') || status.includes('scheduled') || status.includes('not started');
  }

  return start.getTime() > Date.now() - 10 * 60 * 1000;
}

export function isFinishedResultMatch(match: Match) {
  return isCompletedMatch(match) && hasMatchScore(match);
}

export function isCurrentOrFutureMatch(match: Match) {
  const dateKey = getMatchDateKey(match);
  if (dateKey === 'undated') {
    return !isCompletedMatch(match);
  }

  if (dateKey >= getTodayDateKey()) {
    return true;
  }

  return isLiveMatch(match);
}

export function compareFeaturedMatches(a: Match, b: Match) {
  const liveDiff = Number(isLiveMatch(b)) - Number(isLiveMatch(a));
  const streamDiff = Number(hasStream(b)) - Number(hasStream(a));
  const oddsDiff = Number(extractMyanmarOdds(b).length > 0) - Number(extractMyanmarOdds(a).length > 0);

  return liveDiff || streamDiff || oddsDiff || String(a.time).localeCompare(String(b.time));
}

export function formatMatchDateLabel(dateKey: string) {
  if (dateKey === 'undated') {
    return 'ရက်စွဲမသိ';
  }

  const parsed = new Date(`${dateKey}T12:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(parsed);
  target.setHours(0, 0, 0, 0);
  const dayDiff = Math.round((target.getTime() - today.getTime()) / 86400000);

  if (dayDiff === 0) {
    return 'ယနေ့';
  }

  if (dayDiff === 1) {
    return 'မနက်ဖြန်';
  }

  return parsed.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function groupMatchesByDate(matches: Match[]) {
  const groups = matches.reduce<Record<string, Match[]>>((acc, match) => {
    const key = getMatchDateKey(match);
    acc[key] = acc[key] ?? [];
    acc[key].push(match);
    return acc;
  }, {});

  return Object.entries(groups).sort(([dateA], [dateB]) => {
    if (dateA === 'undated') {
      return 1;
    }
    if (dateB === 'undated') {
      return -1;
    }
    return dateA.localeCompare(dateB);
  });
}
