import type { ProfileContent } from '@features/profile/domain/models/profile-content.model';
import { toFrenchTypography } from '@shared/format/french-typography';
import {
  isTechnologyIcon,
  type TechnologyIcon,
} from '@features/profile/domain/models/technology-icon';

// `key` ne sert qu'au suivi des lignes à l'écran : il ne part jamais à l'API.
type ParagraphRow = { key: string; text: string };

type ProfileItemRow = { id: string; title: string; description: string };

type TechnologyRow = { id: string; name: string; category: string; icon: TechnologyIcon | '' };

type DiplomaRow = {
  id: string;
  title: string;
  provider: string;
  level: string;
  shortDescription: string;
  skills: string;
};

export type ProfileDraft = {
  biographyTitle: string;
  biographySummary: string;
  leadEmphasis: string;
  paragraphs: ParagraphRow[];
  highlights: ProfileItemRow[];
  workSummary: string;
  whatIDo: ProfileItemRow[];
  technologies: TechnologyRow[];
  diplomasSummary: string;
  diplomas: DiplomaRow[];
  motivationTitle: string;
  motivationStatement: string;
  motivationDescription: string;
};

export function newParagraphRow(): ParagraphRow {
  return { key: `paragraph-${crypto.randomUUID()}`, text: '' };
}

// Le document renvoyé garde l'ordre du brouillon : chaque paragraphe reprend la clé de sa position.
export function toProfileDraft(
  content: ProfileContent | null,
  previous?: ProfileDraft,
): ProfileDraft {
  return {
    biographyTitle: content?.biography.title ?? '',
    biographySummary: content?.biography.summary ?? '',
    leadEmphasis: content?.biography.leadEmphasis ?? '',
    paragraphs: (content?.biography.paragraphs ?? []).map((text, index) => ({
      key: previous?.paragraphs[index]?.key ?? `paragraph-${index + 1}`,
      text,
    })),
    highlights: (content?.highlights ?? []).map(({ id, title, description }) => ({
      id,
      title,
      description,
    })),
    workSummary: content?.workSummary ?? '',
    whatIDo: (content?.whatIDo ?? []).map(({ id, title, description }) => ({
      id,
      title,
      description,
    })),
    technologies: (content?.technologies ?? []).map(({ id, name, category, icon }) => ({
      id,
      name,
      category,
      icon: isTechnologyIcon(icon) ? icon : '',
    })),
    diplomasSummary: content?.diplomasSummary ?? '',
    diplomas: (content?.diplomas ?? []).map((diploma) => ({
      id: diploma.id,
      title: diploma.title,
      provider: diploma.provider,
      level: diploma.level,
      shortDescription: diploma.shortDescription,
      skills: diploma.skills.join('\n'),
    })),
    motivationTitle: content?.motivation.title ?? '',
    motivationStatement: content?.motivation.statement ?? '',
    motivationDescription: content?.motivation.description ?? '',
  };
}

const prose = (text: string): string => toFrenchTypography(text.trim());

const toItem = ({ id, title, description }: ProfileItemRow): ProfileItemRow => ({
  id,
  title: prose(title),
  description: prose(description),
});

export function toSkills(skills: string): string[] {
  return skills
    .split('\n')
    .map((skill) => skill.trim())
    .filter((skill) => skill !== '');
}

// Les lignes sont recopiées champ par champ : Signal Forms les marque d'un symbole interne.
export function toProfileContent(draft: ProfileDraft): ProfileContent {
  return {
    biography: {
      title: prose(draft.biographyTitle),
      summary: prose(draft.biographySummary),
      leadEmphasis: prose(draft.leadEmphasis),
      paragraphs: draft.paragraphs.map(({ text }) => prose(text)),
    },
    highlights: draft.highlights.map(toItem),
    workSummary: prose(draft.workSummary),
    whatIDo: draft.whatIDo.map(toItem),
    technologies: draft.technologies.map(({ id, name, category, icon }) => ({
      id,
      name: prose(name),
      category: prose(category),
      icon,
    })),
    diplomasSummary: prose(draft.diplomasSummary),
    diplomas: draft.diplomas.map((diploma) => ({
      id: diploma.id,
      title: prose(diploma.title),
      provider: prose(diploma.provider),
      level: prose(diploma.level),
      shortDescription: prose(diploma.shortDescription),
      skills: toSkills(diploma.skills).map(toFrenchTypography),
    })),
    motivation: {
      title: prose(draft.motivationTitle),
      statement: prose(draft.motivationStatement),
      description: prose(draft.motivationDescription),
    },
  };
}
