/**
 * Site + version API deploy — CLOUDFLARE_API_TOKEN လိုသည်
 *   node scripts/deploy-now.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { hasR2S3Credentials, requireCloudflareEnv } from './cloudflare-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

function run(cmd, args, extraEnv = {}) {
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: { ...process.env, ...extraEnv },
  });
  return result.status ?? 1;
}

try {
  const creds = requireCloudflareEnv();
  if (creds.oauth) {
    console.log('Cloudflare: wrangler OAuth (local login)\n');
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  if (hasR2S3Credentials()) {
    console.error('R2 S3 keys ရှိ — npm run upload:apk:s3\n');
  }
  process.exit(1);
}

console.log('=== Build web + functions ===\n');
if (run('npm', ['run', 'build'], { PAGES_DEPLOY: '1' }) !== 0) {
  process.exit(1);
}

const versionPath = join(root, 'dist', 'app-version.json');
const version = JSON.parse(readFileSync(versionPath, 'utf8'));
console.log(`\nDeploying v${version.versionName} (${version.versionCode}) — API /api/app-version + R2 check\n`);

if (run('node', ['scripts/deploy-pages.mjs']) !== 0) {
  process.exit(1);
}

console.log('\n✓ Deploy OK');
console.log('  Check: https://ballpwal.org/api/app-version');
console.log('  Then:  npm run upload:apk\n');
