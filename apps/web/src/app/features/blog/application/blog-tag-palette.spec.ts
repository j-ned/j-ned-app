import { BLOG_TAGS_BY_CATEGORY, type BlogTagCategory } from '../domain/models/blog-tag.model';
import { blogTagPalette } from './blog-tag-palette';

const DEFAULT_TAILWIND_COLOR =
  /\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

const FIRST_TAG_OF_EACH_CATEGORY = (
  Object.entries(BLOG_TAGS_BY_CATEGORY) as [BlogTagCategory, readonly string[]][]
).map(([category, tags]) => [category, tags[0]] as const);

const tokens = (classes: string): readonly string[] => classes.split(/\s+/).filter(Boolean).sort();

const accentTints = (classes: string): readonly string[] =>
  tokens(classes).filter((token) => /^(?:[\w-]+:)*bg-primary\/\d+$/.test(token));

describe('blogTagPalette', () => {
  it.each(FIRST_TAG_OF_EACH_CATEGORY)(
    'Given un tag de la catégorie %s (« %s ») When on lit sa palette Then la pastille est en accent sur une teinte de 5 %, 8 % au survol',
    (_category, tag) => {
      const { tint } = blogTagPalette(tag);

      expect({ text: tokens(tint).includes('text-primary'), tints: accentTints(tint) }).toEqual({
        text: true,
        tints: ['bg-primary/5', 'hover:bg-primary/8'],
      });
    },
  );

  it('Given deux catégories différentes When on compare leurs palettes Then elles sont identiques', () => {
    expect(blogTagPalette(BLOG_TAGS_BY_CATEGORY.security[0])).toEqual(
      blogTagPalette(BLOG_TAGS_BY_CATEGORY.projects[0]),
    );
  });

  it('Given un tag libre When on lit sa palette Then la pastille est neutre', () => {
    const { tint } = blogTagPalette('Tag inconnu');

    expect({ text: tokens(tint).includes('text-muted'), accent: tint.includes('primary') }).toEqual(
      { text: true, accent: false },
    );
  });

  it.each([...FIRST_TAG_OF_EACH_CATEGORY.map(([, tag]) => tag), 'Tag inconnu'])(
    'Given le tag « %s » When on lit sa palette Then aucune couleur de la palette Tailwind par défaut ni de blanc en dur',
    (tag) => {
      const { tint } = blogTagPalette(tag);
      expect(tint).not.toMatch(DEFAULT_TAILWIND_COLOR);
      expect(tokens(tint).filter((token) => token.endsWith('-white'))).toEqual([]);
    },
  );
});
