import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'android');
const isWin = process.platform === 'win32';
const gradle = isWin ? join(androidDir, 'gradlew.bat') : join(androidDir, 'gradlew');

if (!existsSync(gradle)) {
  console.error('Gradle wrapper not found. Run: npx cap add android');
  process.exit(1);
}

const result = spawnSync(gradle, ['assembleRelease'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
});

process.exit(result.status ?? 1);
