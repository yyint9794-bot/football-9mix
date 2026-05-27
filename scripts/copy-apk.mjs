import { readFileSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradle = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 1);

const candidates = [
  join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk'),
  join(root, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release-unsigned.apk'),
  join(root, 'android', 'app', 'build', 'outputs', 'apk', 'debug', 'app-debug.apk'),
];

const source = candidates.find((path) => existsSync(path));
if (!source) {
  console.error('APK not found. Run: npm run android:apk');
  process.exit(1);
}

const apkBytes = statSync(source).size;
const minApk = 10 * 1024 * 1024;
if (apkBytes < minApk) {
  console.error(
    `APK too small (${Math.round(apkBytes / 1024 / 1024)} MB) — need full bundle (>=10 MB). Run: npm run android:sync`,
  );
  process.exit(1);
}

const outDir = join(root, 'public', 'downloads');
const latest = join(outDir, '9mix-football.apk');
const versioned = join(outDir, `9mix-football-v${versionCode}.apk`);
mkdirSync(outDir, { recursive: true });
copyFileSync(source, latest);
copyFileSync(source, versioned);
console.log(`Copied ${source} -> ${latest}`);
console.log(`Copied ${source} -> ${versioned}`);
spawnSync(process.execPath, [join(root, 'scripts', 'write-app-version.mjs')], { stdio: 'inherit' });
