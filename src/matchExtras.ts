import { getStreamUrl } from './api';
import type { Match } from './types';

const API_KEY = import.meta.env.VITE_HTAY_API_KEY ?? 'demoapi';
const BASE_URL = 'https://htayapi.com';
const FOOTBALL_VERSION = import.meta.env.VITE_HTAY_FOOTBALL_VERSION ?? 'v7';

export type MatchExtraKind = 'facts' | 'lineup' | 'table' | 'stats';

export type MatchFactItem = {
  label: string;
  value: string;
};

export type LineupPlayer = {
  name: string;
  number: string;
  position: string;
};

export type LineupSide = {
  team: string;
  formation: string;
  starters: LineupPlayer[];
  substitutes: LineupPlayer[];
};

export type TableRow = {
  rank: string;
  team: string;
  played: string;
  won: string;
  drawn: string;
  lost: string;
  points: string;
};

export type MatchStatRow = {
  label: string;
  home: string;
  away: string;
};

export type MatchExtrasPayload = {
  facts: MatchFactItem[];
  lineup: LineupSide[];
  table: TableRow[];
  stats: MatchStatRow[];
};

const EMPTY: MatchExtrasPayload = {
  facts: [],
  lineup: [],
  table: [],
  stats: [],
};

const MATCH_FIELD_KEYS: Record<MatchExtraKind, string[]> = {
  facts: ['facts', 'fact', 'matchFacts', 'match_facts', 'events', 'timeline', 'detail'],
  lineup: ['lineup', 'lineups', 'line_up', 'formation', 'squads'],
  table: ['table', 'standings', 'leagueTable', 'league_table', 'standing'],
  stats: ['stats', 'statistics', 'matchStats', 'match_stats', 'stat'],
};

const DEFAULT_PATHS: Record<MatchExtraKind, string[]> = {
  facts: [`/football/${FOOTBALL_VERSION}/facts`, `/football/${FOOTBALL_VERSION}/match/facts`],
  lineup: [`/football/${FOOTBALL_VERSION}/lineup`, `/football/${FOOTBALL_VERSION}/match/lineup`],
  table: [`/football/${FOOTBALL_VERSION}/table`, `/football/${FOOTBALL_VERSION}/standings`],
  stats: [`/football/${FOOTBALL_VERSION}/stats`, `/football/${FOOTBALL_VERSION}/match/stats`],
};

const ENV_PATHS: Record<MatchExtraKind, string | undefined> = {
  facts: import.meta.env.VITE_HTAY_FACTS_PATH,
  lineup: import.meta.env.VITE_HTAY_LINEUP_PATH,
  table: import.meta.env.VITE_HTAY_TABLE_PATH,
  stats: import.meta.env.VITE_HTAY_STATS_PATH,
};

function asText(value: unknown) {
  if (value === undefined || value === null || value === '') {
    return '';
  }

  return String(value);
}

export function extractFixtureId(match: Match): string | null {
  const streamUrl = getStreamUrl(match);
  const fromStream = streamUrl.match(/stream-(\d+)_/i)?.[1];
  if (fromStream) {
    return fromStream;
  }

  const rawId = String(match.id || match.matchId || match.fixture_id || '');
  const numeric = rawId.match(/(\d{5,})/)?.[1];
  return numeric ?? null;
}

function pickEmbedded(match: Match, kind: MatchExtraKind) {
  for (const key of MATCH_FIELD_KEYS[kind]) {
    const value = match[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return null;
}

function normalizeFacts(data: unknown, match: Match): MatchFactItem[] {
  const rows: MatchFactItem[] = [];

  const push = (label: string, value: unknown) => {
    const text = asText(value);
    if (text) {
      rows.push({ label, value: text });
    }
  };

  if (Array.isArray(data)) {
    for (const item of data) {
      if (typeof item === 'string') {
        push('အချက်အလက်', item);
        continue;
      }

      if (item && typeof item === 'object') {
        const record = item as Record<string, unknown>;
        push(
          asText(record.label || record.type || record.title || record.minute) || 'အချက်အလက်',
          record.value ?? record.text ?? record.detail ?? record.description,
        );
      }
    }
  } else if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      if (typeof value === 'string' || typeof value === 'number') {
        push(key, value);
      }
    }
  }

  if (!rows.length) {
    push('လိဂ်', match.league?.name);
    push('အချိန်', match.time);
    push('အခြေအနေ', match.status);
    push('အိမ်ရှင်', match.homeTeam?.name);
    push('ဧည့်', match.awayTeam?.name);
  }

  return rows;
}

