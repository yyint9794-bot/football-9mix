/**
 * APK → Cloudflare R2 (GitHub မသုံး — ဖိုင် MB ကြီးရင် OK)
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import { apkFileName, apkR2Key, loadApkHostingConfig } from './apk-hosting.mjs';
import { requireCloudflareEnv } from './cloudflare-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';
const gradleText = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradleText)?.[1] ?? 1);

const config = loadApkHostingConfig();
const versionedPath = join(root, 'public', 'downloads', apkFileName(versionCode));
const latestPath = join(root, 'public', 'downloads', '9mix-football.apk');

if (!existsSync(versionedPath)) {
  console.error(`APK not found: ${versionedPath}\nRun: npm run android:apk`);
  process.exit(1);
}

const { token, accountId, wranglerEnv } = requireCloudflareEnv();
const bytes = statSync(versionedPath).size;
console.log(`Uploading APK (${Math.round(bytes / 1024 / 1024)} MB) → R2 "${config.bucket}"`);

function wrangler(args, { allowFail = false } = {}) {
  const result = spawnSync(
    'npx',
    ['wrangler', ...args, '--account-id', accountId],
    {
      cwd: root,
      encoding: 'utf8',
      shell: true,
      env: wranglerEnv,
    },
  );
  const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (out) {
    console.log(out);
  }
  if (result.status !== 0 && !allowFail) {
    console.error(`\nwrangler ${args.join(' ')} failed (exit ${result.status})`);
    return false;
  }
  return result.status === 0 || allowFail;
}

console.log('\n① Cloudflare whoami…');
if (!wrangler(['whoami'])) {
  console.error('\nToken မှား သို့မဟုတ် account id မကိုက်');
  process.exit(1);
}

console.log('\n② R2 bucket…');
const listed = wrangler(['r2', 'bucket', 'list'], { allowFail: true });
if (!listed) {
  console.warn('r2 bucket list failed — token မှာ R2:Edit permission ထည့်ပါ');
}

wrangler(['r2', 'bucket', 'create', config.bucket], { allowFail: true });

function putObject(key, file) {
  console.log(`\n③ Put ${key} …`);
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
      '--account-id',
      accountId,
    ],
    { cwd: root, encoding: 'utf8', shell: true, env: wranglerEnv },
  );
  const out = `${result.stdout || ''}${result.stderr || ''}`.trim();
  if (out) {
    console.log(out);
  }
  return result.status === 0;
}

const versionKey = apkR2Key(versionCode);
if (!putObject(versionKey, versionedPath)) {
  console.error('\n❌ R2 upload failed');
  console.error('Cloudflare API Token permissions လိုသည်:');
  console.error('  • Account → R2 → Edit');
  console.error('  • Account → Workers R2 Storage → Edit (သို့မဟုတ် Read+Write)');
  console.error(`Bucket: ${config.bucket}`);
  console.error(`Key: ${versionKey}`);
  process.exit(1);
}

if (existsSync(latestPath)) {
  const latestKey = `${config.r2KeyPrefix.replace(/\/$/, '')}/9mix-football.apk`;
  putObject(latestKey, latestPath);
}

console.log(`\n✓ R2 upload OK: ${versionKey}`);
console.log(`  ${config.publicBaseUrl}/${apkFileName(versionCode)}`);
console.log('\nPages binding: football-9mix → APK_BUCKET →', config.bucket);
