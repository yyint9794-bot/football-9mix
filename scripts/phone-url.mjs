import os from 'node:os';

function scoreAddress(address, interfaceName) {
  const name = interfaceName.toLowerCase();
  let score = 0;

  if (name.includes('wi-fi') || name.includes('wifi') || name.includes('wlan')) {
    score += 100;
  }

  if (
    name.includes('virtual') ||
    name.includes('vethernet') ||
    name.includes('vmware') ||
    name.includes('hyper-v') ||
    name.includes('box')
  ) {
    score -= 100;
  }

  if (address.startsWith('192.168.56.') || address.startsWith('172.')) {
    score -= 80;
  }

  if (address.startsWith('192.168.')) {
    score += 40;
  }

  if (address.startsWith('10.')) {
    score += 20;
  }

  return score;
}

function getLanIp() {
  const candidates = [];

  for (const [interfaceName, entries] of Object.entries(os.networkInterfaces())) {
    for (const entry of entries ?? []) {
      if (entry.family !== 'IPv4' || entry.internal) {
        continue;
      }

      candidates.push({
        address: entry.address,
        score: scoreAddress(entry.address, interfaceName),
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.address ?? '127.0.0.1';
}

const ip = getLanIp();
const devPort = process.env.PORT || '5173';
const previewPort = process.env.PREVIEW_PORT || '4173';

console.log('');
console.log('ဖုန်းမှာ ဒီလင့်ခ်တစ်ခုပဲ ဖွင့်ပါ (Wi-Fi တူရမယ်):');
console.log('');
console.log(`  dev:     http://${ip}:${devPort}`);
console.log(`  preview: http://${ip}:${previewPort}  (npm run phone:share သုံးရင်)`);
console.log('');
console.log('① PC: npm run dev  (သို့) npm run phone:share');
console.log('② ဖုန်း browser မှာ အပေါ်လင့်ခ်');
console.log('');
