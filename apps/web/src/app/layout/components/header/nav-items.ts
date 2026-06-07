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
  { kind: 'route', label: 'Projets', href: '/projects', icons: 'lucide-laptop' },
  { kind: 'route', label: 'À propos', href: '/about', icons: 'lucide-user' },
  { kind: 'section', label: 'Contact', sectionId: 'contact', icons: 'lucide-mail' },
];
