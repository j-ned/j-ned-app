import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import type { ProfileInfo, SocialButton } from '../../domain/models/profile.model';

export const DEFAULT_PORTRAIT_URL = '/avatar.avif';

export const ABOUT_IDENTITY: {
  readonly profile: Omit<ProfileInfo, 'avatarUrl'>;
  readonly socials: readonly SocialButton[];
} = {
  profile: {
    id: 'julien-nedellec',
    displayName: 'Julien Nédellec',
    location: SITE_IDENTITY.location,
  },
  socials: [
    { id: 'github', icon: 'lucide-github', label: 'GitHub', href: SITE_IDENTITY.socials.github },
    {
      id: 'linkedin',
      icon: 'lucide-linkedin',
      label: 'LinkedIn',
      href: SITE_IDENTITY.socials.linkedin,
    },
    { id: 'malt', icon: 'briefcase', label: 'Malt', href: SITE_IDENTITY.socials.malt },
    { id: 'mail', icon: 'lucide-mail', label: 'Mail', href: `mailto:${SITE_IDENTITY.email}` },
    { id: 'discord', icon: 'bi-discord', label: 'Discord', href: SITE_IDENTITY.socials.discord },
  ],
};
