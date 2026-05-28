/**
 * Cloudflare API token + account id — CI / local
 */
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return;
  }
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq < 1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

for (const name of ['.env.cloudflare.local', '.env.local', '.env']) {
  loadEnvFile(join(root, name));
}

/** R2 S3 keys — wrangler မလို upload:apk:s3 */
export function loadR2S3Env() {
  const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();
  const accessKey = (process.env.R2_ACCESS_KEY_ID || '').trim();
  const secretKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
  return { accountId, accessKey, secretKey };
}

export function hasR2S3Credentials() {
  const { accountId, accessKey, secretKey } = loadR2S3Env();
  return Boolean(accountId && accessKey && secretKey);
}

export function loadCloudflareEnv() {
  function clean(name) {
    const raw = process.env[name];
    if (!raw) {
      return '';
    }
    return raw.trim().replace(/\s+/g, '');
  }

  const token = clean('CLOUDFLARE_API_TOKEN');
  const accountId = clean('CLOUDFLARE_ACCOUNT_ID');

  return { token, accountId };
}

export function requireCloudflareEnv() {
  const { token, accountId } = loadCloudflareEnv();

  if (!token) {
    const hint = join(root, '.env.cloudflare.local');
    throw new Error(
      `CLOUDFLARE_API_TOKEN မရှိ — ${hint} ဖိုင်ဖန်တီးပြီး cfut_ token ထည့်ပါ (သို့ GitHub Actions → Upload APK to R2)`,
    );
  }
  if (!accountId) {
    throw new Error('CLOUDFLARE_ACCOUNT_ID မရှိ');
  }
  if (token.includes('curl') || token.includes('http')) {
    throw new Error('CLOUDFLARE_API_TOKEN မှား — cfut_... token သာ');
  }
  if (!/^[a-f0-9]{32}$/i.test(accountId)) {
    throw new Error(`CLOUDFLARE_ACCOUNT_ID မှား (${accountId.length} chars) — 32 hex လိုသည်`);
  }
  if (!/^cfut_/i.test(token) && token.length < 20) {
    throw new Error('CLOUDFLARE_API_TOKEN ပုံစံ မှား — Cloudflare API Token ကို ပြန်စစ်ပါ');
  }

  return {
    token,
    accountId,
    wranglerEnv: {
      ...process.env,
      CLOUDFLARE_API_TOKEN: token,
      CLOUDFLARE_ACCOUNT_ID: accountId,
    },
  };
}
