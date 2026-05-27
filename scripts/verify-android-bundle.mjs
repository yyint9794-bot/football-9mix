import { existsSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const indexHtml = join(root, 'android', 'app', 'src', 'main', 'assets', 'public', 'index.html');
const distIndex = join(root, 'dist', 'index.html');

if (!existsSync(distIndex)) {
  console.error('dist/index.html missing — run: npm run build');
  process.exit(1);
}

if (!existsSync(indexHtml)) {
  console.error('android assets/public/index.html missing — run: npx cap sync android');
  process.exit(1);
}

const assetsDir = join(root, 'android', 'app', 'src', 'main', 'assets', 'public');
let total = 0;
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p);
    else total += st.size;
  }
}
walk(assetsDir);

const minAssets = 400_000;
if (total < minAssets) {
  console.error(`Bundled web assets too small (${total} bytes) — cap sync failed?`);
  process.exit(1);
}

console.log(`OK bundled assets: ${Math.round(total / 1024)} KB`);
