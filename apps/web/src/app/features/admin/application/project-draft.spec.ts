import type { Project, ProjectInput } from '@features/projects/domain/models/project.model';
import { makeProject, makeProjectImage } from '@features/projects/testing/project-builders';
import {
  toPreviewProject,
  toProjectDraft,
  toProjectInput,
  type ProjectDraft,
} from './project-draft';

const EDITABLE = makeProject({
  id: 'p1',
  title: 'Projet',
  slug: 'projet',
  category: 'Application Web',
  tags: ['Angular'],
  description: 'Une description suffisante',
  repoUrl: 'https://github.com/x/repo',
  kind: 'script',
});

const draftOf = (overrides: Partial<ProjectDraft> = {}): ProjectDraft => ({
  ...toProjectDraft(EDITABLE),
  ...overrides,
});

describe('toProjectDraft', () => {
  it('Given no project When the draft is built Then every field is empty and no nature is chosen', () => {
    expect(toProjectDraft(null)).toEqual({
      title: '',
      category: '',
      description: '',
      liveUrl: '',
      repoUrl: '',
      repoUrlFront: '',
      repoUrlBack: '',
      featured: false,
      order: 0,
      kind: '',
      techChoices: [],
      architectureDecisions: [],
      pitch: '',
      highlight: '',
      scope: '',
    });
  });

  it('Given a complete project When the draft is built Then it carries every writable field', () => {
    const project = makeProject({
      title: 'DashFlow',
      category: 'Application Web',
      description: 'Budget et santé du foyer.',
      liveUrl: 'https://dashflow.nedellec-julien.fr',
      repoUrl: null,
      repoUrlFront: 'https://github.com/J-Ned/dashflow-front',
      repoUrlBack: 'https://github.com/J-Ned/dashflow-api',
      featured: true,
      order: 1,
      kind: 'production',
      techChoices: [{ techno: 'NestJS', why: 'modules' }],
      architectureDecisions: [{ decision: 'Chiffrement client', rationale: 'santé' }],
      pitch: 'Le foyer dans une seule app.',
      highlight: 'Chiffrement côté client',
      scope: 'Conception, front, API',
    });

    expect(toProjectDraft(project)).toEqual({
      title: 'DashFlow',
      category: 'Application Web',
      description: 'Budget et santé du foyer.',
      liveUrl: 'https://dashflow.nedellec-julien.fr',
      repoUrl: '',
      repoUrlFront: 'https://github.com/J-Ned/dashflow-front',
      repoUrlBack: 'https://github.com/J-Ned/dashflow-api',
      featured: true,
      order: 1,
      kind: 'production',
      techChoices: [{ techno: 'NestJS', why: 'modules' }],
      architectureDecisions: [{ decision: 'Chiffrement client', rationale: 'santé' }],
      pitch: 'Le foyer dans une seule app.',
      highlight: 'Chiffrement côté client',
      scope: 'Conception, front, API',
    });
  });

  it('Given a project without nature, links, lists or presentation When the draft is built Then those fields are empty', () => {
    const project = makeProject({
      kind: null,
      liveUrl: undefined,
      repoUrl: undefined,
      techChoices: undefined,
      architectureDecisions: undefined,
      pitch: null,
      highlight: null,
      scope: null,
    });

    const draft = toProjectDraft(project);

    expect({
      kind: draft.kind,
      liveUrl: draft.liveUrl,
      repoUrl: draft.repoUrl,
      techChoices: draft.techChoices,
      architectureDecisions: draft.architectureDecisions,
      presentation: [draft.pitch, draft.highlight, draft.scope],
    }).toEqual({
      kind: '',
      liveUrl: '',
      repoUrl: '',
      techChoices: [],
      architectureDecisions: [],
      presentation: ['', '', ''],
    });
  });

  it('Given a project with repeated rows When the draft is built Then its lists are copies holding the same rows', () => {
    const techChoices = [{ techno: 'Angular', why: 'signals' }];
    const architectureDecisions = [{ decision: 'Hexagonale', rationale: 'tests' }];

    const draft = toProjectDraft(makeProject({ techChoices, architectureDecisions }));

    expect({
      techChoices: draft.techChoices,
      architectureDecisions: draft.architectureDecisions,
      sameTech: draft.techChoices === techChoices,
      sameDecisions: draft.architectureDecisions === architectureDecisions,
    }).toEqual({
      techChoices: [{ techno: 'Angular', why: 'signals' }],
      architectureDecisions: [{ decision: 'Hexagonale', rationale: 'tests' }],
      sameTech: false,
      sameDecisions: false,
    });
  });
});

