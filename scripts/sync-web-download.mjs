/**
 * Web ဒေါင်းလုဒ် — ballpwal.org/downloads (R2, GitHub မသုံး)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { apkFileName, apkPublicUrl, loadApkHostingConfig } from './apk-hosting.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const gradle = readFileSync(join(root, 'android', 'app', 'build.gradle'), 'utf8');
const versionCode = Number(/versionCode\s+(\d+)/.exec(gradle)?.[1] ?? 1);
const versionName = /versionName\s+"([^"]+)"/.exec(gradle)?.[1] ?? '1.0.0';
const downloadUrl = apkPublicUrl(versionCode);
const { publicBaseUrl } = loadApkHostingConfig();

/** GitHub redirect မသုံး — Pages Function + R2 က /downloads/* ကို ပေး */
function syncRedirects() {
  const redirectsPath = join(root, 'public', '_redirects');
  let redirects = readFileSync(redirectsPath, 'utf8');
  redirects = redirects.replace(
    /\/downloads\/9mix-football[^\n]*\n(?:\/downloads\/9mix-football[^\n]*\n)*/g,
    '',
  );
  if (!redirects.includes('# apk: R2 via functions/downloads')) {
    const marker = '/apk.html  /apk.html  200\n';
    redirects = redirects.replace(marker, `${marker}# apk: R2 via functions/downloads — no GitHub\n`);
  }
  writeFileSync(redirectsPath, redirects.endsWith('\n') ? redirects : `${redirects}\n`, 'utf8');
}

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
      p.note { color: #94a3b8; font-size: 0.9rem; }
    </style>
  </head>
  <body>
    <h1>9Mix Football APK</h1>
    <p>ဗားရှင်း <strong>${versionCode} (${versionName})</strong></p>
    <p class="note">Cloudflare R2 — GitHub မသုံး (~10MB+)</p>
    <p id="status" class="note">ဒေါင်းလုဒ် ပြင်ဆင်နေသည်…</p>
    <a id="dl" href="${downloadUrl}">APK ဒေါင်းလုဒ် (v${versionCode})</a>
    <script>
      (function () {
        var url = '${downloadUrl}';
        var dl = document.getElementById('dl');
        var status = document.getElementById('status');
        dl.href = url + '?cb=' + Date.now();
        fetch(url, { method: 'HEAD' })
          .then(function (res) {
            if (res.ok) {
              status.textContent = 'ဒေါင်းလုဒ် အဆင်ပြေပါသည် — ခလုတ်နှိပ်ပါ';
              return;
            }
            status.textContent =
              'APK မတင်ရသေးပါ (HTTP ' +
              res.status +
              ') — Admin က GitHub Actions မှာ Upload APK to R2 လုပ်ရမည်';
          })
          .catch(function () {
            status.textContent = 'ဆာဗာနှင့် မချိတ်ဆက်နိုင်ပါ — ခလုတ်ကို ထပ်စမ်းကြည့်ပါ';
          });
      })();
    </script>
  </body>
</html>
`;
writeFileSync(apkHtmlPath, apkHtml, 'utf8');
syncRedirects();

console.log(`Synced web download → v${versionCode} (${versionName})`);
console.log(`  ${downloadUrl}`);
