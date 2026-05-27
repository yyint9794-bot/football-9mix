import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const configPath = join(root, 'apk-hosting.config.json');

const defaults = {
  bucket: '9mix-football-apk',
  publicBaseUrl: 'https://ballpwal.org/downloads',
  r2KeyPrefix: 'downloads',
};

export function loadApkHostingConfig() {
  if (!existsSync(configPath)) {
    return { ...defaults };
  }
  try {
    return { ...defaults, ...JSON.parse(readFileSync(configPath, 'utf8')) };
  } catch {
    return { ...defaults };
  }
}

export function apkFileName(versionCode) {
  return `9mix-football-v${versionCode}.apk`;
}

export function apkPublicUrl(versionCode) {
  const { publicBaseUrl } = loadApkHostingConfig();
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/${apkFileName(versionCode)}`;
}

export function apkR2Key(versionCode) {
  const { r2KeyPrefix } = loadApkHostingConfig();
  const prefix = r2KeyPrefix.replace(/\/$/, '');
  return `${prefix}/${apkFileName(versionCode)}`;
}

export function apkLatestPublicUrl() {
  const { publicBaseUrl } = loadApkHostingConfig();
  const base = publicBaseUrl.replace(/\/$/, '');
  return `${base}/9mix-football.apk`;
}

export function apkLatestR2Key() {
  return apkR2Key(0).replace(/-v0\.apk$/, '.apk').replace('9mix-football-v0', '9mix-football');
}
