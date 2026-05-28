import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apkFileName } from './apk-hosting.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

export function readVersionCode() {
  const gradle = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
  return Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 1);
}

/** In-app / public download — လက်ရှိ version + latest သာ */
export function apkKeepNames(versionCode = readVersionCode()) {
  return new Set([apkFileName(versionCode), '9mix-football.apk']);
}
