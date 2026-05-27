const PROXY_HOSTS =
  /(?:sta\.vnres\.co|assets\.b365api\.com|upload\.wikimedia\.org|wikipedia\.org)/i;

export function normalizeLogoUrl(logo: string | undefined) {
  const trimmed = logo?.trim();
  if (!trimmed || trimmed.startsWith('data:image')) {
    return '';
  }

  return trimmed;
}

export function extractMmkTeamLogo(
  team: Record<string, unknown> | undefined,
  side: 'home' | 'away',
  match: Record<string, unknown>,
) {
  const fromTeam = [team?.image_url, team?.imageUrl, team?.logo, team?.logoUrl, team?.team_logo, team?.badge];

  const fromMatch =
    side === 'home'
      ? [match.home_team_image_url, match.homeTeamImageUrl, match.home_image_url]
      : [match.away_team_image_url, match.awayTeamImageUrl, match.away_image_url];

  for (const value of [...fromTeam, ...fromMatch]) {
    const url = normalizeLogoUrl(typeof value === 'string' ? value : '');
    if (url) {
      return url;
    }
  }

  return '';
}

export function buildTeamLogoSources(rawUrl: string) {
  if (!rawUrl) {
    return [];
  }

  const sources: string[] = [];

  if (PROXY_HOSTS.test(rawUrl)) {
    sources.push(`/api/team-logo?url=${encodeURIComponent(rawUrl)}`);
  }

  sources.push(rawUrl);

  return sources.filter((value, index, list) => list.indexOf(value) === index);
}
