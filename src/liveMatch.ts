import type { Match } from './types';

const MONTH_INDEX: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
};

/** Htay v7 times are local Thailand (UTC+7). */
const BANGKOK_OFFSET_MS = 7 * 60 * 60 * 1000;
const HALFTIME_BREAK_MIN = 15;

function bangkokLocalToDate(year: number, month: number, day: number, hour: number, minute: number) {
  return new Date(Date.UTC(year, month, day, hour, minute, 0, 0) - BANGKOK_OFFSET_MS);
}

function resolveYear(month: number, day: number, hour: number, minute: number, now = new Date()) {
  let year = now.getFullYear();
  let kickoff = bangkokLocalToDate(year, month, day, hour, minute);

  if (kickoff.getTime() - now.getTime() > 18 * 60 * 60 * 1000) {
    year -= 1;
    kickoff = bangkokLocalToDate(year, month, day, hour, minute);
  }

  if (now.getTime() - kickoff.getTime() > 36 * 60 * 60 * 1000) {
    year += 1;
    kickoff = bangkokLocalToDate(year, month, day, hour, minute);
  }

  return kickoff;
}

function parseV7DisplayTime(time: string) {
  const raw = String(time).trim().replace(/^(live|finished|completed)\s+/i, '');
  const match = raw.match(/^([A-Za-z]+)\s+(\d{1,2})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) {
    return null;
  }

  const month =
    MONTH_INDEX[match[1].toLowerCase()] ?? MONTH_INDEX[match[1].toLowerCase().slice(0, 3)];
  if (month === undefined) {
    return null;
  }

  const day = Number(match[2]);
  let hour = Number(match[3]);
  const minute = Number(match[4]);
  const isPm = match[5].toUpperCase() === 'PM';

  if (isPm && hour < 12) {
    hour += 12;
  }

  if (!isPm && hour === 12) {
    hour = 0;
  }

  return resolveYear(month, day, hour, minute);
}

export function parseKickoffTime(time: string) {
  const raw = String(time).trim().replace(/^(live|finished|completed)\s+/i, '');
  if (!raw) {
    return null;
  }

  const v7 = parseV7DisplayTime(raw);
  if (v7) {
    return v7;
  }

  const withYear = raw.match(/^([A-Za-z]+)\s+(\d{1,2}),?\s+(\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (withYear) {
    const month =
      MONTH_INDEX[withYear[1].toLowerCase()] ?? MONTH_INDEX[withYear[1].toLowerCase().slice(0, 3)];
    if (month !== undefined) {
      let hour = Number(withYear[4]);
      const minute = Number(withYear[5]);
      const isPm = withYear[6].toUpperCase() === 'PM';
      if (isPm && hour < 12) {
        hour += 12;
      }
      if (!isPm && hour === 12) {
        hour = 0;
      }

      return bangkokLocalToDate(Number(withYear[3]), month, Number(withYear[2]), hour, minute);
    }
  }

  const attempts = [raw, raw.replace(' ', 'T'), `${raw}, ${new Date().getFullYear()}`];
  for (const value of attempts) {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime()) && parsed.getFullYear() >= 2020) {
      return parsed;
    }
  }

  return null;
}

function hasStreamLinks(match: Match) {
  const links = match.streamLinks ?? {};
  return Object.keys(links).length > 0;
}

export function getKickoffDate(match: Match) {
  const displayTime = String(match.time || '').trim();
  if (displayTime) {
    const fromDisplay = parseKickoffTime(displayTime);
    if (fromDisplay) {
      return fromDisplay;
    }
  }

  if (!hasStreamLinks(match)) {
    const iso = String(match.startTime || match.start_time || '').trim();
    if (iso) {
      const parsed = new Date(iso);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  return null;
}

export function getElapsedMs(match: Match, now = Date.now()) {
  const kickoff = getKickoffDate(match);
  if (!kickoff) {
    return null;
  }

  return Math.max(0, now - kickoff.getTime());
}

/** Football match minute (90′ + stoppage), with 15′ halftime break. */
export function formatLiveMatchMinute(elapsedMs: number) {
  if (elapsedMs < 60_000) {
    return { text: 'မကြာမီ', detail: 'ပွဲမစသေးပါ' };
  }

  const totalMin = Math.floor(elapsedMs / 60_000);

  if (totalMin <= 45) {
    return { text: `${totalMin}′`, detail: `ပထမပိုင်း · ${totalMin}/90 မိနစ်` };
  }

  if (totalMin < 45 + HALFTIME_BREAK_MIN) {
    return { text: 'ပတ်လယ်', detail: 'နားချိန်' };
  }

  const matchMinute = totalMin - (45 + HALFTIME_BREAK_MIN) + 46;

  if (matchMinute >= 90) {
    const extra = matchMinute - 90;
    return {
      text: extra > 0 ? `90+${extra}′` : `90′`,
      detail: extra > 0 ? `အချိန်စော · ${90 + extra}/90 မိနစ်` : 'ပွဲနီးပါး',
    };
  }

  return { text: `${matchMinute}′`, detail: `ဒုတိယပိုင်း · ${matchMinute}/90 မိနစ်` };
}
