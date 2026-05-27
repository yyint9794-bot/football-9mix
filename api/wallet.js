import * as wallet from '../server/walletStore.mjs';

function getToken(req) {
  const auth = req.headers.authorization || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  return req.query?.token || '';
}

async function readBody(req) {
  if (req.method === 'GET') {
    return {};
  }
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      try {
        resolve(raw ? JSON.parse(raw) : {});
      } catch {
        resolve({});
      }
    });
  });
}

export default async function handler(req, res) {
  const segments = String(req.query?.path || '')
    .split('/')
    .filter(Boolean);
  const token = getToken(req);
  const body = await readBody(req);

  try {
    if (segments[0] === 'login' && req.method === 'POST') {
      const result = await wallet.walletLogin(String(body.username || ''), String(body.password || ''));
      res.status(result.error ? 401 : 200).json(result);
      return;
    }

    if (segments[0] === 'logout' && req.method === 'POST') {
      await wallet.walletLogout(token);
      res.status(200).json({ ok: true });
      return;
    }

    if (segments[0] === 'me' && req.method === 'GET') {
      const result = await wallet.walletMe(token);
      res.status(result.error ? 401 : 200).json(result);
      return;
    }

    if (segments[0] === 'accept-terms' && req.method === 'POST') {
      const result = await wallet.walletAcceptTerms(token);
      res.status(result.error ? 401 : 200).json(result);
      return;
    }

    if (segments[0] === 'transactions' && req.method === 'GET') {
      const result = await wallet.userListTransactions(token);
      res.status(result.error ? 401 : 200).json(result);
      return;
    }

    if (segments[0] === 'request' && req.method === 'POST') {
      const result = await wallet.userRequestTransaction(
        token,
        body.type === 'withdraw' ? 'withdraw' : 'deposit',
        body.amount,
        body.note,
      );
      res.status(result.error ? 400 : 200).json(result);
      return;
    }

    if (segments[0] === 'admin' && segments[1] === 'users') {
      if (req.method === 'GET' && segments.length === 2) {
        const result = await wallet.adminListUsers(token);
        res.status(result.error ? 403 : 200).json(result);
        return;
      }
      if (req.method === 'POST' && segments.length === 2) {
        const result = await wallet.adminCreateUser(token, body);
        res.status(result.error ? 400 : 200).json(result);
        return;
      }
      if (req.method === 'PATCH' && segments[2]) {
        const result = await wallet.adminUpdateUser(token, segments[2], body);
        res.status(result.error ? 400 : 200).json(result);
        return;
      }
    }

    if (segments[0] === 'admin' && segments[1] === 'transactions') {
      if (req.method === 'GET') {
        const result = await wallet.adminListTransactions(token, {
          userId: req.query?.userId || undefined,
          status: req.query?.status || undefined,
        });
        res.status(result.error ? 403 : 200).json(result);
        return;
      }
      if (req.method === 'POST' && segments.length === 2) {
        const result = await wallet.adminPostTransaction(token, body);
        res.status(result.error ? 400 : 200).json(result);
        return;
      }
      if (req.method === 'POST' && segments[2] === 'review' && segments[3]) {
        const result = await wallet.adminReviewTransaction(
          token,
          segments[3],
          body.decision === 'approve' ? 'approve' : 'reject',
          body.note,
        );
        res.status(result.error ? 400 : 200).json(result);
        return;
      }
    }

    res.status(404).json({ error: 'Not found' });
  } catch (error) {
    res.status(500).json({ error: error instanceof Error ? error.message : 'Server error' });
  }
}
