/**
 * Site + version API deploy — CLOUDFLARE_API_TOKEN လိုသည်
 *   node scripts/deploy-now.mjs
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireCloudflareEnv } from './cloudflare-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { cwd: root, stdio: 'inherit', shell: isWin });
  return result.status ?? 1;
}

try {
  requireCloudflareEnv();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  console.error('\n① copy .env.cloudflare.local.example → .env.cloudflare.local');
  console.error('② CLOUDFLARE_API_TOKEN=cfut_... ထည့်');
  console.error('③ node scripts/deploy-now.mjs\n');
  process.exit(1);
}

console.log('=== Build web + functions ===\n');
if (run('npm', ['run', 'build']) !== 0) {
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