function normalizePlayers(list: unknown): LineupPlayer[] {
  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const player =
        record.player && typeof record.player === 'object'
          ? (record.player as Record<string, unknown>)
          : record;

      const name = asText(player.name || player.player_name);
      if (!name) {
        return null;
      }

      return {
        name,
        number: asText(player.number || player.shirt_number) || '—',
        position: asText(player.pos || player.position) || '—',
      };
    })
    .filter((row): row is LineupPlayer => Boolean(row));
}

function normalizeLineup(data: unknown, match: Match): LineupSide[] {
  const sides: LineupSide[] = [];

  const pushSide = (side: unknown, fallbackTeam: string) => {
    if (!side || typeof side !== 'object') {
      return;
    }

    const record = side as Record<string, unknown>;
    const teamRecord = record.team && typeof record.team === 'object' ? (record.team as Record<string, unknown>) : {};
    const team = asText(teamRecord.name || record.team || record.team_name) || fallbackTeam;
    const starters = normalizePlayers(record.startXI ?? record.starters ?? record.starting ?? record.lineup);
    const substitutes = normalizePlayers(record.substitutes ?? record.subs ?? record.bench);

    if (team || starters.length || substitutes.length) {
      sides.push({
        team,
        formation: asText(record.formation) || '—',
        starters,
        substitutes,
      });
    }
  };

  if (Array.isArray(data)) {
    for (const side of data) {
      pushSide(side, match.homeTeam?.name || 'အသင်း');
    }
  } else if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    pushSide(record.home ?? record.homeTeam, match.homeTeam?.name || 'အိမ်ရှင်');
    pushSide(record.away ?? record.awayTeam, match.awayTeam?.name || 'ဧည့်');

    if (!sides.length) {
      pushSide(record, match.homeTeam?.name || 'အသင်း');
    }
  }

  return sides;
}

function normalizeTable(data: unknown): TableRow[] {
  const list = Array.isArray(data)
    ? data
    : data && typeof data === 'object'
      ? ((data as Record<string, unknown>).standings ??
        (data as Record<string, unknown>).table ??
        (data as Record<string, unknown>).rows ??
        (data as Record<string, unknown>).data)
      : [];

  if (!Array.isArray(list)) {
    return [];
  }

  return list
    .map((entry, index) => {
      if (!entry || typeof entry !== 'object') {
        return null;
      }

      const record = entry as Record<string, unknown>;
      const teamRecord = record.team && typeof record.team === 'object' ? (record.team as Record<string, unknown>) : {};
      const all = record.all && typeof record.all === 'object' ? (record.all as Record<string, unknown>) : record;

      const team = asText(teamRecord.name || record.team || record.team_name);
      if (!team) {
        return null;
      }

      return {
        rank: asText(record.rank || record.position || index + 1),
        team,
        played: asText(all.played ?? record.played ?? record.mp),
        won: asText(all.win ?? record.won ?? record.w),
        drawn: asText(all.draw ?? record.drawn ?? record.d),
        lost: asText(all.lose ?? record.lost ?? record.l),
        points: asText(record.points ?? record.pts ?? record.point),
      };
    })
    .filter((row): row is TableRow => Boolean(row));
}

