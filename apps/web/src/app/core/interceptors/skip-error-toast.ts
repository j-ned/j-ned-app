import { HttpContextToken } from '@angular/common/http';

/**
 * Marque une requête dont l'échec ne doit jamais atteindre le visiteur.
 * Réservé au fire-and-forget (tracking analytics) : l'erreur y est un problème
 * d'exploitation, pas un message adressé à qui lit la page.
 */
export const SKIP_ERROR_TOAST = new HttpContextToken<boolean>(() => false);
