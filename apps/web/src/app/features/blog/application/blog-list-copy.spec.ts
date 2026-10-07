import {
  articleCountLabel,
  BLOG_CATEGORY_FILTER_LABELS,
  readingTimeLabel,
  readLinkContext,
  visibleArticleCountLabel,
} from './blog-list-copy';

describe('blog list copy', () => {
  it.each([
    [0, '0\u00a0article'],
    [1, '1\u00a0article'],
    [2, '2\u00a0articles'],
    [12, '12\u00a0articles'],
  ])(
    'Given %i article(s) When the count is labelled Then it reads %j, glued by a non-breaking space',
    (count, expected) => {
      expect(articleCountLabel(count)).toBe(expected);
    },
  );

  it('Given the category filters When they are labelled Then each one has its public label', () => {
    expect(BLOG_CATEGORY_FILTER_LABELS).toEqual({
      all: 'Tous',
      stack: 'Stack',
      security: 'Sécurité',
      engineering: 'Ingénierie',
      journey: 'Parcours',
      projects: 'Projets',
    });
  });

  it.each([
    [1, '1\u00a0min de lecture'],
    [6, '6\u00a0min de lecture'],
    [12, '12\u00a0min de lecture'],
  ])(
    'Given %i minute(s) When the reading time is labelled Then it reads %j, glued by a non-breaking space',
    (minutes, expected) => {
      expect(readingTimeLabel(minutes)).toBe(expected);
    },
  );

  it.each([
    ['Mon article', '\u00a0: Mon article'],
    [
      'De 20 ans de métallurgie à développeur Full-Stack',
      '\u00a0: De 20 ans de métallurgie à développeur Full-Stack',
    ],
  ])(
    'Given the title %j When the read link context is built Then it reads %j, the colon glued to the link label',
    (title, expected) => {
      expect(readLinkContext(title)).toBe(expected);
    },
  );

  it.each([
    [0, '0\u00a0article affiché'],
    [1, '1\u00a0article affiché'],
    [2, '2\u00a0articles affichés'],
    [12, '12\u00a0articles affichés'],
  ])(
    'Given %i visible article(s) When the status is labelled Then it reads %j, glued by a non-breaking space',
    (count, expected) => {
      expect(visibleArticleCountLabel(count)).toBe(expected);
    },
  );
});
