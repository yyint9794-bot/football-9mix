import { APP_VERSION } from '../_generated/appVersion.mjs';

const VERSION_META_KEY = 'downloads/app-version.json';
const APK_PREFIX = 'downloads/9mix-football-v';
const PUBLIC_BASE = 'https://ballpwal.org/downloads';

function versionFromApkKey(key) {
  const match = String(key).match(/9mix-football-v(\d+)\.apk$/i);
  return match ? Number(match[1]) : 0;
}

function buildVersionPayload(code, base = APP_VERSION) {
  const versionCode = Math.max(code, base.versionCode ?? 0);
  const apkUrl = `${PUBLIC_BASE}/9mix-football-v${versionCode}.apk`;
  return {
    ...base,
    versionCode,
    versionName: base.versionName && versionCode === base.versionCode ? base.versionName : String(versionCode),
    apkUrl,
    apkUrlSite: apkUrl,
    apkUrlCdn: apkUrl,
    forceUpdate: base.forceUpdate !== false,
    minVersionCode: Math.max(base.minVersionCode ?? 0, versionCode),
    source: 'r2',
  };
}

/** R2 APK + app-version.json — R2 သို့ APK တင်ရုံနဲ့ update စစ် */
export async function resolveAppVersionFromR2(bucket) {
  if (!bucket) {
    return { ...APP_VERSION, source: 'static' };
  }

  let payload = { ...APP_VERSION };
  let r2Code = 0;

  try {
    const meta = await bucket.get(VERSION_META_KEY);
    if (meta) {
      const parsed = await meta.json();
      if (parsed?.versionCode > 0) {
        payload = { ...payload, ...parsed, source: 'r2-meta' };
        r2Code = parsed.versionCode;
      }
    }
  } catch {
    // ignore malformed meta
  }

  try {
    let cursor;
    do {
      const listed = await bucket.list({ prefix: APK_PREFIX, cursor, limit: 100 });
      for (const object of listed.objects ?? []) {
        const code = versionFromApkKey(object.key);
        if (code > r2Code) {
          r2Code = code;
        }
      }
      cursor = listed.truncated ? listed.cursor : undefined;
    } while (cursor);
  } catch {
    // list not available — meta only
  }

  if (r2Code > (payload.versionCode ?? 0)) {
    return buildVersionPayload(r2Code, payload);
  }

  if (r2Code > 0 && payload.versionCode === r2Code) {
    return buildVersionPayload(r2Code, payload);
  }

  return { ...payload, source: payload.source ?? 'static' };
}
