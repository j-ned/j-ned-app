import type { Project, ProjectKind, ProjectKindFilter } from '../domain/models/project.model';
import { makeProject } from '../testing/project-builders';
import {
  toCaseStudyView,
  toProjectCardView,
  toProjectsView,
  type CaseStudyView,
  type ProjectCardView,
} from './projects-view';

const CLOSING = 'Chaque fiche montre le résultat et les choix techniques.';

const projectsOfKinds = (kinds: readonly (ProjectKind | null)[]): readonly Project[] =>
  kinds.map((kind, index) => makeProject({ id: `p-${index}`, slug: `p-${index}`, kind }));

const MOCKUP_CATALOG = projectsOfKinds([
  'production',
  'production',
  'demo',
  'demo',
  'script',
  'script',
]);

describe('toProjectsView', () => {
  describe('total', () => {
    it.each([
      { kinds: [], expected: 0 },
      { kinds: ['demo'], expected: 1 },
      { kinds: ['production', 'demo', 'script', 'script', 'demo', 'production'], expected: 6 },
      { kinds: ['production', null, null], expected: 3 },
    ] satisfies readonly { kinds: readonly (ProjectKind | null)[]; expected: number }[])(
      'Given projects of kinds $kinds When the view is built Then the total is $expected',
      ({ kinds, expected }) => {
        expect(toProjectsView(projectsOfKinds(kinds), 'all').total).toBe(expected);
      },
    );
  });

  describe('intro', () => {
    it('Given the mockup catalog When the view is built Then the intro is the mockup text', () => {
      expect(toProjectsView(MOCKUP_CATALOG, 'all').intro).toBe(
        `Deux applications en service, deux sites de démonstration, deux outils de développement. ${CLOSING}`,
      );
    });

    it('Given projects without a nature When the view is built Then the intro leaves them out', () => {
      const projects = projectsOfKinds(['production', null, 'script', null]);

      expect(toProjectsView(projects, 'all').intro).toBe(
        `Une application en service, un outil de développement. ${CLOSING}`,
      );
    });

    it('Given no project When the view is built Then the intro is the closing sentence alone', () => {
      expect(toProjectsView([], 'all').intro).toBe(CLOSING);
    });
  });

  describe('legend', () => {
    it('Given the mockup catalog When the view is built Then the legend has one row per nature, defined and counted', () => {
      expect(toProjectsView(MOCKUP_CATALOG, 'all').legend).toEqual([
        { kind: 'production', definition: 'Utilisé pour de vrai', count: 2 },
        { kind: 'demo', definition: 'Entreprise fictive', count: 2 },
        { kind: 'script', definition: 'Outil en ligne de commande', count: 2 },
      ]);
    });

    it.each([
      {
        label: 'scripts only',
        kinds: ['script', 'script', 'script'],
        expected: [0, 0, 3],
      },
      {
        label: 'a demo and projects without a nature',
        kinds: [null, 'demo', null],
        expected: [0, 1, 0],
      },
      {
        label: 'no project',
        kinds: [],
        expected: [0, 0, 0],
      },
      {
        label: 'natures listed out of order',
        kinds: ['script', 'demo', 'production', 'script'],
        expected: [1, 1, 2],
      },
    ] satisfies readonly {
      label: string;
      kinds: readonly (ProjectKind | null)[];
      expected: readonly number[];
    }[])(
      'Given $label When the view is built Then the legend keeps the three natures in order with their counts',
      ({ kinds, expected }) => {
        const legend = toProjectsView(projectsOfKinds(kinds), 'all').legend;

        expect(legend.map((row) => row.kind)).toEqual(['production', 'demo', 'script']);
        expect(legend.map((row) => row.count)).toEqual(expected);
      },
    );
  });

  describe('caseStudies', () => {
    const DASHFLOW = makeProject({
      id: 'dashflow',
      slug: 'dashflow',
      title: 'DashFlow',
      category: 'Application web',
      kind: 'production',
      tags: ['Angular', 'TypeScript', 'TailwindCSS', 'Docker', 'PostgreSQL', 'NestJS'],
      description: 'DashFlow centralise le budget. Il chiffre tout.',
      pitch: 'Le budget familial et le suivi médical de toute la famille dans une seule app.',
      highlight: 'Chiffrement de bout en bout côté client',
      scope: 'Conception, développement, déploiement',
      liveUrl: 'https://dashflow.nedellec-julien.fr',
      image: 'https://api.test/projects/dashflow.avif',
    });

    const CANDIDASH = makeProject({
      id: 'candidash',
      slug: 'candidash',
      title: 'CandiDash',
      category: 'Application web',
      kind: 'production',
      tags: ['Angular', 'NestJS'],
      description: 'Un tracker de candidatures dédié. Sans tableur.',
      pitch: null,
      highlight: null,
      scope: 'Conception, développement, déploiement',
      image: '',
    });

    const caseStudiesOf = (projects: readonly Project[]): readonly CaseStudyView[] =>
      toProjectsView(projects, 'all').caseStudies;

    it('Given production projects among demos, scripts and unknown natures When the view is built Then each production project becomes a case study, in order', () => {
      const projects = [
        makeProject({ id: 'demo', kind: 'demo', featured: true }),
        DASHFLOW,
        makeProject({ id: 'script', kind: 'script' }),
        makeProject({ id: 'unknown', kind: null }),
        CANDIDASH,
      ];

      expect(caseStudiesOf(projects)).toEqual([
        {
          id: 'dashflow',
          slug: 'dashflow',
          title: 'DashFlow',
          overline: '01 · Application web',
          pitch: 'Le budget familial et le suivi médical de toute la famille dans une seule app.',
          facts: [
            { label: 'Stack', value: 'Angular · TypeScript · TailwindCSS · Docker' },
            { label: 'Point fort', value: 'Chiffrement de bout en bout côté client' },
            { label: 'Périmètre', value: 'Conception, développement, déploiement' },
          ],
          liveUrl: 'https://dashflow.nedellec-julien.fr',
          image: 'https://api.test/projects/dashflow.avif',
        },
        {
          id: 'candidash',
          slug: 'candidash',
          title: 'CandiDash',
          overline: '02 · Application web',
          pitch: 'Un tracker de candidatures dédié.',
          facts: [
            { label: 'Stack', value: 'Angular · NestJS' },
            { label: 'Périmètre', value: 'Conception, développement, déploiement' },
          ],
          liveUrl: null,
          image: '',
        },
      ]);
    });

    it.each([
      {
        label: 'no tag and no editorial fact',
        overrides: { tags: [], highlight: null, scope: null },
        expected: [],
      },
      {
        label: 'only a highlight',
        overrides: { tags: [], highlight: 'Mode --dry-run', scope: null },
        expected: [{ label: 'Point fort', value: 'Mode --dry-run' }],
      },
      {
        label: 'only a scope',
        overrides: { tags: [], highlight: null, scope: 'Conception et maintenance' },
        expected: [{ label: 'Périmètre', value: 'Conception et maintenance' }],
      },
      {
        label: 'tags and a highlight',
        overrides: { tags: ['Bash'], highlight: 'Menus interactifs', scope: null },
        expected: [
          { label: 'Stack', value: 'Bash' },
          { label: 'Point fort', value: 'Menus interactifs' },
        ],
      },
    ] satisfies readonly {
      label: string;
      overrides: Partial<Project>;
      expected: readonly { label: string; value: string }[];
    }[])(
      'Given a production project with $label When the view is built Then only the known facts are listed, in order',
      ({ overrides, expected }) => {
        const [caseStudy] = caseStudiesOf([makeProject({ kind: 'production', ...overrides })]);

        expect(caseStudy?.facts).toEqual(expected);
      },
    );

    it('Given ten production projects When the view is built Then the overline index has two digits', () => {
      const projects = Array.from({ length: 10 }, (_, index) =>
        makeProject({ id: `p-${index}`, kind: 'production', category: 'Script' }),
      );

      expect(caseStudiesOf(projects).map((caseStudy) => caseStudy.overline)).toEqual([
        '01 · Script',
        '02 · Script',
        '03 · Script',
        '04 · Script',
        '05 · Script',
        '06 · Script',
        '07 · Script',
        '08 · Script',
        '09 · Script',
        '10 · Script',
      ]);
    });

    it.each([
      { label: 'no live link', liveUrl: undefined },
      { label: 'an erased live link', liveUrl: null },
    ])(
      'Given a production project with $label When the view is built Then its live link is null',
      ({ liveUrl }) => {
        const [caseStudy] = caseStudiesOf([makeProject({ kind: 'production', liveUrl })]);

        expect(caseStudy?.liveUrl).toBeNull();
      },
    );

    it('Given no production project When the view is built Then there is no case study', () => {
      expect(caseStudiesOf(projectsOfKinds(['demo', 'script', null]))).toEqual([]);
    });
  });

  describe('cards', () => {
    const cardsOf = (projects: readonly Project[]): readonly ProjectCardView[] =>
      toProjectsView(projects, 'all').cards;

    it('Given demos, scripts and unknown natures among production projects When the view is built Then every non-production project becomes a card, in order, whatever its featured flag', () => {
      const projects = [
        makeProject({
          id: 'coaching',
          slug: 'coaching-life',
          title: 'Coaching Life',
          kind: 'demo',
          featured: true,
          tags: ['Angular', 'PostgreSQL', 'TailwindCSS'],
          pitch: 'Site vitrine d’une coach fictive : trois activités et la prise de rendez-vous.',
          image: 'https://api.test/projects/coaching-life.avif',
        }),
        makeProject({ id: 'dashflow', kind: 'production', featured: false }),
        makeProject({
          id: 'gitpush',
          slug: 'gitpush-auto',
          title: 'GitPush Auto',
          kind: 'script',
          tags: ['Bash', 'Git'],
          description: 'Guide tout le flux Git. Menus en français et en anglais.',
          pitch: null,
          image: '',
        }),
        makeProject({
          id: 'unknown',
          slug: 'inconnu',
          title: 'Inconnu',
          kind: null,
          tags: [],
          description: 'Sans nature',
          image: 'https://api.test/projects/inconnu.avif',
        }),
      ];

      expect(cardsOf(projects)).toEqual([
        {
          id: 'coaching',
          slug: 'coaching-life',
          title: 'Coaching Life',
          kind: 'demo',
          stack: 'Angular · PostgreSQL',
          pitch: 'Site vitrine d’une coach fictive : trois activités et la prise de rendez-vous.',
          image: 'https://api.test/projects/coaching-life.avif',
        },
        {
          id: 'gitpush',
          slug: 'gitpush-auto',
          title: 'GitPush Auto',
          kind: 'script',
          stack: 'Bash · Git',
          pitch: 'Guide tout le flux Git.',
          image: '',
        },
        {
          id: 'unknown',
          slug: 'inconnu',
          title: 'Inconnu',
          kind: null,
          stack: '',
          pitch: 'Sans nature',
          image: 'https://api.test/projects/inconnu.avif',
        },
      ]);
    });

    it.each([
      { tags: [], expected: '' },
      { tags: ['Bash'], expected: 'Bash' },
      { tags: ['Astro', 'TailwindCSS'], expected: 'Astro · TailwindCSS' },
      { tags: ['Bash', 'GitHub Actions', 'JSON', 'Docker'], expected: 'Bash · GitHub Actions' },
    ] satisfies readonly { tags: readonly string[]; expected: string }[])(
      'Given a demo tagged $tags When the view is built Then its short stack is « $expected »',
      ({ tags, expected }) => {
        const [card] = cardsOf([makeProject({ kind: 'demo', tags: [...tags] })]);

        expect(card?.stack).toBe(expected);
      },
    );

    it('Given production projects only When the view is built Then there is no card', () => {
      expect(cardsOf(projectsOfKinds(['production', 'production']))).toEqual([]);
    });

    it('Given the mockup catalog When the view is built Then the four demos and scripts are cards and the two productions are case studies', () => {
      const view = toProjectsView(MOCKUP_CATALOG, 'all');

      expect(view.cards.map((card) => card.id)).toEqual(['p-2', 'p-3', 'p-4', 'p-5']);
      expect(view.caseStudies.map((caseStudy) => caseStudy.id)).toEqual(['p-0', 'p-1']);
    });
  });

  describe('filters', () => {
    it('Given the mockup catalog When the view is built Then « Tous » comes first, then each nature with its count', () => {
      expect(toProjectsView(MOCKUP_CATALOG, 'all').filters).toEqual([
        { value: 'all', label: 'Tous', count: 6 },
        { value: 'production', label: 'En production', count: 2 },
        { value: 'demo', label: 'Démos', count: 2 },
        { value: 'script', label: 'Scripts', count: 2 },
      ]);
    });

    it.each([
      {
        label: 'no demo',
        kinds: ['script', 'production', 'production'],
        expected: [
          ['all', 3],
          ['production', 2],
          ['script', 1],
        ],
      },
      {
        label: 'demos only and a project without a nature',
        kinds: ['demo', null, 'demo'],
        expected: [
          ['all', 3],
          ['demo', 2],
        ],
      },
      {
        label: 'projects without a nature only',
        kinds: [null, null],
        expected: [['all', 2]],
      },
      { label: 'no project', kinds: [], expected: [['all', 0]] },
    ] satisfies readonly {
      label: string;
      kinds: readonly (ProjectKind | null)[];
      expected: readonly (readonly [ProjectKindFilter, number])[];
    }[])(
      'Given $label When the view is built Then a nature without project is not offered',
      ({ kinds, expected }) => {
        const filters = toProjectsView(projectsOfKinds(kinds), 'all').filters;

        expect(filters.map((option) => [option.value, option.count])).toEqual(expected);
      },
    );

    it.each(['all', 'production', 'demo', 'script'] satisfies readonly ProjectKindFilter[])(
      'Given the mockup catalog When the view is built under the filter %s Then the header ignores the filter',
      (filter) => {
        const { total, intro, legend, filters } = toProjectsView(MOCKUP_CATALOG, filter);
        const unfiltered = toProjectsView(MOCKUP_CATALOG, 'all');

        expect({ total, intro, legend, filters }).toEqual({
          total: unfiltered.total,
          intro: unfiltered.intro,
          legend: unfiltered.legend,
          filters: unfiltered.filters,
        });
        expect(total).toBe(6);
      },
    );
  });

  describe('kind filter', () => {
    const CATALOG: readonly Project[] = projectsOfKinds([
      'demo',
      'production',
      null,
      'script',
      'production',
      'demo',
    ]);

    it.each([
      {
        filter: 'all',
        caseStudies: ['p-1', 'p-4'],
        cards: ['p-0', 'p-2', 'p-3', 'p-5'],
        visibleCount: 6,
      },
      { filter: 'production', caseStudies: ['p-1', 'p-4'], cards: [], visibleCount: 2 },
      { filter: 'demo', caseStudies: [], cards: ['p-0', 'p-5'], visibleCount: 2 },
      { filter: 'script', caseStudies: [], cards: ['p-3'], visibleCount: 1 },
    ] satisfies readonly {
      filter: ProjectKindFilter;
      caseStudies: readonly string[];
      cards: readonly string[];
      visibleCount: number;
    }[])(
      'Given mixed natures When the view is built under the filter $filter Then only the matching projects are shown and counted',
      ({ filter, caseStudies, cards, visibleCount }) => {
        const view = toProjectsView(CATALOG, filter);

        expect({
          caseStudies: view.caseStudies.map((caseStudy) => caseStudy.id),
          cards: view.cards.map((card) => card.id),
          visibleCount: view.visibleCount,
        }).toEqual({ caseStudies, cards, visibleCount });
      },
    );

    it.each([
      { label: 'scripts', kinds: ['production', 'demo', null], filter: 'script' },
      { label: 'demos', kinds: ['script', 'production'], filter: 'demo' },
      { label: 'production projects', kinds: ['demo', null], filter: 'production' },
    ] satisfies readonly {
      label: string;
      kinds: readonly (ProjectKind | null)[];
      filter: ProjectKindFilter;
    }[])(
      'Given no more $label When the view is built under that filter Then everything is shown as under « Tous »',
      ({ kinds, filter }) => {
        const projects = projectsOfKinds(kinds);
        const view = toProjectsView(projects, filter);
        const all = toProjectsView(projects, 'all');

        expect({
          caseStudies: view.caseStudies,
          cards: view.cards,
          visibleCount: view.visibleCount,
        }).toEqual({ caseStudies: all.caseStudies, cards: all.cards, visibleCount: kinds.length });
      },
    );
  });
});

