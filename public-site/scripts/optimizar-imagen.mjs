// Uso: node scripts/optimizar-imagen.mjs <foto-descargada> <slug>
// Deja public/tratamientos/<slug>.jpg en 1600×1067 (3:2), JPEG, ≤ 350 KB.
import sharp from 'sharp';
import { mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const [entrada, slug] = process.argv.slice(2);
if (!entrada || !/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug ?? '')) {
  console.error('Uso: node scripts/optimizar-imagen.mjs <foto-descargada> <slug>');
  process.exit(1);
}

const carpeta = fileURLToPath(new URL('../public/tratamientos/', import.meta.url));
mkdirSync(carpeta, { recursive: true });
const destino = `${carpeta}${slug}.jpg`;
const LIMITE = 350 * 1024;

for (const calidad of [80, 72, 64, 56, 48]) {
  await sharp(entrada)
    .rotate()
    .resize({ width: 1600, height: 1067, fit: 'cover', position: 'attention' })
    .jpeg({ quality: calidad, mozjpeg: true })
    .toFile(destino);
  const peso = statSync(destino).size;
  if (peso <= LIMITE) {
    console.log(`${slug}.jpg: ${Math.round(peso / 1024)} KB (calidad ${calidad})`);
    process.exit(0);
  }
}
console.error(`${slug}.jpg sigue pesando más de 350 KB`);
process.exit(1);
