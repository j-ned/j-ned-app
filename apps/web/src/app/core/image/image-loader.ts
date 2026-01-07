import { ImageLoaderConfig } from '@angular/common';

export function customImageLoader(config: ImageLoaderConfig): string {
  const { src, width } = config;

  // Si pas de largeur spécifiée, retourner l'image originale
  if (!width) {
    return src;
  }

  // Extraire le nom et l'extension du fichier
  const lastDotIndex = src.lastIndexOf('.');
  const baseName = src.substring(0, lastDotIndex);
  const extension = src.substring(lastDotIndex);

  // Pour les tailles spécifiques, utiliser les images redimensionnées
  return `${baseName}-${width}w${extension}`;
}
