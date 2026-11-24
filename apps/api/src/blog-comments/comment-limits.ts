import type { ThrottleConfig } from '../common/throttle';

// Un lecteur commente rarement plus de quelques articles par heure ; cinq laissent une correction.
export const COMMENT_THROTTLE: ThrottleConfig = { limit: 5, ttlMs: 3_600_000 };

// Compté en base sur l'empreinte de l'expéditeur : insensible au redémarrage de l'API.
export const PENDING_PER_SENDER = 3;

// Par réseau (IPv4 /24, IPv6 /48) : une allocation qui change de /64 à chaque envoi ne remplit pas seule
// la file commune, bien en dessous de PENDING_TOTAL.
export const PENDING_PER_NETWORK = 10;

// Borne la file de modération, donc aussi le coût du comptage par expéditeur.
export const PENDING_TOTAL = 100;

export const COMMENT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 320,
  bodyMin: 2,
  bodyMax: 2000,
} as const;
