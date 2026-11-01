import type { Project, ProjectKind } from '../domain/models/project.model';
import { makeProject } from '../testing/project-builders';
import { toFeaturedProjectView } from './featured-project-view';

const DECISION = {
  decision: 'Chiffrement côté client',
  rationale: 'Le serveur ne voit jamais les données en clair.',
};

const factLabels = (project: Project): readonly string[] =>
  toFeaturedProjectView(project).facts.map((fact) => fact.label);

describe('toFeaturedProjectView', () => {
  it('Given a fully described project When the view is built Then it carries the cover, the overline, the pitch, the facts in order and the live link', () => {
    const project = makeProject({
      id: 'dashflow-id',
      slug: 'dashflow',
      title: 'DashFlow',
      category: 'Application web',
      kind: 'production',
      image: 'https://api.test/projects/dashflow.avif',
      description: 'Une application de budget. Elle chiffre tout côté client.',
      pitch: 'Le budget familial et le suivi médical dans une seule app.',
      highlight: 'Chiffrement de bout en bout côté client',
      scope: 'Conception, développement, déploiement',
      tags: ['Angular', 'TypeScript', 'TailwindCSS', 'Docker', 'PostgreSQL', 'NestJS'],
      architectureDecisions: [DECISION, { decision: 'Monorepo', rationale: 'Un seul dépôt.' }],
      liveUrl: 'https://dashflow.test/',
      repoUrl: 'https://github.test/dashflow',
      repoUrlFront: 'https://github.test/dashflow-front',
      repoUrlBack: 'https://github.test/dashflow-back',
    });

    expect(toFeaturedProjectView(project)).toEqual({
      id: 'dashflow-id',
      slug: 'dashflow',
      title: 'DashFlow',
      category: 'Application web',
      kind: 'production',
      image: 'https://api.test/projects/dashflow.avif',
      pitch: 'Le budget familial et le suivi médical dans une seule app.',
      facts: [
        { label: 'Décision clé', value: 'Chiffrement côté client' },
        { label: 'Point fort', value: 'Chiffrement de bout en bout côté client' },
        { label: 'Périmètre', value: 'Conception, développement, déploiement' },
        { label: 'Stack', value: 'Angular · TypeScript · TailwindCSS · Docker' },
      ],
      liveLink: { url: 'https://dashflow.test/', label: "Ouvrir l'application" },
    });
  });

  describe('pitch', () => {
    it.each([
      {
        label: 'a pitch',
        pitch: 'Un tracker de candidatures dédié.',
        description: 'Première phrase. Seconde phrase.',
        expected: 'Un tracker de candidatures dédié.',
      },
      {
        label: 'no pitch and a description of several sentences',
        pitch: null,
        description: 'Première phrase. Seconde phrase. Troisième phrase.',
        expected: 'Première phrase.',
      },
      {
        label: 'no pitch and a single-sentence description',
        pitch: null,
        description: 'Une seule phrase.',
        expected: 'Une seule phrase.',
      },
    ])(
      'Given $label When the view is built Then the pitch is « $expected »',
      ({ pitch, description, expected }) => {
        expect(toFeaturedProjectView(makeProject({ pitch, description })).pitch).toBe(expected);
      },
    );
  });

  describe('key decision', () => {
    it('Given several decisions When the view is built Then only the title of the first one is shown, without its rationale', () => {
      const facts = toFeaturedProjectView(
        makeProject({
          architectureDecisions: [DECISION, { decision: 'Autre', rationale: 'x' }],
        }),
      ).facts;

      expect(facts).toEqual([{ label: 'Décision clé', value: 'Chiffrement côté client' }]);
    });

    it.each([
      { label: 'an empty list', decisions: [] },
      { label: 'a field missing from the API response', decisions: undefined },
    ])('Given $label When the view is built Then no key decision is shown', ({ decisions }) => {
      expect(factLabels(makeProject({ architectureDecisions: decisions }))).toEqual([]);
    });
  });

  describe('facts', () => {
    it.each([
      {
        label: 'nothing but a highlight',
        overrides: { highlight: 'Workflow réutilisable' },
        expected: ['Point fort'],
      },
      {
        label: 'nothing but a scope',
        overrides: { scope: 'Conception et maintenance' },
        expected: ['Périmètre'],
      },
      {
        label: 'a decision and tags, without highlight nor scope',
        overrides: { architectureDecisions: [DECISION], tags: ['Bash'] },
        expected: ['Décision clé', 'Stack'],
      },
      {
        label: 'a scope and tags',
        overrides: { scope: 'Conception et maintenance', tags: ['Bash'] },
        expected: ['Périmètre', 'Stack'],
      },
      {
        label: 'no editorial field and no tag',
        overrides: {},
        expected: [],
      },
    ] satisfies readonly { label: string; overrides: Partial<Project>; expected: string[] }[])(
      'Given $label When the view is built Then the facts are $expected',
      ({ overrides, expected }) => {
        expect(factLabels(makeProject(overrides))).toEqual(expected);
      },
    );

    it.each([
      { tags: ['Bash'], expected: 'Bash' },
      { tags: ['Astro', 'TailwindCSS', 'Netlify'], expected: 'Astro · TailwindCSS · Netlify' },
      { tags: ['A', 'B', 'C', 'D'], expected: 'A · B · C · D' },
      { tags: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'], expected: 'A · B · C · D' },
    ])(
      'Given the tags $tags When the view is built Then the stack reads « $expected »',
      ({ tags, expected }) => {
        expect(toFeaturedProjectView(makeProject({ tags })).facts).toEqual([
          { label: 'Stack', value: expected },
        ]);
      },
    );
  });

  describe('live link', () => {
    it.each([
      { label: 'null', liveUrl: null },
      { label: 'missing', liveUrl: undefined },
      { label: 'empty', liveUrl: '' },
    ])(
      'Given a $label live URL When the view is built Then there is no live link',
      ({ liveUrl }) => {
        expect(toFeaturedProjectView(makeProject({ liveUrl })).liveLink).toBeNull();
      },
    );

    it.each([
      { kind: 'production', label: "Ouvrir l'application" },
      { kind: 'demo', label: 'Voir la démo' },
      { kind: 'script', label: 'Voir le site' },
      { kind: null, label: 'Voir le site' },
    ] satisfies readonly { kind: ProjectKind | null; label: string }[])(
      'Given a live URL on a $kind project When the view is built Then the live link reads « $label »',
      ({ kind, label }) => {
        expect(
          toFeaturedProjectView(makeProject({ kind, liveUrl: 'https://app.test/' })).liveLink,
        ).toEqual({ url: 'https://app.test/', label });
      },
    );
  });
});
