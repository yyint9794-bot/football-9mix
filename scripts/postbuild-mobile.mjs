import { existsSync, copyFileSync, unlinkSync } from 'node:fs';
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

// APK ~33MB — Cloudflare Pages per-file limit 25MB (deploy fails if included)
const apkInDist = join(root, 'dist', 'downloads', '9mix-football.apk');
if (existsSync(apkInDist)) {
  unlinkSync(apkInDist);
  console.log('Removed APK from dist (Pages 25MB limit) — /downloads/ redirects to jsDelivr');
}
spawnSync(process.execPath, [join(root, 'scripts', 'write-dist-assetsignore.mjs')], { stdio: 'inherit' });
