/**
 * App build.gradle ဗားရှင်းနဲ့ Web ဒေါင်းလုဒ် (_redirects, apk.html) ကို တစ်ခါတည်း sync
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gh = 'yyint9794-bot/football-9mix';
const gradle = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 1);
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? '1.0.0';
const apkName = `9mix-football-v${versionCode}.apk`;
const rawApk = `https://raw.githubusercontent.com/${gh}/main/public/downloads/${apkName}`;

function apkRedirectLines() {
  const lines = [];
  const add = (path) => {
    lines.push(`${path}  ${rawApk}  302`);
  };
  add(`/downloads/${apkName}`);
  for (let v = Math.max(1, versionCode - 3); v < versionCode; v += 1) {
    add(`/downloads/9mix-football-v${v}.apk`);
  }
  add('/downloads/9mix-football.apk');
  return lines;
}

const redirectsPath = join(root, 'public', '_redirects');
const redirects = readFileSync(redirectsPath, 'utf8');
const apkBlock = apkRedirectLines().join('\n');
const nextRedirects = redirects.replace(
  /\/downloads\/9mix-football[^\n]*\n(?:\/downloads\/9mix-football[^\n]*\n)*/,
  `${apkBlock}\n`,
);
writeFileSync(redirectsPath, nextRedirects.endsWith('\n') ? nextRedirects : `${nextRedirects}\n`, 'utf8');

const apkHtmlPath = join(root, 'public', 'apk.html');
const apkHtml = `<!DOCTYPE html>
<html lang="my">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>9Mix Football APK v${versionCode}</title>
    <style>
      body {
        font-family: system-ui, sans-serif;
        background: #07111f;
        color: #e2e8f0;
        margin: 2rem;
        text-align: center;
      }
      a {
        display: inline-block;
        margin-top: 1rem;
        padding: 1rem 1.5rem;
        background: #22c55e;
        color: #052e16;
        font-weight: 700;
        text-decoration: none;
        border-radius: 12px;
      }
      p.note {
        color: #94a3b8;
        font-size: 0.9rem;
      }
    </style>
  </head>
  <body>
    <h1>9Mix Football APK</h1>
    <p>ဗားရှင်း <strong>${versionCode} (${versionName})</strong></p>
    <p class="note">ဖိုင် ~10MB+ ဖြစ်ရမည် — 4MB ဆိုရင် မှားနေပါသည်</p>
    <a id="dl" href="#">APK ဒေါင်းလုဒ်</a>
    <script>
      var url = '${rawApk}';
      document.getElementById('dl').href = url + '?cb=' + Date.now();
      window.location.replace(document.getElementById('dl').href);
    </script>
  </body>
</html>
`;
writeFileSync(apkHtmlPath, apkHtml, 'utf8');

console.log(`Synced web download → v${versionCode} (${versionName})`);
console.log(`  ${apkName}`);
console.log(`  public/_redirects, public/apk.html`);
