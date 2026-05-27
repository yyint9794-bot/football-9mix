import * as wallet from './server/walletStore.mjs';
function readBody(req) {
    return new Promise((resolve) => {
        let raw = '';
        req.on('data', (chunk) => {
            raw += chunk;
        });
        req.on('end', () => {
            if (!raw.trim()) {
                resolve({});
                return;
            }
            try {
                resolve(JSON.parse(raw));
            }
            catch {
                resolve({});
            }
        });
    });
}
function getToken(req) {
    const auth = req.headers.authorization || '';
    if (auth.startsWith('Bearer ')) {
        return auth.slice(7).trim();
    }
    const url = new URL(req.url ?? '', 'http://localhost');
    return url.searchParams.get('token') || '';
}
function sendJson(res, status, payload) {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(payload));
}
async function handleWalletApi(req, res) {
    const rawPath = (req.url ?? '/').split('?')[0] || '/';
    const segments = rawPath.replace(/^\//, '').split('/').filter(Boolean);
    const token = getToken(req);
    const body = req.method === 'GET' ? {} : await readBody(req);
    try {
        if (segments[0] === 'login' && req.method === 'POST') {
            const result = await wallet.walletLogin(String(body.username || ''), String(body.password || ''));
            sendJson(res, result.error ? 401 : 200, result);
            return;
        }
        if (segments[0] === 'logout' && req.method === 'POST') {
            await wallet.walletLogout(token);
            sendJson(res, 200, { ok: true });
            return;
        }
        if (segments[0] === 'me' && req.method === 'GET') {
            const result = await wallet.walletMe(token);
            sendJson(res, result.error ? 401 : 200, result);
            return;
        }
        if (segments[0] === 'accept-terms' && req.method === 'POST') {
            const result = await wallet.walletAcceptTerms(token);
            sendJson(res, result.error ? 401 : 200, result);
            return;
        }
        if (segments[0] === 'transactions' && req.method === 'GET') {
            const result = await wallet.userListTransactions(token);
            sendJson(res, result.error ? 401 : 200, result);
            return;
        }
        if (segments[0] === 'request' && req.method === 'POST') {
            const result = await wallet.userRequestTransaction(token, body.type === 'withdraw' ? 'withdraw' : 'deposit', body.amount, body.note);
            sendJson(res, result.error ? 400 : 200, result);
            return;
        }
        if (segments[0] === 'admin' && segments[1] === 'users') {
            if (req.method === 'GET' && segments.length === 2) {
                const result = await wallet.adminListUsers(token);
                sendJson(res, result.error ? 403 : 200, result);
                return;
            }
            if (req.method === 'POST' && segments.length === 2) {
                const result = await wallet.adminCreateUser(token, body);
                sendJson(res, result.error ? 400 : 200, result);
                return;
            }
            if (req.method === 'PATCH' && segments[2]) {
                const result = await wallet.adminUpdateUser(token, segments[2], body);
                sendJson(res, result.error ? 400 : 200, result);
                return;
            }
        }
        if (segments[0] === 'admin' && segments[1] === 'transactions') {
            if (req.method === 'GET') {
                const query = new URL(req.url ?? '/', 'http://localhost').searchParams;
                const result = await wallet.adminListTransactions(token, {
                    userId: query.get('userId') || undefined,
                    status: query.get('status') || undefined,
                });
                sendJson(res, result.error ? 403 : 200, result);
                return;
            }
            if (req.method === 'POST' && segments.length === 2) {
                const result = await wallet.adminPostTransaction(token, body);
                sendJson(res, result.error ? 400 : 200, result);
                return;
            }
            if (req.method === 'POST' && segments[2] === 'review' && segments[3]) {
                const result = await wallet.adminReviewTransaction(token, segments[3], body.decision === 'approve' ? 'approve' : 'reject', body.note);
                sendJson(res, result.error ? 400 : 200, result);
                return;
            }
        }
        sendJson(res, 404, { error: 'Not found' });
    }
    catch (error) {
        sendJson(res, 500, { error: error instanceof Error ? error.message : 'Server error' });
    }
}
function attachWalletApi(middlewares) {
    middlewares.use('/api/wallet', (req, res) => {
        void handleWalletApi(req, res);
    });
}
export function walletApiPlugin() {
    return {
        name: 'wallet-api',
        configureServer(server) {
            attachWalletApi(server.middlewares);
        },
        configurePreviewServer(server) {
            attachWalletApi(server.middlewares);
        },
    };
}
