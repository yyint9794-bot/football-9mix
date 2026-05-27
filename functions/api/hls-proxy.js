import { handleHlsProxy } from '../_shared/hlsProxy.mjs';

export async function onRequest(context) {
  const referer =
    context.env.STREAM_REFERER || 'https://ballpwal.org/';
  return handleHlsProxy(context.request, referer);
}