describe('toProjectInput', () => {
  it('Given an edited project unchanged When the payload is built Then it is exactly the writable fields, nature included', () => {
    const payload = toProjectInput(toProjectDraft(EDITABLE), new Set(EDITABLE.tags), 'script');

    expect(payload).toEqual({
      title: 'Projet',
      category: 'Application Web',
      tags: ['Angular'],
      description: 'Une description suffisante',
      liveUrl: null,
      repoUrl: 'https://github.com/x/repo',
      repoUrlFront: null,
      repoUrlBack: null,
      featured: false,
      order: 0,
      techChoices: [],
      architectureDecisions: [],
      kind: 'script',
      pitch: null,
      highlight: null,
      scope: null,
    } satisfies ProjectInput);
  });

  it.each([
    { field: 'liveUrl', typed: '', sent: null },
    { field: 'repoUrl', typed: '', sent: null },
    { field: 'repoUrlFront', typed: '', sent: null },
    { field: 'repoUrlBack', typed: '', sent: null },
    { field: 'repoUrl', typed: 'https://github.com/y/repo', sent: 'https://github.com/y/repo' },
  ] as const)(
    'Given the link $field set to « $typed » When the payload is built Then it sends $sent',
    ({ field, typed, sent }) => {
      const payload = toProjectInput(draftOf({ [field]: typed }), new Set(), 'demo');

      expect(payload[field]).toBe(sent);
    },
  );

  it.each([
    { field: 'pitch', typed: '  Texte saisi  ', sent: 'Texte saisi' },
    { field: 'highlight', typed: '  Texte saisi  ', sent: 'Texte saisi' },
    { field: 'scope', typed: '  Texte saisi  ', sent: 'Texte saisi' },
    { field: 'pitch', typed: '', sent: null },
    { field: 'highlight', typed: '   ', sent: null },
    { field: 'scope', typed: '', sent: null },
  ] as const)(
    'Given the presentation field $field set to « $typed » When the payload is built Then it sends $sent',
    ({ field, typed, sent }) => {
      const payload = toProjectInput(draftOf({ [field]: typed }), new Set(), 'demo');

      expect(payload[field]).toBe(sent);
    },
  );

  it('Given selected tags When the payload is built Then they are sent as a list in selection order', () => {
    const payload = toProjectInput(
      draftOf(),
      new Set(['TypeScript', 'Angular', 'NestJS']),
      'production',
    );

    expect(payload.tags).toEqual(['TypeScript', 'Angular', 'NestJS']);
  });

  it('Given repeated rows marked by the form When the payload is built Then each row is copied field by field', () => {
    const mark = Symbol('row identity');
    const draft = draftOf({
      techChoices: [{ techno: 'NestJS', why: 'modulaire', [mark]: 1 } as never],
      architectureDecisions: [
        { decision: 'hexagonale', rationale: 'testable', [mark]: 2 } as never,
      ],
    });

    const payload = toProjectInput(draft, new Set(), 'demo');
    const rows = [...(payload.techChoices ?? []), ...(payload.architectureDecisions ?? [])];

    expect({
      techChoices: payload.techChoices,
      architectureDecisions: payload.architectureDecisions,
      marked: rows.filter((row) => Object.getOwnPropertySymbols(row).length > 0).length,
    }).toEqual({
      techChoices: [{ techno: 'NestJS', why: 'modulaire' }],
      architectureDecisions: [{ decision: 'hexagonale', rationale: 'testable' }],
      marked: 0,
    });
  });

  it.each(['production', 'demo', 'script'] as const)(
    'Given the nature %s When the payload is built Then it carries that nature',
    (kind) => {
      expect(toProjectInput(draftOf({ kind }), new Set(), kind).kind).toBe(kind);
    },
  );
});

