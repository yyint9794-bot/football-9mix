import type { IncomingMessage, ServerResponse } from 'node:http';
import { Buffer } from 'node:buffer';
import type { Plugin } from 'vite';

const ALLOWED_HOSTS = new Set(['pull.niues.live', 'pull.niur.live', 'pull.scstream.net']);
const STREAM_REFERER = 'https://livefootball.org/';

function isAllowedUrl(rawUrl: string) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.protocol === 'https:' && ALLOWED_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
}

function getPublicOrigin(req: IncomingMessage) {
  const hostHeader =
    (typeof req.headers['x-forwarded-host'] === 'string' ? req.headers['x-forwarded-host'] : '') ||
    req.headers.host ||
    'localhost:5173';
  const host = hostHeader.split(',')[0].trim();
  const hostName = host.replace(/:\d+$/, '');
  const forwarded = req.headers['x-forwarded-proto'];
  const protoFromHeader =
    typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : '';
  const isLocalHost =
    hostName === 'localhost' ||
    hostName === '127.0.0.1' ||
    /^\d+\.\d+\.\d+\.\d+$/.test(hostName);
  const proto = protoFromHeader || (isLocalHost ? 'http' : 'https');
  return `${proto}://${host}`;
}

function proxyUrlFor(req: IncomingMessage, targetUrl: string) {
  return `${getPublicOrigin(req)}/api/hls-proxy?url=${encodeURIComponent(targetUrl)}`;
}

function rewriteManifest(body: string, sourceUrl: string, req: IncomingMessage) {
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

function attachHlsProxy(middlewares: { use: (path: string, handler: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void }) {
  middlewares.use('/api/hls-proxy', async (req: IncomingMessage, res: ServerResponse) => {
        try {
          const requestUrl = new URL(req.url ?? '', 'http://localhost');
          const targetUrl = requestUrl.searchParams.get('url');

          if (!targetUrl || !isAllowedUrl(targetUrl)) {
            res.statusCode = 400;
            res.end('Invalid url');
            return;
          }

          const upstream = await fetch(targetUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
              Referer: STREAM_REFERER,
              Accept: '*/*',
            },
          });

          if (!upstream.ok) {
            res.statusCode = upstream.status;
            res.end('Upstream error');
            return;
          }

          const contentType = upstream.headers.get('content-type') || '';
          const isManifest = targetUrl.includes('.m3u8') || contentType.includes('mpegurl');

          if (isManifest) {
            const text = await upstream.text();
            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
            res.setHeader('Cache-Control', 'no-store');
            res.end(rewriteManifest(text, targetUrl, req));
            return;
          }

          const buffer = Buffer.from(await upstream.arrayBuffer());
          res.statusCode = 200;
          res.setHeader('Content-Type', contentType || 'video/mp2t');
          res.setHeader('Cache-Control', 'no-store');
          res.end(buffer);
        } catch {
          res.statusCode = 502;
          res.end('Proxy error');
        }
  });
}

export function hlsProxyPlugin(): Plugin {
  return {
    name: 'hls-proxy',
    configureServer(server) {
      attachHlsProxy(server.middlewares);
    },
    configurePreviewServer(server) {
      attachHlsProxy(server.middlewares);
    },
  };
}
