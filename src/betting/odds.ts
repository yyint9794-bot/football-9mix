import { hasMyanmarOdds, isOddsClosed } from '../api';
import { parseKickoffTime } from '../liveMatch';
import type { Match } from '../types';
import type { BettingMatchRow, OddsBodySection, OddsGoalSection, OddsSection } from './types';

function resolveBodyGivingTeam(match: Match, homeName: string, awayName: string, homeLine: string) {
  if (homeLine.startsWith('-')) {
    return homeName;
  }
  if (homeLine.startsWith('+')) {
    return awayName;
  }
  const oddsTeam = String(match.oddsTeam || match.odds_team || '').toLowerCase();
  if (oddsTeam === 'home') {
    return homeName;
  }
  if (oddsTeam === 'away') {
    return awayName;
  }
  return homeName;
}

function formatLine(value: unknown) {
  return value === undefined || value === null || value === '' ? '' : String(value);
}

function formatOddsRate(value: unknown) {
  return formatLine(value);
}

function extractStructuredOdds(value: Record<string, unknown>, match: Match): OddsSection[] {
  const sections: OddsSection[] = [];
  const homeName = match.homeTeam?.name || 'အိမ်ရှင်အသင်း';
  const awayName = match.awayTeam?.name || 'ဧည့်အသင်း';
  const handicap = value.handicap as Record<string, unknown> | undefined;
  const overUnder = value.over_under as Record<string, unknown> | undefined;

  const hasStructuredHandicap =
    handicap &&
    typeof handicap === 'object' &&
    (formatLine(handicap.home_line) ||
      formatLine(handicap.away_line) ||
      formatOddsRate(handicap.home_price) !== '' ||
      formatOddsRate(handicap.away_price) !== '');

  if (hasStructuredHandicap) {
    const homeLine = formatLine(handicap.home_line);
    const awayLine = formatLine(handicap.away_line);
    const homePrice = formatOddsRate(handicap.home_price);
    const awayPrice = formatOddsRate(handicap.away_price);

    sections.push({
      kind: 'body',
      title: 'ဘော်ဒီ',
      givingTeam: resolveBodyGivingTeam(match, homeName, awayName, homeLine),
      homeLine: homeLine || '—',
      homeRate: homePrice || '—',
      awayLine: awayLine || '—',
      awayRate: awayPrice || '—',
    });
  }

  if (overUnder && typeof overUnder === 'object') {
    const goalLine = formatLine(overUnder.line);
    const overRate = formatOddsRate(overUnder.over_price);
    const underRate = formatOddsRate(overUnder.under_price);

    if (goalLine || overRate || underRate) {
      sections.push({
        kind: 'goal',
        title: 'ဂိုးပေါင်း',
        goalLine: goalLine || '—',
        overRate: overRate || '—',
        underRate: underRate || '—',
      });
    }
  }

  const bodyLine = formatLine(value.body ?? value.bodyGap);
  const bodyPrice = formatOddsRate(value.price ?? value.goalsGap);

  if (!hasStructuredHandicap && (bodyLine || bodyPrice)) {
    sections.push({
      kind: 'body',
      title: 'ဘော်ဒီ',
      givingTeam: resolveBodyGivingTeam(match, homeName, awayName, bodyLine),
      homeLine: bodyLine || '—',
      homeRate: bodyPrice || '—',
      awayLine: '—',
      awayRate: '—',
    });
  }

  if ('goalTotal' in value || 'goalTotalPrice' in value) {
    const goalLine = formatLine(value.goalTotal);
    const goalPrice = formatOddsRate(value.goalTotalPrice);

    if (goalLine || goalPrice) {
      sections.push({
        kind: 'goal',
        title: 'ဂိုးပေါင်း',
        goalLine: goalLine || '—',
        overRate: goalPrice || '—',
        underRate: '—',
      });
    }
  }

  return sections.slice(0, 3);
}

export function extractMyanmarOdds(match: Match): OddsSection[] {
  const oddsKeys = [
    'myanmarOdds',
    'myanmar_odds',
    'mmOdds',
    'mm_odds',
    'oddsMyanmar',
    'odds_myanmar',
    'myanmarPrice',
    'myanmar_price',
    'betting',
    'odds',
    'handicap',
    'price',
    'market',
  ];

  for (const key of oddsKeys) {
    const value = match[key];
    if (!value) {
      continue;
    }

    if (typeof value === 'string' || typeof value === 'number') {
      return [
        {
          kind: 'body',
          title: 'ဘော်ဒီ',
          givingTeam: '—',
          homeLine: String(value),
          homeRate: '—',
          awayLine: '—',
          awayRate: '—',
        },
      ];
    }

    if (typeof value === 'object') {
      const structuredRows = extractStructuredOdds(value as Record<string, unknown>, match);
      if (structuredRows.length) {
        return structuredRows;
      }
    }
  }

  return [];
}

