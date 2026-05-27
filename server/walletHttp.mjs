import * as wallet from './walletStore.mjs';

function getToken(request) {
  const auth = request.headers.get('authorization') || '';
  if (auth.startsWith('Bearer ')) {
    return auth.slice(7).trim();
  }
  const url = new URL(request.url);
  return url.searchParams.get('token') || '';
}

async function readBody(request) {
  if (request.method === 'GET' || request.method === 'HEAD') {
    return {};
  }
  const raw = await request.text();
  if (!raw.trim()) {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function jsonResponse(status, payload) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleWalletRequest(request) {
  const url = new URL(request.url);
  const pathMatch = url.pathname.match(/^\/api\/wallet\/?(.*)$/);
  const segments = (pathMatch?.[1] || '').split('/').filter(Boolean);
  const token = getToken(request);
  const body = await readBody(request);

  try {
    if (segments[0] === 'login' && request.method === 'POST') {
      const result = await wallet.walletLogin(String(body.username || ''), String(body.password || ''));
      return jsonResponse(result.error ? 401 : 200, result);
    }

    if (segments[0] === 'logout' && request.method === 'POST') {
      await wallet.walletLogout(token);
      return jsonResponse(200, { ok: true });
    }

    if (segments[0] === 'me' && request.method === 'GET') {
      const result = await wallet.walletMe(token);
      return jsonResponse(result.error ? 401 : 200, result);
    }

    if (segments[0] === 'accept-terms' && request.method === 'POST') {
      const result = await wallet.walletAcceptTerms(token);
      return jsonResponse(result.error ? 401 : 200, result);
    }

    if (segments[0] === 'transactions' && request.method === 'GET') {
      const result = await wallet.userListTransactions(token);
      return jsonResponse(result.error ? 401 : 200, result);
    }

    if (segments[0] === 'request' && request.method === 'POST') {
      const result = await wallet.userRequestTransaction(
        token,
        body.type === 'withdraw' ? 'withdraw' : 'deposit',
        body.amount,
        body.note,
      );
      return jsonResponse(result.error ? 400 : 200, result);
    }

    if (segments[0] === 'admin' && segments[1] === 'users') {
      if (request.method === 'GET' && segments.length === 2) {
        const result = await wallet.adminListUsers(token);
        return jsonResponse(result.error ? 403 : 200, result);
      }
      if (request.method === 'POST' && segments.length === 2) {
        const result = await wallet.adminCreateUser(token, body);
        return jsonResponse(result.error ? 400 : 200, result);
      }
      if (request.method === 'PATCH' && segments[2]) {
        const result = await wallet.adminUpdateUser(token, segments[2], body);
        return jsonResponse(result.error ? 400 : 200, result);
      }
    }

    if (segments[0] === 'admin' && segments[1] === 'transactions') {
      if (request.method === 'GET') {
        const result = await wallet.adminListTransactions(token, {
          userId: url.searchParams.get('userId') || undefined,
          status: url.searchParams.get('status') || undefined,
        });
        return jsonResponse(result.error ? 403 : 200, result);
      }
      if (request.method === 'POST' && segments.length === 2) {
        const result = await wallet.adminPostTransaction(token, body);
        return jsonResponse(result.error ? 400 : 200, result);
      }
      if (request.method === 'POST' && segments[2] === 'review' && segments[3]) {
        const result = await wallet.adminReviewTransaction(
          token,
          segments[3],
          body.decision === 'approve' ? 'approve' : 'reject',
          body.note,
        );
        return jsonResponse(result.error ? 400 : 200, result);
      }
    }

    return jsonResponse(404, { error: 'Not found' });
  } catch (error) {
    return jsonResponse(500, {
      error: error instanceof Error ? error.message : 'Server error',
    });
  }
}
