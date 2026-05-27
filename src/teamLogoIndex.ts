import { getWikiLogoForTeam, seedWikiLogosIntoIndex } from './teamLogoResolver';
import { normalizeLogoUrl } from './teamLogoUrl';
import type { Match } from './types';

/** Exact team name → logo URL (no fuzzy token matching). */
let streamLogoIndex = new Map<string, string>();

function stripTeamSuffix(name: string) {
  return name
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(women|woman|wfc|ladies|femenino|femenina|feminine)\b/gi, ' ')
    .replace(/\b(fc|cf|sc|afc|ud|cff|de|la|el|the)\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function normalizeTeamKey(name: string) {
  return stripTeamSuffix(name)
    .toLowerCase()
    .replace(/[^a-z0-9\u1000-\u109f]/g, '');
}

function registerExactLogo(index: Map<string, string>, name: string, logo: string) {
  const normalized = normalizeLogoUrl(logo);
  if (!normalized || !name.trim()) {
    return;
  }

  const keys = new Set<string>();
  const trimmed = name.trim();
  const primary = normalizeTeamKey(trimmed);
  const stripped = normalizeTeamKey(stripTeamSuffix(trimmed));

  if (primary.length >= 3) {
    keys.add(primary);
  }
  if (stripped.length >= 3) {
    keys.add(stripped);
  }

  for (const key of keys) {
    index.set(key, normalized);
  }
}

export function seedStreamLogoIndex(matches: Match[]) {
  for (const match of matches) {
    const homeLogo = normalizeLogoUrl(match.homeTeam?.logo);
    const awayLogo = normalizeLogoUrl(match.awayTeam?.logo);

    if (homeLogo) {
      registerExactLogo(streamLogoIndex, match.homeTeam.name, homeLogo);
      if (match.homeEngName) {
        registerExactLogo(streamLogoIndex, String(match.homeEngName), homeLogo);
      }
    }

    if (awayLogo) {
      registerExactLogo(streamLogoIndex, match.awayTeam.name, awayLogo);
      if (match.awayEngName) {
        registerExactLogo(streamLogoIndex, String(match.awayEngName), awayLogo);
      }
    }
  }
}

export function mergeExternalLogos(entries: Array<{ name: string; logo: string }>) {
  for (const entry of entries) {
    registerExactLogo(streamLogoIndex, entry.name, entry.logo);
  }
}

export function lookupTeamLogo(name: string, index: Map<string, string> = streamLogoIndex) {
  const trimmed = name.trim();
  if (!trimmed) {
    return '';
  }

  return (
    index.get(normalizeTeamKey(trimmed)) ||
    index.get(normalizeTeamKey(stripTeamSuffix(trimmed))) ||
    ''
  );
}

function resolveSideLogo(match: Match, side: 'home' | 'away', index: Map<string, string>) {
  const team = side === 'home' ? match.homeTeam : match.awayTeam;
  const engName = side === 'home' ? String(match.homeEngName || '') : String(match.awayEngName || '');
  const existing = normalizeLogoUrl(team?.logo);

  if (existing) {
    return existing;
  }

  const candidates = [engName, team?.name || ''].filter(Boolean);
  for (const candidate of candidates) {
    const fromIndex = lookupTeamLogo(candidate, index);
    if (fromIndex) {
      return fromIndex;
    }
  }

  for (const candidate of candidates) {
    const fromWiki = getWikiLogoForTeam(candidate);
    if (fromWiki) {
      return fromWiki;
    }
  }

  return '';
}

export function enrichMatchesWithLogos(matches: Match[]) {
  streamLogoIndex = new Map();
  seedWikiLogosIntoIndex();
  seedStreamLogoIndex(matches);
  const logoIndex = streamLogoIndex;

  return matches.map((match) => {
    const homeLogo = resolveSideLogo(match, 'home', logoIndex);
    const awayLogo = resolveSideLogo(match, 'away', logoIndex);
    const leagueLogo = normalizeLogoUrl(match.league?.logo) || '';

    if (
      homeLogo === match.homeTeam?.logo &&
      awayLogo === match.awayTeam?.logo &&
      leagueLogo === (match.league?.logo || '')
    ) {
      return match;
    }

    return {
      ...match,
      league: {
        ...match.league,
        logo: leagueLogo,
      },
      homeTeam: {
        ...match.homeTeam,
        logo: homeLogo,
      },
      awayTeam: {
        ...match.awayTeam,
        logo: awayLogo,
      },
    };
  });
}

export function preloadMatchLogos(matches: Match[], limit = 300) {
  const seen = new Set<string>();

  for (const match of matches.slice(0, limit)) {
    for (const logo of [match.homeTeam.logo, match.awayTeam.logo, match.league.logo]) {
      const url = normalizeLogoUrl(logo);
      if (!url || seen.has(url) || url.startsWith('data:')) {
        continue;
      }

      seen.add(url);
      const img = new Image();
      img.referrerPolicy = 'no-referrer';
      img.decoding = 'async';
      img.src = url.startsWith('http') ? `/api/team-logo?url=${encodeURIComponent(url)}` : url;
    }
  }
}
