import { SITE_IDENTITY } from '../identity/site-identity.static-data';

/**
 * Carte de partage (Open Graph / Twitter) d'une image servie par le proxy storage de l'API :
 * `?variant=share` renvoie un JPEG 1200×630, seul format et ratio que Facebook, LinkedIn et X
 * décodent (l'AVIF stocké ne l'est pas).
 */
export const SHARE_IMAGE = { width: 1200, height: 630, type: 'image/jpeg' } as const;

// Un crawler social ne résout pas un chemin relatif ; `//hôte` désigne déjà un autre hôte.
export function toShareImageUrl(imageUrl: string): string {
  if (!imageUrl) return '';
  const isSitePath = imageUrl.startsWith('/') && !imageUrl.startsWith('//');
  return `${isSitePath ? SITE_IDENTITY.siteUrl : ''}${imageUrl}?variant=share`;
}
