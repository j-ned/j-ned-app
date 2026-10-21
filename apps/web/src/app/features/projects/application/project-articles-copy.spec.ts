import { PROJECT_ARTICLES_COPY } from './project-articles-copy';

describe('PROJECT_ARTICLES_COPY', () => {
  it('pins every label of the project articles section', () => {
    expect(PROJECT_ARTICLES_COPY).toEqual({
      heading: 'Articles sur ce projet',
      summary: "Les articles où je raconte comment je l'ai construit.",
      articleCtaLabel: 'Article du projet',
    });
  });
});
