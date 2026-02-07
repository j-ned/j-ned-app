import type {
  Biography,
  Diploma,
  Highlight,
  ProfileInfo,
  SocialButton,
  Technology,
  WhatIDo,
  WhatISeek,
} from '../../domain/models';

export const PROFILE_INFO: ProfileInfo = {
  displayName: 'Julien NÉDELLEC',
  location: 'Voisins-Le-Bretonneux, France',
  avatarUrl: '/photoProfil.avif',
  isAvailable: true,
  availabilityMessage: 'Disponible pour de nouveaux projets',
};

export const SOCIAL_BUTTONS: SocialButton[] = [
  {
    icon: 'lucide-linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/nedellec-julien/',
  },
  {
    icon: 'lucide-github',
    label: 'GitHub',
    href: 'https://github.com/djoudj-dev',
  },
  {
    icon: 'lucide-mail',
    label: 'Mail',
    href: 'mailto:contact@julien-nedellec.fr',
  },
  {
    icon: 'bi-discord',
    label: 'Discord',
    href: 'https://discord.gg/nedellec_julien',
  },
  {
    icon: 'bi-twitter-x',
    label: 'X',
    href: 'https://x.com/djoudj_78',
  },
];

export const HIGHLIGHTS: Highlight[] = [
  {
    title: 'Exigence de production',
    description:
      "Formé dans un environnement où l'erreur coûte cher, j'écris du code pensé pour durer. Type-safe, testé, documenté.",
    icon: 'valid',
  },
  {
    title: 'Autonomie réelle',
    description:
      "Autodidacte par nécessité, je trouve des solutions quand il n'y a pas de tutoriel. Je lis la doc, je comprends les sources, je creuse jusqu'à résoudre.",
    icon: 'book',
  },
  {
    title: "Vision d'ensemble",
    description:
      "Je ne code pas dans le vide. Je comprends le métier, l'architecture, les contraintes. Vingt ans à optimiser des systèmes complexes, ça laisse des traces.",
    icon: 'spider-web',
  },
];

export const DIPLOMAS: Diploma[] = [
  {
    id: 'dwwm',
    title: 'Développeur Web et Web Mobile - Bac+2',
    provider: 'Studi',
    shortDescription:
      "Titre professionnel de niveau 5 axé sur la conception, le développement et la maintenance d'applications web et mobiles, avec une pédagogie orientée bonnes pratiques et travail en équipe.\n",
    skills: [
      'HTML5, CSS3, JavaScript',
      'Angular & TypeScript',
      'SQL & NoSQL',
      'Git & GitHub',
      'Responsive Design',
      'API REST',
    ],
  },
  {
    id: 'pgi-erp',
    title: "Développeur d'applications PGI/ERP - Bac+2",
    provider: 'ALT-RH',
    shortDescription:
      "Titre professionnel de niveau 5 dédié à la conception et à la maintenance d'applications de gestion intégrées, avec un focus sur l'architecture logicielle et la collaboration agile.",
    skills: [
      'HTML5, CSS3, JavaScript, jQuery',
      'Java & J2EE',
      'MySQL, UML & modélisation',
      'Git & gestion de version',
      'Algorithmique & design patterns',
      'Méthodes agiles (Scrum, RUP)',
    ],
  },
];

export const BIOGRAPHY: Biography = {
  title: 'Mon parcours',
  paragraphs: [
    "20 ans dans l'industrie m'ont appris ce qu'est vraiment la rigueur. Aujourd'hui, je l'applique au code.",
    "Je ne suis pas venu au développement web par hasard. En métallurgie, j'ai vu les outils numériques transformer un secteur entier. J'ai compris que je pouvais avoir plus d'impact en créant ces outils plutôt qu'en les utilisant.",
    "Formé dans un environnement où l'erreur coûte cher, j'ai développé une exigence qui me sert aujourd'hui : chaque ligne de code doit être pensée pour durer. Autodidacte par nécessité, je ne me contente pas de faire fonctionner, je comprends pourquoi ça fonctionne, de la requête SQL au déploiement en production.",
    "Cette expérience m'a donné une vision systémique rare : je ne code pas des features isolées, je conçois des solutions complètes qui résolvent de vrais problèmes métier.",
  ],
};

export const WHAT_I_DO: WhatIDo[] = [
  {
    title: 'Applications complètes',
    description:
      'Je construis des applications de production de bout en bout : conception, Full Stack (Angular moderne, NestJS, PostgreSQL) et déploiement conteneurisé (Docker). Pas des démos, mais des systèmes qui tournent.',
  },
  {
    title: 'Infrastructure',
    description:
      "Je gère l'intégralité de mon infrastructure : auto-hébergement (VPS) et déploiement continu (CI/CD) via Dokploy, jusqu'aux services en production. Ce contrôle opérationnel total garantit la fiabilité et fait de moi un développeur plus complet.",
  },
];

export const WHAT_I_SEEK: WhatISeek = {
  title: 'Ce que je cherche',
  description:
    "Un environnement où la tech sert un impact positif. GreenTech, industrie durable, projets à sens. Une équipe qui valorise la qualité technique et l'apprentissage continu.",
};

export const TECHNOLOGIES: Technology[] = [
  { name: 'Angular', category: 'Framework', icon: 'angular' },
  { name: 'TypeScript', category: 'Langage', icon: 'typescript' },
  { name: 'Tailwind CSS', category: 'Styling', icon: 'tailwindcss' },
  { name: 'NestJS', category: 'Backend', icon: 'nestjs' },
  { name: 'PostgreSQL', category: 'Base de données', icon: 'postgresql' },
  { name: 'Docker', category: 'Devops', icon: 'docker' },
];
