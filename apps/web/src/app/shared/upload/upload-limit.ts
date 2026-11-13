// L'API n'accepte aucun fichier au-delà de 4 Mio (le relais nginx du site en laisse passer 5).
export const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

// Taille visée pour une image envoyée : le navigateur la réduit en WebP sous ce seuil, pour un envoi
// rapide et loin de toute limite d'un proxy ; l'API la ré-encode ensuite en AVIF de 1600 px, si bien que
// rien n'est perdu à l'affichage.
export const IMAGE_UPLOAD_TARGET_BYTES = 900 * 1024;
