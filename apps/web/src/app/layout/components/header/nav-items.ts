export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly icons: string;
};

export const NAV_LINKS: readonly NavItem[] = [
  { label: 'Blog', href: '/blog', icons: 'lucide-book-open' },
  { label: 'Réalisations', href: '/projects', icons: 'lucide-laptop' },
  { label: 'Parcours', href: '/about', icons: 'lucide-user' },
];
