const ALLOWED_HOSTS = new Set(['pull.niues.live', 'pull.niur.live', 'pull.scstream.net']);

function isAllowedUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function proxyUrlFor(request, targetUrl) {
  const origin = new URL(request.url).origin;
  return `${origin}/api/hls-proxy?url=${encodeURIComponent(targetUrl)}`;
}

function rewriteManifest(body, sourceUrl, request) {
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

      return proxyUrlFor(request, absolute);
    })
    .join('\n');
}

export async function handleHlsProxy(request, streamReferer) {
  const url = new URL(request.url).searchParams.get('url');

  if (!url || !isAllowedUrl(url)) {
    return new Response('Invalid url', { status: 400 });
  }

  try {
    const upstream = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
        Referer: streamReferer,
        Accept: '*/*',
      },
    });

    if (!upstream.ok) {
      return new Response('Upstream error', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || '';
    const isManifest = url.includes('.m3u8') || contentType.includes('mpegurl');

    if (isManifest) {
      const text = await upstream.text();
      const rewritten = rewriteManifest(text, url, request);
      return new Response(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Cache-Control': 'no-store',
        },
      });
    }

    return new Response(await upstream.arrayBuffer(), {
      status: 200,
      headers: {
        'Content-Type': contentType || 'video/mp2t',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new Response('Proxy error', { status: 502 });
  }
}
