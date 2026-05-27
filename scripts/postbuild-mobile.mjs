import { existsSync, copyFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

spawnSync(process.execPath, [join(root, 'scripts', 'write-app-version.mjs')], {
  stdio: 'inherit',
});

const versionJson = join(root, 'public', 'app-version.json');
if (existsSync(versionJson)) {
  copyFileSync(versionJson, join(root, 'dist', 'app-version.json'));
  console.log('Copied app-version.json to dist/');
}

const apk = join(root, 'public', 'downloads', '9mix-football.apk');
const distDir = join(root, 'dist', 'downloads');

if (!existsSync(apk)) {
  console.log('No APK in public/downloads — skip copy to dist');
  process.exit(0);
}

mkdirSync(distDir, { recursive: true });
copyFileSync(apk, join(distDir, '9mix-football.apk'));
console.log('Copied APK to dist/downloads/9mix-football.apk');