export function formatKickoffLabel(match: Match) {
  const parsed = parseKickoffTime(String(match.time || match.startTime || ''));
  if (!parsed) {
    return String(match.time || '—');
  }

  const day = String(parsed.getDate()).padStart(2, '0');
  const month = String(parsed.getMonth() + 1).padStart(2, '0');
  const year = parsed.getFullYear();
  const hours = parsed.getHours();
  const minutes = String(parsed.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${day}-${month}-${year} ${hour12}:${minutes} ${ampm}`;
}

/**
 * Myanmar ကြေး ပုံစံ (ပုံထဲကလို):
 * - ဘော်ဒီ: `1 -10`, `= -40`, `0.5 -50` (ဂိုးလိုင်း + ကော်မရှင်)
 * - ဂိုးပေါင်း: `3 +55`, `2 -35`
 *
 * API ကုဒ်: 5=ငါးလုံး, 10=၁လုံး, 15=၁.၅လုံး, -2=၂လုံးပေး (structured)
 */
const LEGACY_HANDICAP_LINES: Record<number, string> = {
  5: '0.5',
  10: '1',
  15: '1.5',
  20: '2',
  25: '2.5',
  30: '3',
};

function decodeHandicapLine(line: string) {
  const trimmed = line.trim();
  if (!trimmed || trimmed === '—') {
    return '—';
  }
  if (trimmed === '0' || trimmed === '00' || trimmed === '=') {
    return '=';
  }

  const digits = trimmed.replace(/^[+\-=]/, '');
  const value = Number(digits);
  if (!Number.isFinite(value)) {
    return trimmed;
  }

  if (LEGACY_HANDICAP_LINES[value]) {
    return LEGACY_HANDICAP_LINES[value];
  }

  if (value >= 1 && value <= 9) {
    return String(value);
  }

  if (value >= 10 && value % 10 === 0) {
    return String(value / 10);
  }

  return String(value);
}

/** ကော်မရှင် ၅၀ အောက် = `-10`, အထက် = `+55` (ပုံထဲက ပုံစံ) */
export function formatMmkCommissionRate(rate: string | number) {
  const raw = String(rate).trim();
  if (!raw || raw === '—') {
    return '—';
  }
  if (/^[+\-]/.test(raw)) {
    return raw;
  }

  const value = Number(raw);
  if (!Number.isFinite(value)) {
    return raw;
  }

  if (value < 50) {
    return `-${value}`;
  }
  if (value > 50) {
    return `+${value}`;
  }
  return '50';
}

function joinBodyLineRate(line: string, rate: string) {
  const cleanLine = decodeHandicapLine(line);
  const cleanRate = formatMmkCommissionRate(rate);
  if (cleanLine === '—' && cleanRate === '—') {
    return '—';
  }
  if (cleanRate === '—') {
    return cleanLine || '—';
  }
  if (cleanLine === '—') {
    return cleanRate;
  }
  return `${cleanLine} ${cleanRate}`.trim();
}

function joinGoalLineRate(line: string, rate: string) {
  const cleanLine = decodeHandicapLine(line);
  const cleanRate = formatMmkCommissionRate(rate);
  if (cleanLine === '—' && cleanRate === '—') {
    return '—';
  }
  if (cleanRate === '—') {
    return cleanLine || '—';
  }
  if (cleanLine === '—') {
    return cleanRate;
  }
  return `${cleanLine} ${cleanRate}`.trim();
}

export function formatOddsDisplayPill(line: string, rate: string) {
  return joinBodyLineRate(line, rate);
}

export function getBodyGivingSide(section: OddsBodySection, match: Match): 'home' | 'away' {
  const oddsTeam = String(match.oddsTeam || match.odds_team || '').toLowerCase();
  if (oddsTeam === 'away') {
    return 'away';
  }
  if (oddsTeam === 'home') {
    return 'home';
  }

  const homeLine = section.homeLine.trim();
  const normalizedLine = decodeHandicapLine(homeLine);

  if (normalizedLine === '=' || homeLine === '0' || homeLine === '00') {
    if (match.homeUpper === false) {
      return 'away';
    }
    return 'home';
  }

  if (homeLine.startsWith('+')) {
    return 'away';
  }
  if (homeLine.startsWith('-')) {
    return 'home';
  }

  if (match.homeUpper === false) {
    return 'away';
  }
  return 'home';
}

export function formatBodyPillLabel(section: OddsBodySection, match: Match) {
  const side = getBodyGivingSide(section, match);
  if (side === 'home') {
    return joinBodyLineRate(section.homeLine, section.homeRate);
  }

  const awayLine =
    section.awayLine && section.awayLine !== '—'
      ? section.awayLine
      : section.homeLine.replace(/^[+\-]/, '') || section.homeLine;
  const awayRate =
    section.awayRate && section.awayRate !== '—' ? section.awayRate : section.homeRate;
  return joinBodyLineRate(awayLine, awayRate);
}

/** ကြေးပေးအသင်း —င်းအမည် + ကြေး (ဥပမာ `လိုဂန် လိုင်နင် 2.5 -5`) */
export function formatBodyGivingDisplay(section: OddsBodySection, match: Match) {
  const side = getBodyGivingSide(section, match);
  const teamName =
    side === 'home'
      ? match.homeTeam?.name || section.givingTeam
      : match.awayTeam?.name || section.givingTeam;
  const odds = formatBodyPillLabel(section, match);
  const name = String(teamName || '').trim();
  if (!name || name === '—') {
    return odds;
  }
  return `${name} ${odds}`;
}

export function formatBodyCenterLabel(section: OddsBodySection) {
  return joinBodyLineRate(section.homeLine, section.homeRate);
}

export function formatBodySideLabel(line: string, rate: string) {
  return joinBodyLineRate(line, rate);
}

function invertHandicapLine(line: string) {
  const trimmed = line.trim();
  if (trimmed.startsWith('-')) {
    return trimmed.replace('-', '+');
  }
  if (trimmed.startsWith('+')) {
    return trimmed.replace('+', '-');
  }
  if (trimmed === '=' || trimmed === '0') {
    return '=';
  }
  return `+${decodeHandicapLine(trimmed)}`;
}

export function formatBodyHomeOdds(section: OddsBodySection) {
  return joinBodyLineRate(section.homeLine, section.homeRate);
}

export function formatBodyAwayOdds(section: OddsBodySection, match: Match) {
  if (section.awayLine && section.awayLine !== '—') {
    return joinBodyLineRate(section.awayLine, section.awayRate);
  }
  const giving = getBodyGivingSide(section, match);
  if (giving === 'away') {
    return formatBodyPillLabel(section, match);
  }
  return joinBodyLineRate(invertHandicapLine(section.homeLine), section.homeRate);
}

export function formatBodyHomePickLabel(section: OddsBodySection, teamName: string, match?: Match) {
  if (match) {
    const giving = getBodyGivingSide(section, match);
    if (giving === 'away') {
      return `${teamName} ${joinBodyLineRate(invertHandicapLine(section.homeLine), section.homeRate)}`;
    }
  }
  return `${teamName} ${formatBodyHomeOdds(section)}`;
}

export function formatBodyAwayPickLabel(section: OddsBodySection, teamName: string, match: Match) {
  return `${teamName} ${formatBodyAwayOdds(section, match)}`;
}

export function formatGoalCenterLabel(section: OddsGoalSection, side: 'over' | 'under') {
  const rate = side === 'over' ? section.overRate : section.underRate;
  return joinGoalLineRate(section.goalLine, rate);
}

export function formatGoalSideLabel(line: string, rate: string) {
  return joinGoalLineRate(line, rate);
}

export function formatGoalPickLabel(section: OddsGoalSection, side: 'over' | 'under') {
  const prefix = side === 'over' ? 'Over' : 'Under';
  return `${prefix} ${formatGoalCenterLabel(section, side)}`;
}

function getKickoffMs(match: Match) {
  const parsed = parseKickoffTime(String(match.time || match.startTime || ''));
  return parsed?.getTime() ?? Number.MAX_SAFE_INTEGER;
}

export function buildBettingRows(matches: Match[]): BettingMatchRow[] {
  return matches
    .filter((match) => hasMyanmarOdds(match))
    .map((match) => {
      const sections = extractMyanmarOdds(match);
      const body = sections.find((section): section is OddsBodySection => section.kind === 'body');
      const goal = sections.find((section): section is OddsGoalSection => section.kind === 'goal');

      return {
        match,
        league: match.league?.name || 'လိဂ်',
        kickoffLabel: formatKickoffLabel(match),
        kickoffMs: getKickoffMs(match),
        body,
        goal,
        closed: isOddsClosed(match),
      };
    })
    .filter((row) => row.body || row.goal)
    .sort((a, b) => a.kickoffMs - b.kickoffMs);
}

export function sortBettingRows(rows: BettingMatchRow[]) {
  return [...rows].sort((a, b) => a.kickoffMs - b.kickoffMs);
}

export function groupBettingRowsByLeague(rows: BettingMatchRow[]) {
  const sorted = sortBettingRows(rows);
  const groups = new Map<string, BettingMatchRow[]>();
  for (const row of sorted) {
    const list = groups.get(row.league) ?? [];
    list.push(row);
    groups.set(row.league, list);
  }
  return [...groups.entries()].map(([league, leagueRows]) => ({ league, rows: leagueRows }));
}
