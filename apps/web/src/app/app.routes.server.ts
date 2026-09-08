import { RenderMode, type ServerRoute } from '@angular/ssr';

// Même origine que le API_BASE_URL serveur d'app.config.ts : le prérendu tourne au build,
// hors injection Angular, donc l'URL est répétée ici plutôt qu'injectée.
const PRERENDER_API_URL = 'https://api.nedellec-julien.fr/api';

type SlugRow = { readonly slug: string };

// Découvre les slugs d'une collection au build. Toute erreur (API injoignable, non-2xx)
// rend une liste vide : le build aboutit et les slugs manquants tombent sur le fallback
// serveur (PrerenderFallback.Server) au lieu de casser le déploiement.
export async function fetchPrerenderSlugs(resource: string): Promise<SlugRow[]> {
  try {
    const res = await fetch(`${PRERENDER_API_URL}${resource}`);
    if (!res.ok) return [];
    const rows = (await res.json()) as readonly SlugRow[];
    return rows.map((row) => ({ slug: row.slug }));
  } catch {
    return [];
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
