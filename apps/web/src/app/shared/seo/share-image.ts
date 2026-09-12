/**
 * Carte de partage (Open Graph / Twitter) d'une image servie par le proxy storage de l'API :
 * `?variant=share` renvoie un JPEG 1200×630, seul format et ratio que Facebook, LinkedIn et X
 * décodent (l'AVIF stocké ne l'est pas).
 */
export const SHARE_IMAGE = { width: 1200, height: 630, type: 'image/jpeg' } as const;

export function toShareImageUrl(imageUrl: string): string {
  return imageUrl ? `${imageUrl}?variant=share` : '';
}
