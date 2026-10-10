import { RenderMode, type ServerRoute } from '@angular/ssr';
import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFERS_BASE_PATH } from '@features/offer/domain/offer-path';

// Toute route `Server` ajoutée ici doit l'être aussi dans la location nginx de proxy vers Node
// (Dockerfile) : nginx répond 404 aux chemins qu'il ne relaie pas.
export const serverRoutes: ServerRoute[] = [
  // Contenu lu dans l'API : rendu à chaque requête, une écriture admin est visible au rechargement
  { path: '', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'projects/:slug', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/:slug', renderMode: RenderMode.Server },

  // Contenu écrit dans le code : prérendu au build
  { path: 'mentions-legales', renderMode: RenderMode.Prerender },
  { path: 'confidentialite', renderMode: RenderMode.Prerender },
  { path: OFFERS_BASE_PATH, renderMode: RenderMode.Prerender },
  ...OFFERS.map(
    ({ slug }): ServerRoute => ({
      path: `${OFFERS_BASE_PATH}/${slug}`,
      renderMode: RenderMode.Prerender,
    }),
  ),

  // Auth + admin : jamais côté serveur (authentifié, pas d'intérêt SEO)
  { path: 'login', renderMode: RenderMode.Client },
  { path: 'two-factor', renderMode: RenderMode.Client },
  { path: 'admin/**', renderMode: RenderMode.Client },

  // Fallback : CSR pour tout le reste
  { path: '**', renderMode: RenderMode.Client },
];
