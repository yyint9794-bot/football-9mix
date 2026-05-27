const key = process.env.KEY || 'demoapi';
const h = { 'X-HtayApi-Key': key, 'X-HtayApi-Platform': 'web' };
const base = 'https://htayapi.com';

const tries = [
  '/football/v7/all/facts',
  '/football/v7/all/lineup',
  '/football/v7/all/table',
  '/football/v7/all/stats',
  '/football/v6/all',
  '/football/v5/all',
  '/football/v4/all',
  '/football/v3/all',
  '/football/v7/match',
  '/football/v7/match-info',
  '/football/v7/info',
  '/football/v7/extra',
  '/football/v7/data',
  '/football/v7/fixture',
  '/football/v7/fixtures',
  '/football/v7/event',
  '/football/v7/events',
  '/football/v7/scores',
  '/football/v7/result',
  '/football/v7/results',
  '/football/v7/league',
  '/football/v7/leagues',
  '/football/v7/standing',
  '/football/v7/standings',
  '/football/v7/facts',
  '/football/v7/lineup',
  '/football/v7/table',
  '/football/v7/stats',
  '/football/v7/facts?fixture_id=9912108',
  '/football/v7/lineup?fixture_id=9912108',
  '/football/v7/table?league=CHA%20D2',
  '/football/v7/stats?fixture_id=9912108',
  '/football/v7/detail?fixture_id=9912108',
  '/football/v7/match?fixture_id=9912108',
  '/football/v7/match?id=9912108',
  '/football/v7/match?matchId=9912108',
];

for (const p of tries) {
  const url = base + p + (p.includes('?') ? '' : '?key=' + key);
  const r = await fetch(url, { headers: h });
  const ct = r.headers.get('content-type') || '';
  const t = await r.text();
  const json = ct.includes('json');
  console.log(r.status, json ? 'JSON' : 'HTML', p, json ? t.slice(0, 100) : '');
}

const all = await fetch(base + '/football/v7/all?key=' + key, { headers: h }).then((r) => r.json());
console.log('\nTop-level keys:', Object.keys(all));
const m = all.matches?.[0];
if (m) {
  console.log('Match keys:', Object.keys(m));
  for (const k of Object.keys(m)) {
    if (typeof m[k] === 'object' && m[k] !== null && !Array.isArray(k)) {
      console.log(' nested', k, Object.keys(m[k]));
    }
  }
}
