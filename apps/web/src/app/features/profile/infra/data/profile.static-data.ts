import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  WhatIDo,
  WhatISeek,
  SocialButton,
} from '../../domain';

export const STATIC_AVATAR_URL = '/avatar.png';

export const STATIC_PROFILE_BASE: Omit<ProfileInfo, 'avatarUrl'> = {
  id: '9acfdedb-c00d-4370-858e-7215e30f5a41',
  displayName: 'Nédellec Julien',
  location: 'Voisins-Le-Bretonneux',
  isAvailable: true,
  availabilityMessage: 'Disponible',
};

export const STATIC_BIOGRAPHY: Biography = {
  id: '9acfdedb-c00d-4370-858e-7215e30f5a41',
  title: 'Mon parcours',
  paragraphs: [
    "20 ans dans l'industrie m'ont appris ce qu'est vraiment la rigueur. Aujourd'hui, je l'applique au code.",
    "Je ne suis pas venu au développement web par hasard. En métallurgie, j'ai vu les outils numériques transformer un secteur entier. J'ai compris que je pouvais avoir plus d'impact en créant ces outils plutôt qu'en les utilisant.",
    "Formé dans un environnement où l'erreur coûte cher, j'ai développé une exigence qui me sert aujourd'hui : chaque ligne de code doit être pensée pour durer. Autodidacte par nécessité, je ne me contente pas de faire fonctionner, je comprends pourquoi ça fonctionne, de la requête SQL au déploiement en production.",
    "Cette expérience m'a donné une vision systémique rare : je ne code pas des features isolées, je conçois des solutions complètes qui résolvent de vrais problèmes métier.",
  ],
};

export const STATIC_DIPLOMAS: readonly Diploma[] = [
  {
    id: '2a970a44-7422-4e6c-adaa-5b78f6620e10',
    title: 'Développeur Web et Web Mobile - Bac+2',
    provider: 'Studi',
    shortDescription:
      "Titre professionnel de niveau 5 axé sur la conception, le développement et la maintenance d'applications web et mobiles, avec une pédagogie orientée bonnes pratiques et travail en équipe.",
    skills: [
      'HTML5, CSS3, Javascript',
      'Angular & Typescript',
      'SQL & NoSQL',
      'Git & GitHub',
      'Responsive Design',
      'API REST',
    ],
  },
  {
    id: '5886de30-2beb-4654-b61d-50c737594a47',
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

export const STATIC_TECHNOLOGIES: readonly Technology[] = [
  {
    id: '2f66a183-bc6a-487b-9517-1235c2773f43',
    name: 'Angular',
    category: 'Framework',
    icon: 'angular',
  },
  {
    id: 'a9aafa1f-a140-40ff-ac14-5e669d5ee314',
    name: 'NestJS',
    category: 'Backend',
    icon: 'nestjs',
  },
  {
    id: '92293b7c-48a1-48fc-a1ee-9f66b94464c3',
    name: 'TypeScript',
    category: 'Langage',
    icon: 'typescript',
  },
  {
    id: '3af8cb9a-fb26-45bb-b9f8-1f2f4af7f54d',
    name: 'Tailwind CSS',
    category: 'Styling',
    icon: 'tailwindcss',
  },
  {
    id: '3f002354-321f-45f1-bfc2-2bb578ffb904',
    name: 'PostgreSQL',
    category: 'Base de données',
    icon: 'postgresql',
  },
  {
    id: '89901eaf-377c-46e1-b3ae-75b2ec28465e',
    name: 'Docker',
    category: 'Base de données',
    icon: 'docker',
  },
];

export const STATIC_ABOUT_HIGHLIGHTS: readonly Highlight[] = [
  {
    id: 'f91a2bc6-7369-4ff5-8ab3-7ece1426be50',
    title: 'Exigence de production ',
    description:
      "Formé dans un environnement où l'erreur coûte cher, j'écris du code pensé pour durer. Type-safe, testé, documenté.",
    icon: 'valid',
  },
  {
    id: 'bf68db5e-044f-400c-895a-e67de2f0d151',
    title: 'Autonomie réelle',
    description:
      "Autodidacte par nécessité, je trouve des solutions quand il n'y a pas de tutoriel. Je lis la doc, je comprends les sources, je creuse jusqu'à résoudre.",
    icon: 'book',
  },
  {
    id: '65665431-8b96-4957-bec3-8403689adfcf',
    title: "Vision d'ensemble",
    description:
      "Je ne code pas dans le vide. Je comprends le métier, l'architecture, les contraintes. Vingt ans à optimiser des systèmes complexes, ça laisse des traces.",
    icon: 'spider-web',
  },
];

export const STATIC_WHAT_I_DO: readonly WhatIDo[] = [
  {
    id: '23ff2843-921d-4b76-b070-83a50bd87665',
    title: 'Applications complètes',
    description:
      "Je construis des applications de production de bout en bout : conception, Full Stack (Angular moderne, NestJS, PostgreSQL) et déploiement conteneurisé (Docker). Pas des démos, mais des systèmes qui tournent.",
  },
  {
    id: 'dffce031-2162-4f1b-97d9-ef2c9790734d',
    title: 'Infrastructure',
    description:
      "Je gère l'intégralité de mon infrastructure : auto-hébergement (VPS) et déploiement continu (CI/CD) via Dokploy, jusqu'aux services en production. Ce contrôle opérationnel total garantit la fiabilité et fait de moi un développeur plus complet.",
  },
];

export const STATIC_WHAT_I_SEEK: WhatISeek = {
  id: 'f963681b-3599-4801-9c7f-312afc70e4b2',
  title: 'Ce que je cherche',
  description:
    "Un environnement où la tech sert un impact positif. GreenTech, industrie durable, projets à sens. Une équipe qui valorise la qualité technique et l'apprentissage continu.",
};

export const STATIC_SOCIAL_BUTTONS: readonly SocialButton[] = [
  {
    id: 'f383f92a-d1ff-43b2-b212-87f2a1e43c23',
    icon: 'lucide-github',
    label: 'GitHub',
    href: 'https://github.com/j-ned',
  },
  {
    id: 'c3d221dc-eabf-4080-95de-6a60e512b6cd',
    icon: 'lucide-mail',
    label: 'Mail',
    href: 'mailto:contact@julien-nedellec.fr',
  },
  {
    id: '9d35a214-1c80-4228-af92-5fe16e3bdd13',
    icon: 'bi-discord',
    label: 'Discord',
    href: 'https://discord.gg/nedellec_julien',
  },
];
