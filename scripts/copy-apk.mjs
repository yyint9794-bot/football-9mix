import { spawnSync } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
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

const outDir = join(root, 'public', 'downloads');
const target = join(outDir, '9mix-football.apk');
mkdirSync(outDir, { recursive: true });
copyFileSync(source, target);
console.log(`Copied ${source} -> ${target}`);
spawnSync(process.execPath, [join(root, 'scripts', 'write-app-version.mjs')], { stdio: 'inherit' });
