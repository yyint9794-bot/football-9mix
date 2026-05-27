import { useKvWalletStorage } from '../../../server/walletStorage.mjs';
import { handleWalletRequest } from '../../../server/walletHttp.mjs';

export async function onRequest(context) {
  useKvWalletStorage(context.env.WALLET_KV);
  return handleWalletRequest(context.request);
}
