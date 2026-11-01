import { tagKey } from './tag-key';

export const TAG_HINTS_MAX = 5;

export type TaggedContent = {
  readonly title: string;
  readonly excerpt: string;
  /** Markdown : le code et les adresses n'y comptent pas. */
  readonly body: string;
};

// Un tag au titre dit plus du sujet qu'une mention au détour du corps.
const WEIGHTS = { title: 3, excerpt: 2, body: 1 } as const;

const fold = (text: string): string =>
  tagKey(text)
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '');

// Blocs de code, code en ligne, cibles de liens et adresses nues : un `import … '@angular/core'`
// ne fait pas un article sur Angular.
const prose = (markdown: string): string =>
  markdown
    .replace(/(```|~~~)[\s\S]*?(\1|$)/g, ' ')
    .replace(/`[^`\n]*`/g, ' ')
    .replace(/\]\([^)]*\)/g, '] ')
    .replace(/https?:\/\/\S+/g, ' ');

const escapeRegExp = (text: string): string => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');

// Mot entier : ni lettre ni chiffre collés au tag (« Tests » ne sort pas de « testsuite »).
const occurrences = (text: string, tag: string): number =>
  text.match(new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(tag)}(?![\\p{L}\\p{N}])`, 'gu'))
    ?.length ?? 0;

/** Tags connus nommés par l'article et pas encore posés, les plus présents d'abord. */
export function contentTagHints(
  known: readonly string[],
  selected: readonly string[],
  content: TaggedContent,
): readonly string[] {
  const taken = new Set(selected.map(tagKey));
  const texts = {
    title: fold(content.title),
    excerpt: fold(content.excerpt),
    body: fold(prose(content.body)),
  };
  return known
    .filter((tag) => !taken.has(tagKey(tag)))
    .map((tag) => {
      const folded = fold(tag);
      const score = (Object.keys(WEIGHTS) as (keyof typeof WEIGHTS)[]).reduce(
        (total, part) => total + WEIGHTS[part] * occurrences(texts[part], folded),
        0,
      );
      return { tag, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, TAG_HINTS_MAX)
    .map(({ tag }) => tag);
}
