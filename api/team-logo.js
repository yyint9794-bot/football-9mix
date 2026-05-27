const ALLOWED_HOSTS = new Set([
  'sta.vnres.co',
  'assets.b365api.com',
  'upload.wikimedia.org',
  'wikipedia.org',
]);

export default async function handler(req, res) {
  const url = req.query?.url;

  if (!url || typeof url !== 'string') {
    res.status(400).end('Missing url');
    return;
  }

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    res.status(400).end('Invalid url');
    return;
  }

  if (!ALLOWED_HOSTS.has(parsed.hostname)) {
    res.status(403).end('Forbidden host');
    return;
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
      res.status(upstream.status).end('Upstream error');
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(buffer);
  } catch {
    res.status(502).end('Proxy error');
  }
}
