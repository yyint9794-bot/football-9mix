import { APP_VERSION } from '../_generated/appVersion.mjs';

/** Live app version — static file deploy ဟောင်းဖြစ်ရင် API မှ ပြန် */
export async function onRequest() {
  return new Response(JSON.stringify(APP_VERSION), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
