import type { Diploma } from '../domain/models/diploma.model';
import type { Highlight } from '../domain/models/highlight.model';
import type { ProfileContent, ProfileDocument } from '../domain/models/profile-content.model';
import type { ProfileInfo, SocialButton } from '../domain/models/profile.model';
import type { Technology } from '../domain/models/technology.model';
import type { WhatIDo } from '../domain/models/what-i-do.model';

export function aHighlight(overrides: Partial<Highlight> = {}): Highlight {
  return {
    id: 'highlight-1',
    title: 'Trait témoin',
    description: 'Description du trait témoin.',
    ...overrides,
  };
}

export function aWhatIDo(overrides: Partial<WhatIDo> = {}): WhatIDo {
  return {
    id: 'work-1',
    title: 'Activité témoin',
    description: 'Description de l’activité témoin.',
    ...overrides,
  };
}

export function aTechnology(overrides: Partial<Technology> = {}): Technology {
  return {
    id: 'tech-1',
    name: 'Techno témoin',
    category: 'Catégorie témoin',
    icon: 'angular',
    ...overrides,
  };
}

export function aDiploma(overrides: Partial<Diploma> = {}): Diploma {
  return {
    id: 'diploma-1',
    title: 'Formation témoin',
    provider: 'Organisme témoin',
    level: 'Niveau témoin',
    shortDescription: 'Description de la formation témoin.',
    skills: ['Compétence A', 'Compétence B'],
    ...overrides,
  };
}

export function aProfileContent(overrides: Partial<ProfileContent> = {}): ProfileContent {
  return {
    biography: {
      title: 'Parcours témoin',
      summary: 'Résumé du parcours témoin.',
      leadEmphasis: 'Suite de l’accroche témoin.',
      paragraphs: ['Premier paragraphe témoin.', 'Second paragraphe témoin.'],
    },
    highlights: [aHighlight()],
    workSummary: 'Résumé des activités témoin.',
    whatIDo: [aWhatIDo()],
    technologies: [aTechnology()],
    diplomasSummary: 'Résumé des formations témoin.',
    diplomas: [aDiploma()],
    motivation: {
      title: 'Motivation témoin',
      statement: 'Énoncé de la motivation témoin.',
      description: 'Description de la motivation témoin.',
    },
    ...overrides,
  };
}

export function aProfileDocument(overrides: Partial<ProfileDocument> = {}): ProfileDocument {
  return {
    version: 1,
    updatedAt: '2026-10-11T08:00:00.000Z',
    content: aProfileContent(),
    portraitUrl: null,
    ...overrides,
  };
}

export function aProfileInfo(overrides: Partial<ProfileInfo> = {}): ProfileInfo {
  return {
    id: 'profile-1',
    displayName: 'Nom Témoin',
    location: 'Ville témoin',
    avatarUrl: '/portrait-temoin.avif',
    ...overrides,
  };
}

export function aSocialButton(overrides: Partial<SocialButton> = {}): SocialButton {
  return {
    id: 'social-1',
    icon: 'lucide-github',
    label: 'Réseau témoin',
    href: 'https://reseau.test/temoin',
    ...overrides,
  };
}
