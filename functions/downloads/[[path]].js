/** APK ဒေါင်းလုဒ် — Cloudflare R2 (GitHub မသုံး) */
export async function onRequest(context) {
  const segment = context.params.path;
  const filename = Array.isArray(segment) ? segment.join('/') : String(segment || '');
  if (!filename || !/^9mix-football(-v\d+)?\.apk$/i.test(filename)) {
    return new Response('Not found', { status: 404 });
  }

  const bucket = context.env.APK_BUCKET;
  if (!bucket) {
    return new Response('APK storage not configured (R2 binding APK_BUCKET)', { status: 503 });
  }

  const key = `downloads/${filename}`;
  const object = await bucket.get(key);
  if (!object) {
    const html = `<!DOCTYPE html>
<html lang="my"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>APK မတွေ့ပါ</title>
<style>body{font-family:system-ui,sans-serif;background:#07111f;color:#e2e8f0;margin:1.5rem;text-align:center}
a{display:inline-block;margin-top:1rem;padding:.9rem 1.2rem;background:#22c55e;color:#052e16;font-weight:700;text-decoration:none;border-radius:10px}
p{color:#94a3b8;font-size:.9rem;line-height:1.5}</style></head><body>
<h1>APK မတွေ့ပါ</h1>
<p><strong>${filename}</strong> က Cloudflare R2 မှာ မတင်ရသေးပါ။<br/>
GitHub → Actions → <strong>Upload APK to R2</strong> (သို့ <strong>App + Web release</strong>) Run workflow လုပ်ပါ။</p>
<a href="/apk.html">ပြန်သွားမည်</a></body></html>`;
    return new Response(html, {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  const headers = new Headers();
  headers.set('Content-Type', 'application/vnd.android.package-archive');
  headers.set('Content-Disposition', `attachment; filename="${filename}"`);
  headers.set('Cache-Control', 'public, max-age=120');
  if (object.httpMetadata?.contentLength) {
    headers.set('Content-Length', String(object.size ?? object.httpMetadata.contentLength));
  } else if (object.size) {
    headers.set('Content-Length', String(object.size));
  }

  return new Response(object.body, { headers });
}
