/**
 * APK → R2 via S3-compatible API (wrangler မအောင်မြင်ရင်)
 * Env: R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, CLOUDFLARE_ACCOUNT_ID
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, createHmac } from 'node:crypto';
import { apkFileName, apkR2Key, loadApkHostingConfig } from './apk-hosting.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradleText = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradleText)?.[1] ?? 1);
const config = loadApkHostingConfig();
const filePath = join(root, 'public', 'downloads', apkFileName(versionCode));
const objectKey = apkR2Key(versionCode);

const accessKey = (process.env.R2_ACCESS_KEY_ID || '').trim();
const secretKey = (process.env.R2_SECRET_ACCESS_KEY || '').trim();
const accountId = (process.env.CLOUDFLARE_ACCOUNT_ID || '').trim();

if (!accessKey || !secretKey || !accountId) {
  console.error('Missing R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, or CLOUDFLARE_ACCOUNT_ID');
  process.exit(1);
}
if (!existsSync(filePath)) {
  console.error(`APK not found: ${filePath}`);
  process.exit(1);
}

const host = `${accountId}.r2.cloudflarestorage.com`;
const bucket = config.bucket;
const bytes = statSync(filePath).size;

function sha256Hex(data) {
  return createHash('sha256').update(data).digest('hex');
}

function hmac(key, data) {
  return createHmac('sha256', key).update(data).digest();
}

function signRequest(method, path, headers, payloadHash) {
  const now = new Date();
  const amzDate = now.toISOString().replace(/[:-]|\.\d{3}/g, '');
  const dateStamp = amzDate.slice(0, 8);
  const region = 'auto';
  const service = 's3';
  const credentialScope = `${dateStamp}/${region}/${service}/aws4_request`;

  const signedHeaders = Object.keys(headers)
    .map((k) => k.toLowerCase())
    .sort()
    .join(';');
  const canonicalHeaders = Object.keys(headers)
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((k) => `${k.toLowerCase()}:${String(headers[k]).trim()}\n`)
    .join('');

  const canonicalRequest = [
    method,
    path,
    '',
    canonicalHeaders,
    signedHeaders,
    payloadHash,
  ].join('\n');

  const stringToSign = [
    'AWS4-HMAC-SHA256',
    amzDate,
    credentialScope,
    sha256Hex(canonicalRequest),
  ].join('\n');

  const kDate = hmac(`AWS4${secretKey}`, dateStamp);
  const kRegion = hmac(kDate, region);
  const kService = hmac(kRegion, service);
  const kSigning = hmac(kService, 'aws4_request');
  const signature = createHmac('sha256', kSigning).update(stringToSign).digest('hex');

  const authorization = `AWS4-HMAC-SHA256 Credential=${accessKey}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  return { amzDate, authorization };
}

async function putObject() {
  const path = `/${bucket}/${objectKey}`;
  const url = `https://${host}${path}`;
  const payloadHash = 'UNSIGNED-PAYLOAD';
  const headers = {
    Host: host,
    'Content-Type': 'application/vnd.android.package-archive',
    'Content-Length': String(bytes),
    'x-amz-content-sha256': payloadHash,
    'x-amz-date': '',
  };
  const { amzDate, authorization } = signRequest('PUT', path, headers, payloadHash);
  headers['x-amz-date'] = amzDate;
  headers.Authorization = authorization;

  console.log(`S3 PUT ${url} (${Math.round(bytes / 1024 / 1024)} MB)`);

  const body = readFileSync(filePath);
  const response = await fetch(url, {
    method: 'PUT',
    headers: { ...headers, 'Content-Length': String(body.length) },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`Upload failed HTTP ${response.status}: ${text.slice(0, 500)}`);
    process.exit(1);
  }

  console.log(`✓ Uploaded ${objectKey}`);
  console.log(`  ${config.publicBaseUrl}/${apkFileName(versionCode)}`);
}

await putObject();