describe('toCaseStudyView', () => {
  const PROJECT = makeProject({
    id: 'p-1',
    slug: 'dashflow',
    title: 'DashFlow',
    category: 'Application Web',
    kind: 'production',
    tags: ['Angular', 'TypeScript', 'NestJS', 'PostgreSQL', 'Docker'],
    description: 'Budget et santé du foyer. Auto-hébergé.',
    pitch: null,
    highlight: 'Chiffrement côté client',
    scope: null,
    image: 'https://cdn.test/projects/p-1.avif',
  });

  it('Given a project and its rank When the case study is built on its own Then it numbers the overline from that rank', () => {
    expect(toCaseStudyView(PROJECT, 2)).toEqual({
      id: 'p-1',
      slug: 'dashflow',
      title: 'DashFlow',
      overline: '03 · Application Web',
      pitch: 'Budget et santé du foyer.',
      facts: [
        { label: 'Stack', value: 'Angular · TypeScript · NestJS · PostgreSQL' },
        { label: 'Point fort', value: 'Chiffrement côté client' },
      ],
      liveUrl: null,
      image: 'https://cdn.test/projects/p-1.avif',
    } satisfies CaseStudyView);
  });

  it('Given the projects page When its case studies are built Then each one is the case study built on its own at its rank', () => {
    const second = makeProject({ id: 'p-2', slug: 'candidash', kind: 'production' });

    expect(toProjectsView([PROJECT, second], 'all').caseStudies).toEqual([
      toCaseStudyView(PROJECT, 0),
      toCaseStudyView(second, 1),
    ]);
  });
});

describe('toProjectCardView', () => {
  const DEMO = makeProject({
    id: 'p-3',
    slug: 'atelier',
    title: 'Atelier',
    kind: 'demo',
    tags: ['Astro', 'TailwindCSS', 'TypeScript'],
    description: 'Site vitrine fictif. Pour la démonstration.',
    pitch: 'Un site vitrine pour un artisan.',
    image: 'https://cdn.test/projects/p-3.avif',
  });

  it('Given a demo When its card is built on its own Then it shows its nature, its first two tools and its pitch', () => {
    expect(toProjectCardView(DEMO)).toEqual({
      id: 'p-3',
      slug: 'atelier',
      title: 'Atelier',
      kind: 'demo',
      stack: 'Astro · TailwindCSS',
      pitch: 'Un site vitrine pour un artisan.',
      image: 'https://cdn.test/projects/p-3.avif',
    } satisfies ProjectCardView);
  });

  it('Given the projects page When its cards are built Then each one is the card built on its own', () => {
    const script = makeProject({ id: 'p-4', slug: 'cli', kind: 'script' });

    expect(toProjectsView([DEMO, script], 'all').cards).toEqual([
      toProjectCardView(DEMO),
      toProjectCardView(script),
    ]);
  });
});
