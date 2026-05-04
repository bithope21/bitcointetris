import sharp from 'sharp';
import { readFileSync } from 'fs';

const svg = readFileSync('./public/logo.svg');

const icons = [
  { size: 512,  out: 'public/icon-512.png' },
  { size: 192,  out: 'public/icon-192.png' },
  { size: 180,  out: 'public/apple-touch-icon.png' },
  { size: 32,   out: 'public/favicon-32.png' },
];

for (const { size, out } of icons) {
  await sharp(svg).resize(size, size).png().toFile(out);
  console.log(`✅ ${out} (${size}x${size})`);
}

console.log('\nAll icons generated!');
