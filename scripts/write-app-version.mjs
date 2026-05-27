import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const gradle = readFileSync(gradlePath, 'utf8');

const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 1);
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? '1.0';

const payload = {
  versionCode,
  versionName,
  apkUrl: `https://ballpwal.org/downloads/9mix-football.apk?v=${versionCode}`,
  releaseNotes: 'ပြင်ဆင်မှုနှင့် ကြေးရလဒ် အသစ်များ',
};

const outPath = join(root, 'public', 'app-version.json');
writeFileSync(outPath, JSON.stringify(payload, null, 2), 'utf8');
console.log(`Wrote ${outPath} — v${versionName} (${versionCode})`);
