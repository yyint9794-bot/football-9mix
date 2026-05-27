import { enrichMatchesWithLogos, mergeExternalLogos, normalizeTeamKey } from './teamLogoIndex';
import { normalizeLogoUrl } from './teamLogoUrl';
import type { Match } from './types';

const WIKI_CACHE_KEY = 'football-team-logo-wiki-v3';
const wikiMemory = new Map<string, string>();
const inflight = new Map<string, Promise<string>>();

function readWikiCache() {
  try {
    const raw = localStorage.getItem(WIKI_CACHE_KEY) || sessionStorage.getItem(WIKI_CACHE_KEY);
    if (!raw) {
      return;
    }

    const parsed = JSON.parse(raw) as Record<string, string>;
    for (const [key, url] of Object.entries(parsed)) {
      if (key && url) {
        wikiMemory.set(key, url);
      }
    }
  } catch {
    // ignore corrupt cache
  }
}

function writeWikiCache() {
  try {
    const payload: Record<string, string> = {};
    for (const [key, url] of wikiMemory) {
      payload[key] = url;
    }
    localStorage.setItem(WIKI_CACHE_KEY, JSON.stringify(payload));
    sessionStorage.setItem(WIKI_CACHE_KEY, JSON.stringify(payload));
  } catch {
    // storage full or disabled
  }
}

readWikiCache();

function hasLatinTeamName(name: string) {
  return /[a-zA-Z]{4,}/.test(name);
}

export function getWikiLogoForTeam(name: string) {
  if (!hasLatinTeamName(name)) {
    return '';
  }

  const key = normalizeTeamKey(name);
  if (!key) {
    return '';
  }

  return wikiMemory.get(key) ?? '';
}

export function seedWikiLogosIntoIndex() {
  for (const [key, logo] of wikiMemory) {
    if (key.length >= 4) {
      mergeExternalLogos([{ name: key, logo }]);
    }
  }
}

function wikiTitleCandidates(engName: string) {
  const stripped = engName
    .replace(/\(w\)/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
  const slug = stripped.replace(/\s+/g, '_');
  const candidates = [
    `${slug}_Femenino`,
    `${slug}_Femení`,
    `FC_${slug}`,
    slug,
    `${stripped} W.F.C.`,
    stripped,
  ];

  return [...new Set(candidates.filter(Boolean))];
}

async function fetchWikipediaSummary(title: string) {
  const response = await fetch(
    `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, '_'))}`,
    {
      headers: {
        'User-Agent': 'FootballStreamHub/1.0',
      },
    },
  );

  if (!response.ok) {
    return '';
  }

  const data = (await response.json()) as { thumbnail?: { source?: string } };
  return normalizeLogoUrl(data.thumbnail?.source);
}

async function fetchWikipediaSearch(query: string) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: `${query} football club`,
    format: 'json',
    origin: '*',
    srlimit: '5',
  });

  const response = await fetch(`https://en.wikipedia.org/w/api.php?${params.toString()}`);
  if (!response.ok) {
    return '';
  }

  const data = (await response.json()) as {
    query?: { search?: Array<{ title?: string }> };
  };

  for (const hit of data.query?.search ?? []) {
    if (!hit.title) {
      continue;
    }

    const logo = await fetchWikipediaSummary(hit.title);
    if (logo) {
      return logo;
    }
  }

  return '';
}

async function resolveWikipediaLogo(engName: string) {
  if (!hasLatinTeamName(engName)) {
    return '';
  }

  const cacheKey = normalizeTeamKey(engName);
  if (!cacheKey) {
    return '';
  }

  const cached = wikiMemory.get(cacheKey);
  if (cached) {
    return cached;
  }

  const pending = inflight.get(cacheKey);
  if (pending) {
    return pending;
  }

  const task = (async () => {
    for (const title of wikiTitleCandidates(engName)) {
      const logo = await fetchWikipediaSummary(title);
      if (logo) {
        wikiMemory.set(cacheKey, logo);
        writeWikiCache();
        return logo;
      }
    }

    const searched = await fetchWikipediaSearch(engName.replace(/\(w\)/gi, '').trim());
    if (searched) {
      wikiMemory.set(cacheKey, searched);
      writeWikiCache();
      return searched;
    }

    return '';
  })();

  inflight.set(cacheKey, task);

  try {
    return await task;
  } finally {
    inflight.delete(cacheKey);
  }
}

async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<R>,
) {
  const results: R[] = [];
  let index = 0;

  async function run() {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]);
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

export async function resolveMissingTeamLogos(matches: Match[]) {
  const needed = new Map<string, string>();

  for (const match of matches) {
    const sides = [
      { engName: String(match.homeEngName || ''), team: match.homeTeam },
      { engName: String(match.awayEngName || ''), team: match.awayTeam },
    ];

    for (const side of sides) {
      const name = side.engName.trim() || side.team?.name?.trim() || '';
      if (!name || !hasLatinTeamName(name) || normalizeLogoUrl(side.team?.logo)) {
        continue;
      }

      const key = normalizeTeamKey(name);
      if (!key || wikiMemory.has(key) || needed.has(key)) {
        continue;
      }

      needed.set(key, name);
    }
  }

  if (!needed.size) {
    return enrichMatchesWithLogos(matches);
  }

  const names = [...needed.values()];
  const resolved = await mapWithConcurrency(names, 8, async (name) => {
    const logo = await resolveWikipediaLogo(name);
    return logo ? { name, logo } : null;
  });

  const entries = resolved.filter((entry): entry is { name: string; logo: string } => Boolean(entry));
  if (entries.length) {
    mergeExternalLogos(entries);
  }

  return enrichMatchesWithLogos(matches);
}
