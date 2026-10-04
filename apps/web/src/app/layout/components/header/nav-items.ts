type RouteNavItem = {
  readonly kind: 'route';
  readonly label: string;
  readonly href: string;
  readonly icons: string;
};

type SectionNavItem = {
  readonly kind: 'section';
  readonly label: string;
  readonly sectionId: string;
  readonly icons: string;
};

export type NavItem = RouteNavItem | SectionNavItem;

export const NAV_LINKS: readonly NavItem[] = [
  { kind: 'route', label: 'Offres', href: '/offres', icons: 'briefcase' },
  { kind: 'route', label: 'Réalisations', href: '/projects', icons: 'lucide-laptop' },
  { kind: 'section', label: 'Méthode', sectionId: 'methode', icons: 'compass' },
  { kind: 'route', label: 'Blog', href: '/blog', icons: 'lucide-book-open' },
  { kind: 'route', label: 'Parcours', href: '/about', icons: 'lucide-user' },
];
