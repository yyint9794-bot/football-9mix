import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const androidDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'android');
const isWin = process.platform === 'win32';
const gradle = isWin ? join(androidDir, 'gradlew.bat') : join(androidDir, 'gradlew');

function findJavaHome() {
  if (process.env.JAVA_HOME) {
    const javaExe = join(process.env.JAVA_HOME, 'bin', isWin ? 'java.exe' : 'java');
    if (existsSync(javaExe)) {
      return process.env.JAVA_HOME;
    }
  }

  const candidates = [
    'C:\\Program Files\\Android\\Android Studio\\jbr',
    join(homedir(), 'AppData', 'Local', 'Programs', 'Android', 'Android Studio', 'jbr'),
    'C:\\Program Files\\Eclipse Adoptium\\jdk-21.0.7.6-hotspot',
    'C:\\Program Files\\Java\\jdk-21',
    'C:\\Program Files\\Microsoft\\jdk-21.0.7.6-hotspot',
  ];

  for (const home of candidates) {
    const javaExe = join(home, 'bin', isWin ? 'java.exe' : 'java');
    if (existsSync(javaExe)) {
      return home;
    }
  }

  return null;
}

if (!existsSync(gradle)) {
  console.error('Gradle wrapper not found. Run: npx cap add android');
  process.exit(1);
}

const javaHome = findJavaHome();
const env = { ...process.env };
if (javaHome) {
  env.JAVA_HOME = javaHome;
  console.log(`Using JAVA_HOME: ${javaHome}`);
} else {
  console.error(
    'JAVA_HOME not found. Install JDK 21 or Android Studio, then set JAVA_HOME to its folder.',
  );
  process.exit(1);
}

const result = spawnSync(gradle, ['assembleRelease'], {
  cwd: androidDir,
  stdio: 'inherit',
  shell: isWin,
  env,
});

process.exit(result.status ?? 1);
