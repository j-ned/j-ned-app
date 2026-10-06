import {
  PROJECT_KINDS,
  type ProjectKind,
  type ProjectKindCounts,
} from '../domain/models/project.model';

type Gender = 'feminine' | 'masculine';

type KindNoun = { readonly gender: Gender; readonly singular: string; readonly plural: string };

const KIND_NOUNS: Record<ProjectKind, KindNoun> = {
  production: {
    gender: 'feminine',
    singular: 'application en service',
    plural: 'applications en service',
  },
  demo: {
    gender: 'masculine',
    singular: 'site de démonstration',
    plural: 'sites de démonstration',
  },
  script: {
    gender: 'masculine',
    singular: 'outil de développement',
    plural: 'outils de développement',
  },
};

const NUMBER_WORDS = ['deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'] as const;

const CLOSING_SENTENCE = 'Chaque fiche montre le résultat et les choix techniques.';

function countInWords(count: number, gender: Gender): string {
  if (count === 1) return gender === 'feminine' ? 'une' : 'un';
  return NUMBER_WORDS[count - 2] ?? String(count);
}

function segment(count: number, { gender, singular, plural }: KindNoun): string {
  return `${countInWords(count, gender)} ${count === 1 ? singular : plural}`;
}

export function projectsIntro(counts: ProjectKindCounts): string {
  const segments = PROJECT_KINDS.filter((kind) => counts[kind] > 0).map((kind) =>
    segment(counts[kind], KIND_NOUNS[kind]),
  );
  if (segments.length === 0) return CLOSING_SENTENCE;
  const sentence = segments.join(', ');
  return `${sentence.charAt(0).toUpperCase()}${sentence.slice(1)}. ${CLOSING_SENTENCE}`;
}
