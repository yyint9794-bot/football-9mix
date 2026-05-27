/**
 * App + Web တစ်ခါတည်း:
 *   npm run release        — build APK, web download sync, push (CI deploy)
 *   npm run release:bump   — versionCode +1 ပြီးမှ release
 */
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradlePath = join(root, 'android', 'app', 'build.gradle');
const isWin = process.platform === 'win32';

function run(cmd, args = []) {
  // Windows shell:true breaks git commit -m when message has ( ) +
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
console.log('=== 9Mix release (App + Web download အော်တို) ===');
console.log(`Target: v${versionName} (build ${versionCode})\n`);

console.log('① APK build + app-version + web download (apk.html, _redirects)…\n');
const apkStatus = run('npm', ['run', 'android:apk']);
if (apkStatus !== 0) {
  console.warn(
    '\n⚠ APK build မအောင်မြင်ပါ (Java/Android SDK).\n' +
      '  Version + web link သာ sync — push ပြီးရင် GitHub Actions က APK+Web တင်ပေး.\n',
  );
  run('node', ['scripts/write-app-version.mjs']);
  run('node', ['scripts/sync-web-download.mjs']);
}

const syncFiles = [
  'android/app/build.gradle',
  'public/app-version.json',
  'public/firebase-config.json',
  'public/_redirects',
  'public/apk.html',
  'src/native/publishedVersion.ts',
  'src/appDownload.ts',
  'functions/_generated/appVersion.mjs',
];

const downloadsDir = join(root, 'public', 'downloads');
const versionedApk = `public/downloads/9mix-football-v${versionCode}.apk`;
const latestApk = 'public/downloads/9mix-football.apk';
const maxGitApkBytes = 50 * 1024 * 1024;

for (const rel of [versionedApk, latestApk]) {
  const full = join(root, rel);
  if (!existsSync(full)) {
    continue;
  }
  const bytes = statSync(full).size;
  if (bytes > maxGitApkBytes) {
    console.warn(
      `\n⚠ ${rel} = ${Math.round(bytes / 1024 / 1024)} MB — GitHub 100MB limit. APK ကို git မတင်ပါ (ဖုန်းသို့ ဒီဖိုင်ကို တိုက်ရိုက် install လုပ်ပါ).`,
    );
    console.warn('   GitHub Actions က APK ~10–35MB build လုပ်ပြီး web download ပြင်ပေးမည်.\n');
    continue;
  }
  syncFiles.unshift(rel);
}

run('git', ['add', ...syncFiles]);

if (run('git', ['diff', '--staged', '--quiet']) === 0) {
  console.log('\nပြောင်းလဲမှု မရှိ — ရှိပြီးသား sync ဖြစ်နေပါတယ်.');
} else {
  const msg = `release: app v${versionCode} ${versionName} web-apk-download`;
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

console.log('\n③ git push → GitHub Actions: APK + Web (ballpwal.org) တစ်ခါတည်း deploy\n');
process.exit(run('git', ['push', 'origin', 'main']));
