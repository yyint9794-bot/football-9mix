import { useKvWalletStorage } from '../../../server/walletStorage.mjs';
import { handleWalletRequest } from '../../../server/walletHttp.mjs';

function jsonError(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function onRequest(context) {
  if (!context.env.WALLET_KV) {
    return jsonError(
      503,
      'WALLET_KV binding မရှိပါ — Cloudflare Pages → Settings → Functions → KV namespace WALLET_KV ချိတ်ပြီး Redeploy လုပ်ပါ',
    );
  }

  try {
    useKvWalletStorage(context.env.WALLET_KV);
    return await handleWalletRequest(context.request);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Wallet server error';
    return jsonError(500, message);
  }
}
