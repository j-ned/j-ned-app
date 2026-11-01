import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { Project, ProjectKind } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { AdminProjectPreview } from './admin-project-preview';

const DASHFLOW = makeProject({
  id: 'p-1',
  slug: 'dashflow',
  title: 'DashFlow',
  category: 'Application Web',
  kind: 'production',
  order: 3,
  tags: ['Angular', 'NestJS'],
  description: 'Budget et santé du foyer. Auto-hébergé.',
  pitch: 'Le foyer dans une seule app.',
  image: '',
});

async function renderPreview(
  project: Project | null,
  pendingCover?: boolean,
): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(AdminProjectPreview);
  fixture.componentRef.setInput('project', project);
  if (pendingCover !== undefined) fixture.componentRef.setInput('pendingCover', pendingCover);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const body = (host: HTMLElement): HTMLElement | null =>
  byTestId(host, 'admin-project-preview-body');

describe('AdminProjectPreview: cadre', () => {
  it('Given a project When the preview renders Then it is a section named « Aperçu public » and marked as live', async () => {
    const host = await renderPreview(DASHFLOW);
    const section = byTestId(host, 'admin-project-preview');
    const labelId = section?.getAttribute('aria-labelledby');

    expect({
      tag: section?.tagName,
      name: labelId ? normalized(host.querySelector(`[id="${labelId}"]`)) : null,
      title: testIdText(host, 'admin-project-preview-title'),
      live: testIdText(host, 'admin-project-preview-live'),
    }).toEqual({
      tag: 'SECTION',
      name: 'Aperçu public',
      title: 'Aperçu public',
      live: 'en direct',
    });
  });

  it.each([
    { kind: 'production', reference: 'Réalisations · En production' },
    { kind: 'demo', reference: 'Réalisations · Démo' },
    { kind: 'script', reference: 'Réalisations · Script' },
  ] satisfies readonly { kind: ProjectKind; reference: string }[])(
    'Given a $kind project When the preview renders Then it names where the card appears: « $reference »',
    async ({ kind, reference }) => {
      const host = await renderPreview(makeProject({ ...DASHFLOW, kind }));

      expect(normalized(byTestId(host, 'admin-project-preview-reference'))).toBe(reference);
    },
  );

  it('Given a project When the preview renders Then its body is inert, out of the tab order and of the accessibility tree', async () => {
    const host = await renderPreview(DASHFLOW);

    expect({
      inert: body(host)?.hasAttribute('inert') ?? false,
      cardInBody: body(host)?.contains(byTestId(host, 'project-case-study')) ?? false,
    }).toEqual({ inert: true, cardInBody: true });
  });
});

describe('AdminProjectPreview: carte publique', () => {
  it('Given a production project When the preview renders Then it shows the public case study of the project', async () => {
    const host = await renderPreview(DASHFLOW);
    const preview = body(host);

    expect({
      overline: testIdText(preview ?? host, 'project-case-study-overline'),
      title: testIdText(preview ?? host, 'project-case-study-title'),
      pitch: testIdText(preview ?? host, 'project-case-study-pitch'),
      card: byTestId(host, 'project-grid-card'),
    }).toEqual({
      overline: '03 · Application Web',
      title: 'DashFlow',
      pitch: 'Le foyer dans une seule app.',
      card: null,
    });
  });

  it.each([
    { order: 0, overline: '01 · Application Web' },
    { order: 1, overline: '01 · Application Web' },
    { order: 2, overline: '02 · Application Web' },
    { order: 12, overline: '12 · Application Web' },
  ])(
    'Given a production project at position $order When the preview renders Then the case study is numbered « $overline »',
    async ({ order, overline }) => {
      const host = await renderPreview(makeProject({ ...DASHFLOW, order }));

      expect(testIdText(host, 'project-case-study-overline')).toBe(overline);
    },
  );

  it('Given a production project without pitch When the preview renders Then the case study reads the first sentence of the description, as on the site', async () => {
    const host = await renderPreview(makeProject({ ...DASHFLOW, pitch: null }));

    expect(testIdText(host, 'project-case-study-pitch')).toBe('Budget et santé du foyer.');
  });

  it.each([
    { kind: 'demo', stamp: 'Démo' },
    { kind: 'script', stamp: 'Script' },
  ] satisfies readonly { kind: ProjectKind; stamp: string }[])(
    'Given a $kind project When the preview renders Then it shows the public card stamped « $stamp », not a case study',
    async ({ kind, stamp }) => {
      const host = await renderPreview(makeProject({ ...DASHFLOW, kind }));
      const preview = body(host);

      expect({
        title: testIdText(preview ?? host, 'project-grid-card-title'),
        stack: testIdText(preview ?? host, 'project-grid-card-stack'),
        stamp: normalized(byTestId(preview ?? host, 'project-cover-kind')),
        caseStudy: byTestId(host, 'project-case-study'),
      }).toEqual({
        title: 'DashFlow',
        stack: 'Angular · NestJS',
        stamp,
        caseStudy: null,
      });
    },
  );

  it('Given no project yet, the nature not chosen When the preview renders Then it asks for a nature and shows no card', async () => {
    const host = await renderPreview(null);

    expect({
      empty: testIdText(host, 'admin-project-preview-empty'),
      caseStudy: byTestId(host, 'project-case-study'),
      card: byTestId(host, 'project-grid-card'),
    }).toEqual({
      empty: 'Choisissez une nature pour voir la carte.',
      caseStudy: null,
      card: null,
    });
  });
});

describe('AdminProjectPreview: couverture en attente', () => {
  it.each([
    {
      pendingCover: true,
      notice: "Nouvelle couverture\u00a0: visible ici après l'enregistrement.",
    },
    { pendingCover: false, notice: null },
    { pendingCover: undefined, notice: null },
  ])(
    'Given a pending cover $pendingCover When the preview renders Then the notice reads $notice',
    async ({ pendingCover, notice }) => {
      const host = await renderPreview(DASHFLOW, pendingCover);
      const element = byTestId(host, 'admin-project-preview-pending-cover');

      expect(element ? normalized(element) : null).toBe(notice);
    },
  );
});
