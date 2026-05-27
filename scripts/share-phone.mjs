import { spawn } from 'node:child_process';

const port = process.env.PORT || '5173';

function announce(url, via) {
  console.log('');
  console.log('========================================');
  console.log('ဖုန်းမှာ ဒီလင့်ခ်တစ်ခုပဲ ဖွင့်ပါ:');
  console.log('');
  console.log(`  ${url}`);
  console.log('');
  if (via === 'localtunnel') {
    console.log('⚠️  လင့်ခ်ကို အစအဆုံး copy လုပ်ပါ (ဥပမာ large-ghosts-rest — ghosts-rest တစ်ခုတည်းမဟုတ်ပါ)');
    console.log('localtunnel: IP မေးရင် https://loca.lt/mytunnelpassword ကြည့်ပြီး ထည့်ပါ');
    console.log('ဖုန်းမှာ VPN ဖွင့်ထားရင် ပိတ်ပြီး ထပ်စမ်းပါ (400 ဖြစ်တတ်ပါတယ်)');
    console.log('ဖြူမျက်နှာ ဖြစ်ရင်: tab ပိတ်ပြီး လင့်ခ်အသစ် ထပ်ဖွင့်ပါ');
  } else {
    console.log('Wi-Fi မတူရင်လည်း ရပါတယ် — password မလိုပါ');
  }
  console.log('========================================');
  console.log('');
}

function runLocaltunnel() {
  return new Promise((resolve) => {
    console.log('localtunnel ဖန်တီးနေပါတယ်...');
    const subdomain = `fb${Date.now().toString(36).slice(-6)}`;
    const child = spawn('npx', ['--yes', 'localtunnel', '--port', port, '--subdomain', subdomain], {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill('SIGINT');
        resolve(false);
      }
    }, 45000);

    const handle = (buffer) => {
      const text = buffer.toString();
      process.stdout.write(text);
      const match = text.match(/https:\/\/[^\s]+\.loca\.lt/);
      if (match && !done) {
        done = true;
        clearTimeout(timer);
        announce(match[0], 'localtunnel');
        resolve(true);
      }
    };

    child.stdout.on('data', handle);
    child.stderr.on('data', handle);
    child.on('exit', () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    });
  });
}

function runCloudflare() {
  return new Promise((resolve) => {
    console.log('Cloudflare tunnel စမ်းနေပါတယ်...');
    const child = spawn('npx', ['--yes', 'cloudflared', 'tunnel', '--url', `http://127.0.0.1:${port}`], {
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let done = false;
    const timer = setTimeout(() => {
      if (!done) {
        done = true;
        child.kill('SIGINT');
        resolve(false);
      }
    }, 90000);

    const handle = (buffer) => {
      const text = buffer.toString();
      process.stdout.write(text);
      const match = text.match(/https:\/\/[a-z0-9-]{8,}\.trycloudflare\.com/);
      if (match && !done) {
        done = true;
        clearTimeout(timer);
        announce(match[0], 'cloudflare');
        resolve(true);
      }
    };

    child.stdout.on('data', handle);
    child.stderr.on('data', handle);
    child.on('exit', () => {
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve(false);
      }
    });
  });
}

console.log('');
console.log(`dev server ဖွင့်ထားပါ: npm run dev (port ${port})`);
console.log('');

let ok = await runCloudflare();
if (!ok) {
  ok = await runLocaltunnel();
}

process.on('SIGINT', () => process.exit(0));
