import { BLOG_TAGS_BY_CATEGORY, type BlogTagCategory } from '../domain/models/blog-tag.model';
import { blogTagPalette } from './blog-tag-palette';

const DEFAULT_TAILWIND_COLOR =
  /\b(?:bg|text|border)-(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;

const FIRST_TAG_OF_EACH_CATEGORY = (
  Object.entries(BLOG_TAGS_BY_CATEGORY) as [BlogTagCategory, readonly string[]][]
).map(([category, tags]) => [category, tags[0]] as const);

describe('blogTagPalette', () => {
  it.each(FIRST_TAG_OF_EACH_CATEGORY)(
    'Given un tag de la catégorie %s (« %s ») When on lit sa palette Then elle est en Signal Indigo',
    (_category, tag) => {
      expect(blogTagPalette(tag).tint).toContain('text-primary');
      expect(blogTagPalette(tag).solid).toContain('bg-primary-bg');
    },
  );

  it('Given deux catégories différentes When on compare leurs palettes Then elles sont identiques', () => {
    expect(blogTagPalette(BLOG_TAGS_BY_CATEGORY.security[0])).toEqual(
      blogTagPalette(BLOG_TAGS_BY_CATEGORY.projects[0]),
    );
  });

  it('Given un tag libre When on lit sa palette Then la pastille est neutre et la sélection indigo', () => {
    const palette = blogTagPalette('Tag inconnu');
    expect(palette.tint).toContain('text-muted');
    expect(palette.tint).not.toContain('primary');
    expect(palette.solid).toContain('bg-primary-bg');
  });

  it.each([...FIRST_TAG_OF_EACH_CATEGORY.map(([, tag]) => tag), 'Tag inconnu'])(
    'Given le tag « %s » When on lit sa palette Then aucune couleur de la palette Tailwind par défaut',
    (tag) => {
      const { tint, solid } = blogTagPalette(tag);
      expect(`${tint} ${solid}`).not.toMatch(DEFAULT_TAILWIND_COLOR);
    },
  );
});
