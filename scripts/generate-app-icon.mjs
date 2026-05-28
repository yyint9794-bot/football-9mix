/**
 * App icon — assets/app-icon-source.png → Android mipmaps + public/logo.png
 */
import { existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'assets', 'app-icon-source.png');
const resRoot = join(root, 'android', 'app', 'src', 'main', 'res');

const LAUNCHER_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192,
};

const FOREGROUND_SIZES = {
  'mipmap-mdpi': 108,
  'mipmap-hdpi': 162,
  'mipmap-xhdpi': 216,
  'mipmap-xxhdpi': 324,
  'mipmap-xxxhdpi': 432,
};

async function loadSharp() {
  try {
    return (await import('sharp')).default;
  } catch {
    console.error('Run: npm install sharp --save-dev');
    process.exit(1);
  }
}

async function writePng(sharp, size, outPath) {
  await sharp
    .clone()
    .resize(size, size, { fit: 'cover', position: 'centre' })
    .png()
    .toFile(outPath);
}

async function main() {
  if (!existsSync(source)) {
    console.error(`Missing ${source}`);
    process.exit(1);
  }

  const sharpLib = await loadSharp();
  const base = sharpLib(source).ensureAlpha();

  copyFileSync(source, join(root, 'public', 'logo.png'));
  await writePng(base, 512, join(root, 'public', 'icon-512.png'));

  for (const [folder, size] of Object.entries(LAUNCHER_SIZES)) {
    const dir = join(resRoot, folder);
    mkdirSync(dir, { recursive: true });
    await writePng(base, size, join(dir, 'ic_launcher.png'));
    await writePng(base, size, join(dir, 'ic_launcher_round.png'));
  }

  for (const [folder, size] of Object.entries(FOREGROUND_SIZES)) {
    const dir = join(resRoot, folder);
    mkdirSync(dir, { recursive: true });
    await writePng(base, size, join(dir, 'ic_launcher_foreground.png'));
  }

  console.log('✓ Android launcher icons generated');
  console.log('✓ public/logo.png + icon-512.png');
}

await main();
