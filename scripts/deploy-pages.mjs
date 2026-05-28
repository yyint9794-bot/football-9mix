/**
 * Cloudflare Pages deploy — CI / local (secrets စစ်ပြီး deploy)
 */
import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireCloudflareEnv } from './cloudflare-env.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const isWin = process.platform === 'win32';

function fail(message) {
  console.error(`\n❌ ${message}\n`);
  process.exit(1);
}

let token;
let accountId;
let wranglerEnv;
try {
  ({ token, accountId, wranglerEnv } = requireCloudflareEnv());
} catch (error) {
  fail(error instanceof Error ? error.message : String(error));
}

const versionPath = join(root, 'dist', 'app-version.json');
if (!existsSync(versionPath)) {
  fail('dist/app-version.json မရှိ — npm run build ဦးစွာ');
}
const version = JSON.parse(readFileSync(versionPath, 'utf8'));
console.log(`Deploying web v${version.versionName} (${version.versionCode}) → football-9mix`);

function run(args) {
  const result = spawnSync('npx', ['wrangler', ...args, '--account-id', accountId], {
    cwd: root,
    stdio: 'inherit',
    shell: isWin,
    env: wranglerEnv,
  });
  return result.status ?? 1;
}

console.log('\n① wrangler whoami…');
if (run(['whoami']) !== 0) {
  fail('Cloudflare login မအောင်မြင် — token မှား သို့မဟုတ် permission မလုံလောက်');
}

console.log('\n② pages deploy…');
const status = run([
  'pages',
  'deploy',
  'dist',
  '--project-name=football-9mix',
  '--branch=main',
  '--commit-dirty=true',
]);
if (status !== 0) {
  fail('Pages deploy မအောင်မြင် — Dashboard မှာ project football-9mix ရှိမရှိ စစ်');
}

console.log('\n✓ Deploy complete — https://ballpwal.org/app-version.json စစ်ပါ');
