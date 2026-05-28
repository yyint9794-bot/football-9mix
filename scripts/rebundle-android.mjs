/**
 * Thin APK ကို assets ထဲ ထည့်ပြီး release ပြန် build (APK chain မကြီးအောင်)
 */
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apkKeepNames, readVersionCode } from './apk-downloads-dir.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const versionCode = readVersionCode();
const keepApks = apkKeepNames(versionCode);
const publicDownloads = join(root, 'public', 'downloads');
const assetsDownloads = join(root, 'android', 'app', 'src', 'main', 'assets', 'public', 'downloads');
const maxBundleBytes = 10 * 1024 * 1024;

mkdirSync(assetsDownloads, { recursive: true });

for (const name of keepApks) {
  const src = join(publicDownloads, name);
  if (!existsSync(src)) {
    console.error(`Missing ${src} — run thin build first`);
    process.exit(1);
  }
  const bytes = statSync(src).size;
  if (bytes > maxBundleBytes) {
    console.error(
      `Refuse to bundle ${name} (${Math.round(bytes / 1024 / 1024)} MB). Delete public/downloads and run android:apk:thin`,
    );
    process.exit(1);
  }
  copyFileSync(src, join(assetsDownloads, name));
}

console.log(`Copied thin APK v${versionCode} into Android assets`);

const gradle = spawnSync(process.execPath, [join(root, 'scripts', 'run-gradle.mjs')], {
  stdio: 'inherit',
});
process.exit(gradle.status ?? 1);
