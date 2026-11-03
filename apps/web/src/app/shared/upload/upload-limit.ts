// Une fonction Vercel refuse un corps de plus de 4,5 Mo : l'API n'accepte aucun fichier au-delà de 4 Mio.
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Taille visée pour une image envoyée : au-delà d'environ 1 Mo, Vercel refuse un envoi multipart en 503
// avant même l'API (mesuré le 2026-11-03). Le navigateur réduit donc l'image en WebP sous ce seuil ; l'API
// la ré-encode ensuite en AVIF de 1600 px, si bien que rien n'est perdu à l'affichage.
export const IMAGE_UPLOAD_TARGET_BYTES = 900 * 1024;
