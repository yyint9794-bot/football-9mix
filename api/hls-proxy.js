const ALLOWED_HOSTS = new Set(['pull.niues.live', 'pull.niur.live', 'pull.scstream.net']);
const STREAM_REFERER = process.env.STREAM_REFERER || 'https://livefootball.org/';

function isAllowedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function proxyUrlFor(req, targetUrl) {
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  const proto = req.headers['x-forwarded-proto'] || 'https';
  const base = `${proto}://${host}`;
  return `${base}/api/hls-proxy?url=${encodeURIComponent(targetUrl)}`;
}

function rewriteManifest(body, sourceUrl, req) {
  const base = new URL(sourceUrl);

  return body
    .split('\n')
    .map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        return line;
      }

      const absolute = new URL(trimmed, base).href;
      if (!isAllowedUrl(absolute)) {
        return line;
      }

      return proxyUrlFor(req, absolute);
    })
    .join('\n');
}

export default async function handler(req, res) {
  const url = req.query?.url;

  if (!url || typeof url !== 'string' || !isAllowedUrl(url)) {
    res.status(400).end('Invalid url');
    return;
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
        Referer: STREAM_REFERER,
        Accept: '*/*',
      },
    });

    if (!upstream.ok) {
      res.status(upstream.status).end('Upstream error');
      return;
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isManifest = url.includes('.m3u8') || contentType.includes('mpegurl');

    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, url, req);
      res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
      res.setHeader('Cache-Control', 'no-store');
      res.status(200).send(rewritten);
      return;
    }

    const buffer = Buffer.from(await upstream.arrayBuffer());
    res.setHeader('Content-Type', contentType || 'video/mp2t');
    res.setHeader('Cache-Control', 'no-store');
    res.status(200).send(buffer);
  } catch {
    res.status(502).end('Proxy error');
  }
}
