import type { ContactInfo, SocialLinks } from '../../../core/contact/models';

export const CONTACT_INFO: ContactInfo = {
  email: 'contact@nedellec-julien.fr',
  phone: '+33 6 22 86 92 79',
  location: 'Voisins-Le-Bretonneux, France',
} as const;

export const SOCIAL_LINKS: SocialLinks = {
  linkedin: {
    url: 'https://www.linkedin.com/in/nedellec-julien/',
    label: 'LinkedIn',
    icon: 'lucide-linkedin',
  },
  github: {
    url: 'https://github.com/djoudj-dev',
    label: 'GitHub',
    icon: 'lucide-github',
  },
  email: {
    url: 'mailto:contact@nedellec-julien.fr',
    label: 'Email',
    icon: 'lucide-mail',
  },
  phone: {
    url: 'tel:+33622869279',
    label: 'Téléphone',
    icon: 'lucide-phone',
  },
  twitter: {
    url: 'https://x.com/djoudj_78',
    label: 'X (Twitter)',
    icon: 'bi-twitter-x',
  },
} as const;
