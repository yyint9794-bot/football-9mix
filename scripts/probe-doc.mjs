const html = await fetch('https://htayapi.com/doc.html').then((r) => r.text());
const scripts = [...html.matchAll(/src="([^"]+\.js)"/g)].map((m) => m[1]);
console.log('scripts', scripts);

for (const src of scripts) {
  const url = src.startsWith('http') ? src : `https://htayapi.com/${src.replace(/^\//, '')}`;
  const js = await fetch(url).then((r) => r.text());
  const hits = [...js.matchAll(/football[^"'`\\s]{0,100}/g)].map((m) => m[0]);
  const uniq = [...new Set(hits)].filter((h) => /fact|line|stat|table|match|v7/i.test(h));
  if (uniq.length) {
    console.log('\n', url);
    console.log(uniq.slice(0, 30).join('\n'));
  }
}

const bases = ['https://htayapi.com', 'https://api.htayapi.com'];
const paths = [
  '/v1/football/live',
  '/v1/football/facts',
  '/v1/football/lineup',
  '/v1/football/stats',
  '/v1/football/table',
  '/v1/football/match',
];
const key = 'demoapi';
const h = { 'X-HtayApi-Key': key, 'X-HtayApi-Platform': 'web', Authorization: `Bearer ${key}` };

for (const base of bases) {
  for (const p of paths) {
    const url = `${base}${p}?key=${key}`;
    const r = await fetch(url, { headers: h });
    const ct = r.headers.get('content-type') || '';
    const json = ct.includes('json');
    console.log(base, r.status, json ? 'JSON' : 'HTML', p, json ? (await r.text()).slice(0, 80) : '');
  }
}
