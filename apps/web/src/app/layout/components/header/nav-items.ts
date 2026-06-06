export type NavItem = {
  readonly label: string;
  readonly href: string;
  /** Id d'une section à atteindre par scroll (URL inchangée, pas d'ancre `#`). */
  readonly scrollTo?: string;
  readonly icons: string;
};

export const NAV_LINKS: NavItem[] = [
  { label: 'Projets', href: '/projects', icons: 'lucide-laptop' },
  { label: 'À propos', href: '/about', icons: 'lucide-user' },
  { label: 'Contact', href: '/', scrollTo: 'contact', icons: 'lucide-mail' },
];
