import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
writeFileSync(
  join(dist, '.assetsignore'),
  '# Cloudflare Pages — skip APK (>25MB limit)\ndownloads/\n',
  'utf8',
);
console.log('Wrote dist/.assetsignore');