function normalizeStats(data: unknown): MatchStatRow[] {
  if (Array.isArray(data)) {
    return data
      .map((entry) => {
        if (!entry || typeof entry !== 'object') {
          return null;
        }

        const record = entry as Record<string, unknown>;
        const label = asText(record.type || record.label || record.name || record.stat);
        const home = asText(record.home ?? record.home_value ?? record.homeValue);
        const away = asText(record.away ?? record.away_value ?? record.awayValue);

        if (!label) {
          return null;
        }

        return { label, home: home || '0', away: away || '0' };
      })
      .filter((row): row is MatchStatRow => Boolean(row));
  }

  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    const homeStats = record.home && typeof record.home === 'object' ? (record.home as Record<string, unknown>) : {};
    const awayStats = record.away && typeof record.away === 'object' ? (record.away as Record<string, unknown>) : {};
    const keys = new Set([...Object.keys(homeStats), ...Object.keys(awayStats)]);

    return Array.from(keys).map((key) => ({
      label: key,
      home: asText(homeStats[key]) || '0',
      away: asText(awayStats[key]) || '0',
    }));
  }

  return [];
}

function normalizeKind<K extends MatchExtraKind>(
  kind: K,
  data: unknown,
  match: Match,
): MatchExtrasPayload[K] {
  switch (kind) {
    case 'facts':
      return normalizeFacts(data, match) as MatchExtrasPayload[K];
    case 'lineup':
      return normalizeLineup(data, match) as MatchExtrasPayload[K];
    case 'table':
      return normalizeTable(data) as MatchExtrasPayload[K];
    case 'stats':
      return normalizeStats(data) as MatchExtrasPayload[K];
    default:
      return [] as MatchExtrasPayload[K];
  }
}

function unwrapPayload(json: unknown, kind: MatchExtraKind) {
  if (!json || typeof json !== 'object') {
    return json;
  }

  const record = json as Record<string, unknown>;
  const keyed =
    kind === 'lineup'
      ? (record.lineup ?? record.lineups)
      : kind === 'table'
        ? (record.table ?? record.standings ?? record.leagueTable)
        : kind === 'stats'
          ? (record.stats ?? record.statistics)
          : record.facts;

  return record.data ?? record.response ?? record.result ?? keyed ?? json;
}

async function fetchFromPath(path: string, match: Match, signal?: AbortSignal) {
  const fixtureId = extractFixtureId(match);
  const params = new URLSearchParams({ key: API_KEY });

  if (fixtureId) {
    params.set('fixture_id', fixtureId);
    params.set('matchId', fixtureId);
    params.set('id', fixtureId);
  }

  params.set('league', match.league?.name || '');
  params.set('home', match.homeTeam?.name || '');
  params.set('away', match.awayTeam?.name || '');

  const url = `${BASE_URL}${path}${path.includes('?') ? '&' : '?'}${params.toString()}`;
  const response = await fetch(url, {
    signal,
    headers: {
      'X-HtayApi-Key': API_KEY,
      'X-HtayApi-Platform': 'web',
    },
  });

  if (!response.ok) {
    return null;
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('json')) {
    return null;
  }

  return response.json();
}

export async function fetchMatchExtra<K extends MatchExtraKind>(
  match: Match,
  kind: K,
  signal?: AbortSignal,
): Promise<MatchExtrasPayload[K]> {
  const embedded = pickEmbedded(match, kind);
  if (embedded) {
    const normalized = normalizeKind(kind, embedded, match);
    if (normalized.length) {
      return normalized;
    }
  }

  const paths = [ENV_PATHS[kind], ...DEFAULT_PATHS[kind]].filter(
    (path, index, list): path is string => Boolean(path) && list.indexOf(path) === index,
  );

  for (const path of paths) {
    try {
      const json = await fetchFromPath(path, match, signal);
      if (!json) {
        continue;
      }

      const payload = unwrapPayload(json, kind);
      const normalized = normalizeKind(kind, payload, match);
      if (normalized.length) {
        return normalized;
      }
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        throw error;
      }
    }
  }

  if (kind === 'facts') {
    return normalizeFacts(null, match) as MatchExtrasPayload[K];
  }

  return EMPTY[kind] as MatchExtrasPayload[K];
}

export async function fetchAllMatchExtras(match: Match, signal?: AbortSignal): Promise<MatchExtrasPayload> {
  const [facts, lineup, table, stats] = await Promise.all([
    fetchMatchExtra(match, 'facts', signal),
    fetchMatchExtra(match, 'lineup', signal),
    fetchMatchExtra(match, 'table', signal),
    fetchMatchExtra(match, 'stats', signal),
  ]);

  return { facts, lineup, table, stats };
}
