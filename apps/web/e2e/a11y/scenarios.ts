export type Theme = 'light' | 'dark';

export type PageScenario = { readonly path: string; readonly ready: string };

// Pied de page `@defer (on viewport)`, absent des routes admin : à attendre rendu, pas en squelette.
export const FOOTER_READY = 'footer-legal';

export const THEMES: readonly Theme[] = ['light', 'dark'];

export const PUBLIC_PAGES: readonly PageScenario[] = [
  { path: '/', ready: 'home-contact-form' },
  { path: '/about', ready: 'about-lead' },
  { path: '/projects', ready: 'projects-case-studies' },
  { path: '/projects/projet-temoin', ready: 'project-detail-title' },
  { path: '/projects/dashflow', ready: 'project-articles' },
  { path: '/blog', ready: 'blog-posts' },
  { path: '/blog?tag=Angular', ready: 'tag-filter-banner' },
  { path: '/blog/article-temoin', ready: 'blog-content' },
  { path: '/mentions-legales', ready: 'legal-publisher' },
  { path: '/confidentialite', ready: 'privacy-last-update' },
  { path: '/does-not-exist', ready: 'not-found-title' },
  { path: '/login', ready: 'login-form' },
];

export const ADMIN_PAGES: readonly PageScenario[] = [
  { path: '/admin', ready: 'overview-message' },
  { path: '/admin/projects', ready: 'admin-projects-list' },
  { path: '/admin/projects/p-temoin', ready: 'admin-project-public-link' },
  { path: '/admin/projects/new', ready: 'form-section' },
  { path: '/admin/blog', ready: 'admin-posts-list' },
  { path: '/admin/blog/b-temoin', ready: 'admin-post-preview-link' },
  { path: '/admin/profile', ready: 'admin-profile-paragraph-row' },
  { path: '/admin/cv', ready: 'admin-cv-current' },
  { path: '/admin/messages', ready: 'admin-messages-list' },
  { path: '/admin/audience', ready: 'tally-row' },
  { path: '/admin/settings', ready: 'settings-session' },
];

// Un écran d'administration audité en squelette, en erreur ou sous un toast ne prouve rien.
export const ADMIN_PENDING_OR_FAILED =
  '[data-testid$="-loading"], [data-testid="load-error"], [data-testid="toast"]';
