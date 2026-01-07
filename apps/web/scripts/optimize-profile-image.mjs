import sharp from 'sharp';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Tailles pour l'image de profil (plus petites car c'est un avatar)
const SIZES = [80, 160, 320];

// Options de compression AVIF
const AVIF_OPTIONS = {
  quality: 65,
  effort: 6,
};

async function optimizeProfileImage() {
  const inputPath = join(publicDir, 'photoProfil.avif');

  console.log('🖼️  Optimisation de photoProfil.avif...\n');

  try {
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    console.log(`Dimensions originales: ${metadata.width}x${metadata.height}`);

    // Image optimisée pleine taille
    const optimizedPath = join(publicDir, 'photoProfil-optimized.avif');
    await image.avif(AVIF_OPTIONS).toFile(optimizedPath);
    console.log('✓ Image optimisée créée: photoProfil-optimized.avif');

    // Versions responsive
    for (const size of SIZES) {
      if (size >= metadata.width) continue;

      const resizedPath = join(publicDir, `photoProfil-${size}w.avif`);
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'cover',
          position: 'center'
        })
        .avif(AVIF_OPTIONS)
        .toFile(resizedPath);

      console.log(`✓ Version ${size}x${size} créée`);
    }

    console.log('\n✅ Optimisation de photoProfil.avif terminée!');
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

await optimizeProfileImage();
