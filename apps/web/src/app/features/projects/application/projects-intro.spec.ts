import type { ProjectKindCounts } from '../domain/models/project.model';
import { projectsIntro } from './projects-intro';

const CLOSING = 'Chaque fiche montre le résultat et les choix techniques.';

describe('projectsIntro', () => {
  it.each([
    {
      counts: { production: 2, demo: 2, script: 2 },
      expected: `Deux applications en service, deux sites de démonstration, deux outils de développement. ${CLOSING}`,
    },
    {
      counts: { production: 0, demo: 1, script: 0 },
      expected: `Un site de démonstration. ${CLOSING}`,
    },
  ] satisfies readonly { counts: ProjectKindCounts; expected: string }[])(
    'Given the counts $counts When the intro is written Then it names each nature in words',
    ({ counts, expected }) => {
      expect(projectsIntro(counts)).toBe(expected);
    },
  );

  it.each([
    {
      label: 'production at zero',
      counts: { production: 0, demo: 2, script: 3 },
      expected: `Deux sites de démonstration, trois outils de développement. ${CLOSING}`,
    },
    {
      label: 'demo at zero',
      counts: { production: 2, demo: 0, script: 3 },
      expected: `Deux applications en service, trois outils de développement. ${CLOSING}`,
    },
    {
      label: 'script at zero',
      counts: { production: 2, demo: 3, script: 0 },
      expected: `Deux applications en service, trois sites de démonstration. ${CLOSING}`,
    },
  ] satisfies readonly { label: string; counts: ProjectKindCounts; expected: string }[])(
    'Given $label When the intro is written Then that nature is left out',
    ({ counts, expected }) => {
      expect(projectsIntro(counts)).toBe(expected);
    },
  );

  it.each([
    {
      counts: { production: 10, demo: 0, script: 0 },
      expected: `10 applications en service. ${CLOSING}`,
    },
    {
      counts: { production: 9, demo: 12, script: 1 },
      expected: `Neuf applications en service, 12 sites de démonstration, un outil de développement. ${CLOSING}`,
    },
    {
      counts: { production: 0, demo: 0, script: 23 },
      expected: `23 outils de développement. ${CLOSING}`,
    },
  ] satisfies readonly { counts: ProjectKindCounts; expected: string }[])(
    'Given the counts $counts When the intro is written Then from ten on the count is in digits',
    ({ counts, expected }) => {
      expect(projectsIntro(counts)).toBe(expected);
    },
  );

  it('Given no known nature When the intro is written Then only the closing sentence remains', () => {
    expect(projectsIntro({ production: 0, demo: 0, script: 0 })).toBe(CLOSING);
  });
});
