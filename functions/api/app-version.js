import { resolveAppVersionFromR2 } from '../lib/resolveAppVersion.mjs';

/** Live version — R2 ထဲ APK / app-version.json (R2 upload သာ လုပ်ရင်လည်း update ပေါ်) */
export async function onRequest(context) {
  const version = await resolveAppVersionFromR2(context.env.APK_BUCKET);

  return new Response(JSON.stringify(version), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  });
}
