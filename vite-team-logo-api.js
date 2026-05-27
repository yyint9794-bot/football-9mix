import { Buffer } from 'node:buffer';
const ALLOWED_HOSTS = new Set([
    'sta.vnres.co',
    'assets.b365api.com',
    'upload.wikimedia.org',
    'wikipedia.org',
]);
function attachTeamLogoProxy(middlewares) {
    middlewares.use('/api/team-logo', async (req, res) => {
        try {
            const requestUrl = new URL(req.url ?? '', 'http://localhost');
            const imageUrl = requestUrl.searchParams.get('url');
            if (!imageUrl) {
                res.statusCode = 400;
                res.end('Missing url');
                return;
            }
            const parsed = new URL(imageUrl);
            if (!ALLOWED_HOSTS.has(parsed.hostname)) {
                res.statusCode = 403;
                res.end('Forbidden host');
                return;
            }
            const upstream = await fetch(imageUrl, {
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; FootballStreamHub/1.0)',
                    Accept: 'image/*,*/*',
                    Referer: `${parsed.protocol}//${parsed.hostname}/`,
                },
            });
            if (!upstream.ok) {
                res.statusCode = upstream.status;
                res.end('Upstream error');
                return;
            }
            const buffer = Buffer.from(await upstream.arrayBuffer());
            res.statusCode = 200;
            res.setHeader('Content-Type', upstream.headers.get('content-type') || 'image/png');
            res.setHeader('Cache-Control', 'public, max-age=86400');
            res.end(buffer);
        }
        catch {
            res.statusCode = 502;
            res.end('Proxy error');
        }
    });
}
export function teamLogoApiPlugin() {
    return {
        name: 'team-logo-api',
        configureServer(server) {
            attachTeamLogoProxy(server.middlewares);
        },
        configurePreviewServer(server) {
            attachTeamLogoProxy(server.middlewares);
        },
    };
}
