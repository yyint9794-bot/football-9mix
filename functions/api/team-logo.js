import { handleTeamLogoProxy } from '../_shared/teamLogoProxy.mjs';

export async function onRequest(context) {
  return handleTeamLogoProxy(context.request);
}
