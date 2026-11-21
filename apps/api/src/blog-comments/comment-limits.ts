import type { ThrottleConfig } from '../common/throttle';

// Un lecteur commente rarement plus de quelques articles par heure ; cinq laissent une correction.
export const COMMENT_THROTTLE: ThrottleConfig = { limit: 5, ttlMs: 3_600_000 };

// Compté en base sur l'empreinte de l'expéditeur : insensible au redémarrage de l'API.
export const PENDING_PER_SENDER = 3;

// Borne la file de modération, donc aussi le coût du comptage par expéditeur.
export const PENDING_TOTAL = 100;

export const REFUSED_RETENTION_DAYS = 30;

export const COMMENT_LIMITS = {
  nameMin: 2,
  nameMax: 80,
  emailMax: 320,
  bodyMin: 2,
  bodyMax: 2000,
} as const;
