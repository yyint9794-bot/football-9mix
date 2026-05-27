import { spawnSync } from 'node:child_process';

process.env.CAPACITOR_LIVE_URL = 'https://ballpwal.org/app';
const result = spawnSync('npm', ['run', 'android:sync'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
});
process.exit(result.status ?? 1);
