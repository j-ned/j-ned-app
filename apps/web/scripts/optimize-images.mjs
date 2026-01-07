import sharp from 'sharp';
import { readdir, stat, mkdir } from 'fs/promises';
import { join, dirname, basename, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');
const imagesDir = join(publicDir, 'images');

// Tailles d'images responsives
const SIZES = [640, 768, 1024, 1280, 1920];

// Options de compression AVIF
const AVIF_OPTIONS = {
  quality: 65, // Réduit de 80 à 65 pour plus de compression
  effort: 6, // 0-9, plus élevé = meilleure compression mais plus lent
};

async function optimizeImage(imagePath, filename) {
  const ext = extname(filename);
  const name = basename(filename, ext);

  if (!['.avif', '.webp', '.jpg', '.jpeg', '.png'].includes(ext.toLowerCase())) {
    return;
  }

  console.log(`Optimisation de ${filename}...`);

  try {
    const image = sharp(imagePath);
    const metadata = await image.metadata();

    // Générer l'image originale optimisée (avec un nouveau nom temporaire)
    const tempPath = join(imagesDir, `${name}-optimized.avif`);
    await image
      .avif(AVIF_OPTIONS)
      .toFile(tempPath);

    console.log(`  ✓ Image originale optimisée: ${name}-optimized.avif`);

    // Générer les versions responsive
    for (const size of SIZES) {
      if (size >= metadata.width) continue;

      const resizedPath = join(imagesDir, `${name}-${size}w.avif`);
      await sharp(imagePath)
        .resize(size, null, {
          withoutEnlargement: true,
          fit: 'inside'
        })
        .avif(AVIF_OPTIONS)
        .toFile(resizedPath);

      console.log(`  ✓ Version ${size}w créée`);
    }
  } catch (error) {
    console.error(`  ✗ Erreur lors de l'optimisation de ${filename}:`, error.message);
  }
}

async function processDirectory(dir) {
  try {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory()) {
        await processDirectory(fullPath);
      } else if (stats.isFile()) {
        await optimizeImage(fullPath, entry);
      }
    }
  } catch (error) {
    console.error('Erreur:', error.message);
  }
}

console.log('🖼️  Optimisation des images...\n');
await processDirectory(imagesDir);
console.log('\n✅ Optimisation terminée!');
