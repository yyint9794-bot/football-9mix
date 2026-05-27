import { spawn, execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const port = process.env.PORT || '4173';

function announce(url, via) {
  console.log('');
  console.log('========================================');
  console.log('ဖုန်းမှာ ဒီလင့်ခ်တစ်ခုပဲ ဖွင့်ပါ:');
  console.log('');
  console.log(`  ${url}`);
  console.log('');
  if (via === 'localtunnel') {
    console.log('⚠️  လင့်ခ်ကို https:// အပါ အစအဆုံး copy လုပ်ပါ');
    console.log('IP မေးရင်: https://loca.lt/mytunnelpassword');
    console.log('Continue နှိပ်ပြီးမှ app ပေါ်မယ်');
  } else {
    console.log('Wi-Fi မတူရင်လည်း ရပါတယ် — Continue မလိုပါ');
  }
  console.log('VPN ပိတ်ထားပါ');
  console.log('========================================');
  console.log('');
}

async function waitForServer(maxMs = 90000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/`);
      if (response.ok) {
        return true;
      }
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 600));
  }
  return false;
}

function runTunnel(name, args, pattern, timeoutMs) {
  return new Promise((resolve) => {
    console.log(`${name} ဖန်တီးနေပါတယ်...`);
    const child = spawn('npx', args, { shell: true, stdio: ['inherit', 'pipe', 'pipe'], cwd: root });

    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill('SIGINT');
        resolve(null);
      }
    }, timeoutMs);

    const handle = (buffer) => {
      const text = buffer.toString();
      process.stdout.write(text);
      const match = text.match(pattern);
      if (match && !done) {
        done = true;
        clearTimeout(timer);
        resolve(match[0]);
      }
    };

    child.stdout.on('data', handle);
    child.stderr.on('data', handle);
    child.on('exit', () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(null);
      }
    });
  });
}

console.log('');
console.log('① Production build လုပ်နေပါတယ်...');
execSync('npm run build', { stdio: 'inherit', cwd: root });

console.log('');
console.log(`② Preview server စ (${port})...`);
spawn('npx', ['vite', 'preview', '--host', '0.0.0.0', '--port', port, '--strictPort'], {
  shell: true,
  stdio: 'inherit',
  cwd: root,
  detached: true,
}).unref();

const ready = await waitForServer();
if (!ready) {
  console.error('Preview server မစနိုင်ပါ — port', port);
  process.exit(1);
}

console.log('Preview OK — tunnel ဖွင့်နေပါတယ်...');

let url = await runTunnel(
  'Cloudflare',
  ['--yes', 'cloudflared', 'tunnel', '--url', `http://127.0.0.1:${port}`],
  /https:\/\/[a-z0-9-]{8,}\.trycloudflare\.com/,
  90000,
);

if (!url) {
  const subdomain = `fb${Date.now().toString(36).slice(-6)}`;
  url = await runTunnel(
    'localtunnel',
    ['--yes', 'localtunnel', '--port', port, '--subdomain', subdomain],
    /https:\/\/[^\s]+\.loca\.lt/,
    45000,
  );
}

if (!url) {
  console.error('Tunnel မရပါ — Wi-Fi တူရင်: npm run phone');
  process.exit(1);
}

announce(url, url.includes('loca.lt') ? 'localtunnel' : 'cloudflare');
process.on('SIGINT', () => process.exit(0));
