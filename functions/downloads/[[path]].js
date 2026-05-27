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
    return new Response('APK not found', { status: 404 });
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
