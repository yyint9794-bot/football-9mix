/**
 * APK → Cloudflare R2 (GitHub မသုံး — ဖိုင် MB ကြီးရင် OK)
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { apkFileName, apkR2Key, loadApkHostingConfig } from './apk-hosting.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradleText = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradleText)?.[1] ?? 1);

const config = loadApkHostingConfig();
const versionedPath = join(root, 'public', 'downloads', apkFileName(versionCode));
const latestPath = join(root, 'public', 'downloads', '9mix-football.apk');

if (!existsSync(versionedPath)) {
  console.error(`APK not found: ${versionedPath}\nRun: npm run android:apk`);
  process.exit(1);
}

const bytes = statSync(versionedPath).size;
console.log(`Uploading APK (${Math.round(bytes / 1024 / 1024)} MB) → R2 bucket "${config.bucket}"`);

const isWin = process.platform === 'win32';

function put(key, file) {
  const result = spawnSync(
    'npx',
    [
      'wrangler',
      'r2',
      'object',
      'put',
      key,
      '--file',
      file,
      '--bucket',
      config.bucket,
      '--remote',
      '--content-type',
      'application/vnd.android.package-archive',
    ],
    { cwd: root, stdio: 'inherit', shell: isWin, env: process.env },
  );
  return result.status === 0;
}

const versionKey = apkR2Key(versionCode);
if (!put(versionKey, versionedPath)) {
  console.error('\nR2 upload failed. Setup:');
  console.error('  1. Cloudflare → R2 → Create bucket:', config.bucket);
  console.error('  2. Pages → football-9mix → Settings → Functions → R2 binding: APK_BUCKET');
  console.error('  3. CLOUDFLARE_API_TOKEN + CLOUDFLARE_ACCOUNT_ID (GitHub Secrets မှာ ရှိပြီး)');
  process.exit(1);
}

if (existsSync(latestPath)) {
  const latestKey = `${config.r2KeyPrefix.replace(/\/$/, '')}/9mix-football.apk`;
  put(latestKey, latestPath);
}

console.log(`\n✓ R2: ${versionKey}`);
console.log(`  Download: ${config.publicBaseUrl}/${apkFileName(versionCode)}`);
