/**
 * Inventaire des routes de l'API (relevé sur les contrôleurs NestJS, 2026-11-01). Toute route ajoutée,
 * retirée ou dont l'accès change doit l'être ici : c'est la carte que Hono reprend à l'identique.
 * Les paramètres sont remplis par des valeurs qui n'existent pas : seul l'accès est éprouvé ici.
 */
export type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Route = { readonly method: Method; readonly path: string };

const ID = '00000000-0000-4000-8000-000000000000';

// Statistiques dont le paramètre `type` est obligatoire (400 sans lui).
const STAT_QUERY: Readonly<Record<string, string>> = {
  metrics: '?type=url',
  events: '?type=contact_submit',
};

export const ADMIN_ROUTES: readonly Route[] = [
  ...[
    'overview',
    'chart',
    'metrics',
    'active',
    'projects',
    'articles',
    'articles-read',
    'cta',
    'events',
    'cv-downloads',
  ].map((stat): Route => ({
    method: 'GET',
    path: `/api/analytics/stats/${stat}${STAT_QUERY[stat] ?? ''}`,
  })),
  { method: 'POST', path: '/api/auth/logout' },
  { method: 'GET', path: '/api/auth/me' },
  { method: 'POST', path: '/api/auth/change-password' },
  { method: 'POST', path: '/api/auth/2fa/generate' },
  { method: 'POST', path: '/api/auth/2fa/enable' },
  { method: 'POST', path: '/api/auth/2fa/disable' },
  { method: 'POST', path: '/api/auth/2fa/regenerate-backup-codes' },
  { method: 'POST', path: '/api/blog/content-images' },
  { method: 'GET', path: '/api/blog/posts/admin' },
  { method: 'POST', path: '/api/blog/posts' },
  { method: 'PATCH', path: `/api/blog/posts/${ID}` },
  { method: 'DELETE', path: `/api/blog/posts/${ID}` },
  { method: 'POST', path: `/api/blog/posts/${ID}/image` },
  { method: 'GET', path: '/api/contact/messages' },
  { method: 'GET', path: '/api/contact/messages/unread-count' },
  { method: 'PATCH', path: '/api/contact/messages/mark-all-read' },
  { method: 'PATCH', path: `/api/contact/messages/${ID}/read` },
  { method: 'DELETE', path: `/api/contact/messages/${ID}` },
  { method: 'POST', path: '/api/cv/upload' },
  { method: 'DELETE', path: '/api/cv' },
  { method: 'PUT', path: '/api/profile' },
  { method: 'POST', path: '/api/profile/portrait' },
  { method: 'DELETE', path: '/api/profile/portrait' },
  { method: 'POST', path: `/api/projects/${ID}/images` },
  { method: 'PATCH', path: `/api/projects/${ID}/images/${ID}` },
  { method: 'DELETE', path: `/api/projects/${ID}/images/${ID}` },
  { method: 'PUT', path: `/api/projects/${ID}/images/order` },
  { method: 'POST', path: '/api/projects' },
  { method: 'PATCH', path: `/api/projects/${ID}` },
  { method: 'DELETE', path: `/api/projects/${ID}` },
  { method: 'POST', path: `/api/projects/${ID}/image` },
  { method: 'PUT', path: '/api/workshop-guide' },
];

export const PUBLIC_READ_ROUTES: readonly Route[] = [
  { method: 'GET', path: '/api/health' },
  { method: 'GET', path: '/api/config' },
  { method: 'GET', path: '/api/blog/posts' },
  { method: 'GET', path: '/api/blog/posts/parity-unknown-slug' },
  { method: 'GET', path: '/api/cv' },
  { method: 'GET', path: '/api/cv/download' },
  { method: 'GET', path: '/api/profile' },
  { method: 'GET', path: '/api/projects' },
  { method: 'GET', path: `/api/projects/${ID}` },
  { method: 'GET', path: '/api/workshop-guide' },
];

/** Écritures ouvertes au public : seul le contrôle d'origine (CSRF) et le débit les protègent. */
export const PUBLIC_WRITE_ROUTES: readonly Route[] = [
  { method: 'POST', path: '/api/auth/login' },
  { method: 'POST', path: '/api/auth/2fa/verify' },
  { method: 'POST', path: '/api/blog/posts/parity-unknown-slug/like' },
  { method: 'POST', path: '/api/contact/messages' },
  { method: 'POST', path: '/api/analytics/track' },
];

export const isWrite = (route: Route): boolean => route.method !== 'GET';
