/**
 * App + Web တစ်ခါတည်း — build.gradle versionCode မြှင့်ပြီး:
 *   npm run release
 * GitHub push → CI က APK + ballpwal.org deploy လုပ်ပေး
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const isWin = process.platform === 'win32';

function run(cmd, args = []) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
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
console.log('=== 9Mix release (App + Web download အော်တို) ===');
console.log(`Target: v${versionName} (build ${versionCode})\n`);

console.log('① Build APK + sync app-version.json, web download…\n');
const apkStatus = run('npm', ['run', 'android:apk']);
if (apkStatus !== 0) {
  console.warn(
    '\n⚠ APK build မအောင်မြင်ပါ (Java/Android SDK). Version ဖိုင်တွေသာ sync လုပ်မယ် — push ပြီးရင် GitHub Actions က APK build လုပ်ပေးမည်.\n',
  );
  if (run('node', ['scripts/write-app-version.mjs']) !== 0) process.exit(1);
}

const syncFiles = [
  'public/app-version.json',
  'src/native/publishedVersion.ts',
  'src/appDownload.ts',
  'functions/_generated/appVersion.mjs',
];
const apkPath = 'public/downloads/9mix-football.apk';
if (existsSync(join(root, apkPath))) syncFiles.unshift(apkPath);

run('git', ['add', ...syncFiles, 'android/app/build.gradle']);

if (run('git', ['diff', '--staged', '--quiet']) === 0) {
  console.log('\nပြောင်းလဲမှု မရှိ — ရှိပြီးသား sync ဖြစ်နေပါတယ်.');
} else {
  const msg = `release: app v${versionCode} (${versionName}) + web APK download`;
  if (run('git', ['commit', '-m', msg]) !== 0) {
    console.error('\nCommit မအောင်မြင်ပါ — git config / changes စစ်ပါ.');
    process.exit(1);
  }
  console.log(`\n② Committed: ${msg}`);
}

if (process.env.SKIP_PUSH === '1') {
  console.log('\nSKIP_PUSH=1 — push မလုပ်ပါ. လက်ဖြင့်: git push origin main');
  process.exit(0);
}

console.log('\n③ push → GitHub Actions က Web + APK တင်ပေး (လက်ဖြင့် Web upload မလို)\n');
process.exit(run('git', ['push', 'origin', 'main']));
