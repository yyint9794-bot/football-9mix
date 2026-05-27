/**
 * App + Web — APK → Cloudflare R2 (GitHub မသုံး)
 *   npm run release
 *   npm run release:bump
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const isWin = process.platform === 'win32';

function run(cmd, args = []) {
  const useShell = isWin && (cmd === 'npm' || cmd === 'npm.cmd');
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: useShell,
  });
  return result.status ?? 1;
}

function readVersion() {
  const gradle = readFileSync(gradlePath, 'utf8');
  return {
    gradle,
    versionCode: Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 0),
    versionName: /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? '1.0.0',
  };
}

function bumpGradle() {
  const { gradle, versionCode, versionName } = readVersion();
  const nextCode = versionCode + 1;
  const parts = versionName.split('.').map((n) => Number(n) || 0);
  while (parts.length < 3) parts.push(0);
  parts[2] += 1;
  const nextName = parts.join('.');
  let next = gradle.replace(/versionCode\s+\d+/, `versionCode ${nextCode}`);
  next = next.replace(/versionName\s+"[^"]+"/, `versionName "${nextName}"`);
  writeFileSync(gradlePath, next, 'utf8');
  console.log(`Bumped: v${versionName} (${versionCode}) → v${nextName} (${nextCode})\n`);
  return { versionCode: nextCode, versionName: nextName };
}

const bump = process.argv.includes('--bump');
if (bump) bumpGradle();

const { versionCode, versionName } = readVersion();
console.log('=== 9Mix release (R2 + ballpwal.org — GitHub APK မသုံး) ===');
console.log(`Target: v${versionName} (build ${versionCode})\n`);

console.log('① APK build…\n');
const apkStatus = run('npm', ['run', 'android:apk']);
if (apkStatus !== 0) {
  console.warn('\n⚠ APK build မအောင်မြင်ပါ.\n');
  run('node', ['scripts/write-app-version.mjs']);
  run('node', ['scripts/sync-web-download.mjs']);
} else {
  console.log('\n② Upload APK → Cloudflare R2…\n');
  const uploadStatus = run('node', ['scripts/upload-apk-r2.mjs']);
  if (uploadStatus !== 0) {
    console.warn('\n⚠ R2 upload မအောင်မြင်ပါ — Dashboard မှာ bucket + binding စစ်ပါ (docs/APK_HOSTING_R2.md)\n');
  }
}

const syncFiles = [
  'android/app/build.gradle',
  'apk-hosting.config.json',
  'public/app-version.json',
  'public/firebase-config.json',
  'public/_redirects',
  'public/apk.html',
  'src/native/publishedVersion.ts',
  'src/appDownload.ts',
  'functions/_generated/appVersion.mjs',
  'functions/downloads/[[path]].js',
  'wrangler.toml',
];

run('git', ['add', ...syncFiles]);

if (run('git', ['diff', '--staged', '--quiet']) === 0) {
  console.log('\nပြောင်းလဲမှု မရှိ.');
} else {
  const msg = `release: v${versionCode} ${versionName} r2-apk-hosting`;
  if (run('git', ['commit', '-m', msg]) !== 0) {
    process.exit(1);
  }
  console.log(`\n③ Committed: ${msg}`);
}

if (process.env.SKIP_PUSH === '1') {
  console.log('\nSKIP_PUSH=1');
  process.exit(0);
}

console.log('\n④ git push → Pages deploy (APK=R2, GitHub မသုံး)\n');
process.exit(run('git', ['push', 'origin', 'main']));
