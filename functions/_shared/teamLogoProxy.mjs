const ALLOWED_HOSTS = new Set([
  'sta.vnres.co',
  'assets.b365api.com',
  'upload.wikimedia.org',
  'wikipedia.org',
]);

export async function handleTeamLogoProxy(request) {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response('Missing url', { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return new Response('Invalid url', { status: 400 });
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    return new Response('Forbidden host', { status: 403 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
        Accept: 'image/*,*/*',
        Referer: `${parsed.protocol}//${parsed.hostname}/`,
      },
    });

    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status });
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': upstream.headers.get('content-type') || 'image/png',
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch {
    return new Response('Proxy error', { status: 502 });
  }
}
