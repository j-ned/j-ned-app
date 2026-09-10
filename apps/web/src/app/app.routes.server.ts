import { RenderMode, type ServerRoute } from '@angular/ssr';

// Même origine que le API_BASE_URL serveur d'app.config.ts : le prérendu tourne au build,
// hors injection Angular, donc l'URL est répétée ici plutôt qu'injectée.
const PRERENDER_API_URL = 'https://api.nedellec-julien.fr/api';

type SlugRow = { readonly slug: string };

const MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 5_000;

const wait = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

// L'API annonce son délai (`retry-after`, ou `x-ratelimit-reset` en secondes) ; à défaut 5 s.
function retryDelayMs(res: Response): number {
  const seconds = Number(res.headers.get('retry-after') ?? res.headers.get('x-ratelimit-reset'));
  return Number.isFinite(seconds) && seconds > 0 ? seconds * 1000 : DEFAULT_RETRY_DELAY_MS;
}

// Découvre les slugs d'une collection au build. Un 429 (limite de débit) est réessayé ; toute autre
// erreur fait échouer le build : Dokploy garde alors l'image précédente en ligne, alors qu'une liste
// vide publierait un site sans ces pages, en silence.
export async function fetchPrerenderSlugs(resource: string): Promise<SlugRow[]> {
  const url = `${PRERENDER_API_URL}${resource}`;
  for (let attempt = 1; ; attempt++) {
    let res: Response;
    try {
      res = await fetch(url);
    } catch (cause) {
      throw new Error(`Prerender: ${url} unreachable, build aborted`, { cause });
    }
    if (res.ok) {
      const rows = (await res.json()) as readonly SlugRow[];
      return rows.map((row) => ({ slug: row.slug }));
    }
    if (res.status === 429 && attempt < MAX_ATTEMPTS) {
      await wait(retryDelayMs(res));
      continue;
    }
    throw new Error(
      `Prerender: ${url} answered HTTP ${res.status} after ${attempt} attempt(s), build aborted`,
    );
  }
}

export const serverRoutes: ServerRoute[] = [
  // Routes publiques prerendered au build
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'projects', renderMode: RenderMode.Prerender },
  {
    path: 'projects/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => fetchPrerenderSlugs('/projects?_sort=order&limit=100'),
  },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'mentions-legales', renderMode: RenderMode.Prerender },
  { path: 'confidentialite', renderMode: RenderMode.Prerender },
  {
    path: 'blog/:slug',
    renderMode: RenderMode.Prerender,
    getPrerenderParams: () => fetchPrerenderSlugs('/blog/posts'),
  },

  // Auth + admin : jamais côté serveur (authentifié, pas d'intérêt SEO)
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'two-factor', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Fallback : CSR pour tout le reste
  { path: '**', renderMode: RenderMode.Client },
];