describe('toPreviewProject', () => {
  const BASE = makeProject({
    id: 'p-1',
    title: 'DashFlow',
    slug: 'dashflow',
    category: 'Application Web',
    tags: ['Angular'],
    description: 'Budget et santé du foyer.',
    image: 'https://cdn.test/projects/p-1.avif',
    kind: 'production',
    order: 1,
    gallery: [makeProjectImage({ id: 'img-a' })],
  });

  const previewOf = (
    overrides: Partial<ProjectDraft> = {},
    tags: ReadonlySet<string> = new Set(BASE.tags),
    base: Project | null = BASE,
  ): Project | null => toPreviewProject({ ...toProjectDraft(base), ...overrides }, tags, base);

  it('Given an edited draft of a saved project When the preview is built Then it is the public project the draft would make', () => {
    const preview = previewOf(
      {
        title: 'DashFlow 2',
        kind: 'demo',
        order: 3,
        featured: true,
        pitch: '  Le foyer dans une seule app.  ',
        highlight: 'Chiffrement côté client',
        scope: '',
        liveUrl: 'https://dashflow.nedellec-julien.fr',
        repoUrlFront: '',
        techChoices: [{ techno: 'NestJS', why: 'modules' }],
      },
      new Set(['TypeScript', 'Angular']),
    );

    expect(preview).toEqual({
      id: 'p-1',
      title: 'DashFlow 2',
      slug: 'dashflow',
      category: 'Application Web',
      tags: ['TypeScript', 'Angular'],
      description: 'Budget et santé du foyer.',
      image: 'https://cdn.test/projects/p-1.avif',
      techChoices: [{ techno: 'NestJS', why: 'modules' }],
      architectureDecisions: [],
      liveUrl: 'https://dashflow.nedellec-julien.fr',
      repoUrl: null,
      repoUrlFront: null,
      repoUrlBack: null,
      featured: true,
      order: 3,
      kind: 'demo',
      gallery: [makeProjectImage({ id: 'img-a' })],
      pitch: 'Le foyer dans une seule app.',
      highlight: 'Chiffrement côté client',
      scope: null,
    } satisfies Project);
  });

  it('Given a draft without nature When the preview is built Then there is no preview', () => {
    expect(previewOf({ kind: '' })).toBeNull();
  });

  it.each([
    { field: 'pitch', typed: '', shown: null },
    { field: 'pitch', typed: '   ', shown: null },
    { field: 'highlight', typed: '', shown: null },
    { field: 'scope', typed: ' ', shown: null },
    { field: 'pitch', typed: ' Accroche ', shown: 'Accroche' },
    { field: 'scope', typed: 'Front', shown: 'Front' },
  ] as const)(
    'Given the presentation field $field set to « $typed » When the preview is built Then it shows $shown',
    ({ field, typed, shown }) => {
      expect(previewOf({ [field]: typed })?.[field]).toBe(shown);
    },
  );

  it.each([
    { field: 'liveUrl', typed: '', shown: null },
    { field: 'repoUrl', typed: '', shown: null },
    { field: 'repoUrlFront', typed: '', shown: null },
    { field: 'repoUrlBack', typed: '', shown: null },
    { field: 'liveUrl', typed: 'https://x.test', shown: 'https://x.test' },
  ] as const)(
    'Given the link $field set to « $typed » When the preview is built Then it shows $shown',
    ({ field, typed, shown }) => {
      expect(previewOf({ [field]: typed })?.[field]).toBe(shown);
    },
  );

  it('Given a new project When the preview is built Then it has no address, no cover and no capture yet', () => {
    const preview = previewOf({ title: 'Nouveau', kind: 'script' }, new Set(), null);

    expect({
      id: preview?.id,
      slug: preview?.slug,
      image: preview?.image,
      gallery: preview?.gallery,
      title: preview?.title,
      kind: preview?.kind,
    }).toEqual({ id: '', slug: '', image: '', gallery: [], title: 'Nouveau', kind: 'script' });
  });
});
