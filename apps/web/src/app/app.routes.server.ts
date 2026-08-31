import { RenderMode, type ServerRoute } from '@angular/ssr';

async function getPrerenderParams(): Promise<{ slug: string }[]> {
  try {
    const res = await fetch('https://api.nedellec-julien.fr/api/blog/posts');
    if (!res.ok) return [];
    const posts = (await res.json()) as { slug: string }[];
    return posts.map((p) => ({ slug: p.slug }));
  } catch {
    return [];
  }
}

export const serverRoutes: ServerRoute[] = [
  // Routes publiques prerendered au build
  { path: '', renderMode: RenderMode.Prerender },
  { path: 'about', renderMode: RenderMode.Prerender },
  { path: 'projects', renderMode: RenderMode.Prerender },
  { path: 'blog', renderMode: RenderMode.Prerender },
  { path: 'blog/:slug', renderMode: RenderMode.Prerender, getPrerenderParams },

  // Auth + admin : jamais côté serveur (authentifié, pas d'intérêt SEO)
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'two-factor', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Fallback : CSR pour tout le reste
  { path: '**', renderMode: RenderMode.Client },
];
