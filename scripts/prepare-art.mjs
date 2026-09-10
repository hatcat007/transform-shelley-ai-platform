import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
await mkdir('public/images/art', { recursive: true });
for (const name of ['agent', 'quick', 'workspace']) {
  const file = `public/images/${name}-atlas.png`;
  const { width, height } = await sharp(file).metadata();
  for (let i = 0; i < 6; i++) {
    const left = Math.floor((i % 3) * width / 3);
    const top = Math.floor(Math.floor(i / 3) * height / 2);
    await sharp(file).extract({ left, top, width: Math.floor(width / 3), height: Math.floor(height / 2) }).resize(560, 420, { fit: 'cover' }).webp({ quality: 86 }).toFile(`public/images/art/${name}-${i}.webp`);
  }
}
await sharp('public/images/growth-studio.png').resize(1100).webp({ quality: 88 }).toFile('public/images/art/growth-studio.webp');
console.log('Prepared 19 optimized illustrations.');
