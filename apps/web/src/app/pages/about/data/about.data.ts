export interface SocialButton {
  readonly icon: string;
  readonly label: string;
  readonly href: string;
}

export interface Highlight {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export interface Diploma {
  readonly id: string;
  readonly title: string;
  readonly provider: string;
  readonly shortDescription: string;
  readonly skills: readonly string[];
}

export interface Experience {
  readonly role: string;
  readonly company: string;
  readonly date: string;
}

export interface QuickStat {
  readonly label: string;
  readonly value: string;
}

export interface ProfileInfo {
  readonly displayName: string;
  readonly location: string;
  readonly avatarUrl: string;
  readonly isAvailable: boolean;
  readonly availabilityMessage: string;
}

export const PROFILE_INFO: ProfileInfo = {
  displayName: 'Julien NÉDELLEC',
  location: 'Voisins-Le-Bretonneux, France',
  avatarUrl: '/photoProfil.webp',
  isAvailable: true,
  availabilityMessage: 'Disponible pour de nouveaux projets',
} as const;

export const SOCIAL_BUTTONS: readonly SocialButton[] = [
  {
    icon: 'lucide-linkedin',
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/julien-nedellec/',
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
    icon: 'lucide-message-circle',
    label: 'Discord',
    href: 'https://discord.gg/nedellec_julien',
  },
  {
    icon: 'lucide-twitter',
    label: 'X',
    href: 'https://x.com/djoudjDev',
  },
] as const;

export const HIGHLIGHTS: readonly Highlight[] = [
  {
    title: 'Éternel étudiant',
    description:
      'Toujours en quête de nouvelles connaissances pour rester à la pointe du développement web.',
    icon: 'lucide-graduation-cap',
  },
  {
    title: "Esprit d'équipe",
    description:
      'Collaboration et partage sont au cœur de ma façon de travailler pour livrer des projets ambitieux.',
    icon: 'lucide-users',
  },
  {
    title: 'Curieux de nature',
    description:
      'Exploration permanente de nouvelles approches et solutions créatives pour les défis techniques.',
    icon: 'lucide-lightbulb',
  },
  {
    title: 'Pensée analytique',
    description:
      'Analyse fine des problèmes complexes pour imaginer des réponses élégantes et performantes.',
    icon: 'lucide-brain',
  },
] as const;

export const DIPLOMAS: readonly Diploma[] = [
  {
    id: 'dwwm',
    title: 'Développeur Web et Web Mobile',
    provider: 'Studi',
    shortDescription: 'Titre professionnel Bac +2 — spécialisation applications web et mobiles.',
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
    title: "Développeur d'applications PGI/ERP",
    provider: 'ALT-RH',
    shortDescription: 'Titre professionnel Bac +2 — cycle complet de développement applicatif PGI.',
    skills: [
      'HTML5, CSS3, JavaScript, jQuery',
      'Java & J2EE',
      'MySQL, UML & modélisation',
      'Git & gestion de version',
      'Algorithmique & design patterns',
      'Méthodes agiles (Scrum, RUP)',
    ],
  },
] as const;

export const PAGE_METADATA = {
  title: 'À propos | Julien Nédellec',
  description: 'Découvrez mon parcours, mes compétences et ma passion pour le développement web.',
} as const;

export const QUICK_STATS: readonly QuickStat[] = [
  { label: 'Expérience', value: '5+ Ans' },
  { label: 'Projets', value: '50+ Complétés' },
  { label: 'Localisation', value: 'Voisins-Le-Bretonneux, France' },
] as const;

export const EXPERIENCE: readonly Experience[] = [
  { role: 'Senior Frontend Dev', company: 'Tech Corp', date: '2023 - Présent' },
  { role: 'Développeur Web', company: 'Agency Inc', date: '2021 - 2023' },
  { role: 'Développeur Junior', company: 'Startup Ltd', date: '2020 - 2021' },
] as const;

export const BIOGRAPHY = {
  title: 'Qui je suis',
  paragraphs: [
    'Je suis un développeur passionné avec une forte motivation pour créer des produits numériques qui aident les gens. Mon parcours a commencé lorsque j\'ai écrit ma première ligne de code...',
    'Je crois en un code propre, une conception centrée sur l\'utilisateur et un apprentissage continu.',
  ],
} as const;

export interface Technology {
  readonly name: string;
  readonly category: string;
  readonly icon: string;
}

export const TECHNOLOGIES: readonly Technology[] = [
  { name: 'Angular', category: 'Framework', icon: 'angular' },
  { name: 'TypeScript', category: 'Langage', icon: 'typescript' },
  { name: 'Tailwind CSS', category: 'Styling', icon: 'tailwindcss' },
  { name: 'NestJS', category: 'Backend', icon: 'nestjs' },
  { name: 'PostgreSQL', category: 'Base de données', icon: 'postgresql' },
  { name: 'Docker', category: 'Devops', icon: 'docker' },
] as const;
