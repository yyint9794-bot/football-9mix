import { existsSync, copyFileSync, readdirSync, mkdirSync } from 'node:fs';
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

const firebaseConfig = join(root, 'public', 'firebase-config.json');
if (existsSync(firebaseConfig)) {
  copyFileSync(firebaseConfig, join(root, 'dist', 'firebase-config.json'));
  console.log('Copied firebase-config.json to dist/');
}

// အရင်စနစ် — public/downloads APK များ app assets ထဲ (in-app ဒေါင်းလုဒ် + R2)
const publicDownloads = join(root, 'public', 'downloads');
const downloadsDir = join(root, 'dist', 'downloads');
if (existsSync(publicDownloads)) {
  mkdirSync(downloadsDir, { recursive: true });
  let bundled = 0;
  for (const name of readdirSync(publicDownloads)) {
    if (!name.endsWith('.apk')) {
      continue;
    }
    copyFileSync(join(publicDownloads, name), join(downloadsDir, name));
    bundled += 1;
  }
  if (bundled) {
    console.log(`Bundled ${bundled} APK(s) into dist/downloads (legacy in-app download)`);
  }
}

spawnSync(process.execPath, [join(root, 'scripts', 'write-dist-assetsignore.mjs')], { stdio: 'inherit' });
