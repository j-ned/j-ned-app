export type NavItem = {
  readonly label: string;
  readonly href: string;
  readonly fragment?: string;
  readonly icons: string;
};

export const NAV_LINKS: NavItem[] = [
  { label: 'Projets', href: '/projects', icons: 'lucide-laptop' },
  { label: 'À propos', href: '/about', icons: 'lucide-user' },
  { label: 'Contact', href: '/', fragment: 'contact', icons: 'lucide-mail' },
];
