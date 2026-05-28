/**
 * Local Cloudflare env — တစ်ကြိမ်သာ
 *   npm run cloudflare:setup
 */
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const target = join(root, '.env.cloudflare.local');
const example = join(root, '.env.cloudflare.local.example');

if (existsSync(target)) {
  console.log(`Already exists: ${target}`);
  console.log('Token ထည့်ပြီး: npm run deploy:now');
  process.exit(0);
}

if (existsSync(example)) {
  copyFileSync(example, target);
} else {
  writeFileSync(
    target,
    `CLOUDFLARE_API_TOKEN=\nCLOUDFLARE_ACCOUNT_ID=6bf98f7ca096abc0bf87e011b3e3a9d3\n`,
    'utf8',
  );
}

console.log(`Created: ${target}`);
console.log('Notepad ဖွင့်ပြီး CLOUDFLARE_API_TOKEN= နောက်မှာ cfut_... token ထည့်ပါ (ကွင်းစ မထည့်)');
console.log('Save ပြီးရင်: npm run deploy:now && npm run upload:apk\n');

if (process.platform === 'win32') {
  spawnSync('notepad.exe', [target], { stdio: 'inherit' });
}
