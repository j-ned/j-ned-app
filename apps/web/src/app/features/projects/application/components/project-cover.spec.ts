import { TestBed } from '@angular/core/testing';
import type { ProjectKind } from '../../domain/models/project.model';
import { ProjectCover } from './project-cover';

type CoverInputs = {
  readonly image?: string;
  readonly alt?: string;
  readonly kind?: ProjectKind | null;
  readonly priority?: boolean;
};

const COVER_URL = 'https://api.test/projects/dashflow.avif';

describe('ProjectCover', () => {
  afterEach(() => TestBed.resetTestingModule());

  const render = async ({
    image = COVER_URL,
    alt = 'Aperçu du projet DashFlow',
    kind = 'production',
    priority,
  }: CoverInputs = {}): Promise<HTMLElement> => {
    const fixture = TestBed.createComponent(ProjectCover);
    fixture.componentRef.setInput('image', image);
    fixture.componentRef.setInput('alt', alt);
    fixture.componentRef.setInput('kind', kind);
    if (priority !== undefined) fixture.componentRef.setInput('priority', priority);
    fixture.detectChanges();
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  const byTestId = (root: HTMLElement, id: string): HTMLElement | null =>
    root.querySelector<HTMLElement>(`[data-testid="${id}"]`);

  it('Given a cover image When the cover renders Then the image fills a figure, described by its alt', async () => {
    const root = await render();
    const figure = byTestId(root, 'project-cover');
    const image = byTestId(root, 'project-cover-image');

    expect(figure?.tagName).toBe('FIGURE');
    expect(image?.tagName).toBe('IMG');
    expect(image?.closest('figure')).toBe(figure);
    expect(image?.getAttribute('src')).toBe(COVER_URL);
    expect(image?.getAttribute('alt')).toBe('Aperçu du projet DashFlow');
    expect(byTestId(root, 'project-cover-placeholder')).toBeNull();
  });

  it('Given no cover image When the cover renders Then a hidden placeholder stands in its frame, without any image', async () => {
    const root = await render({ image: '' });
    const placeholder = byTestId(root, 'project-cover-placeholder');

    expect(root.querySelectorAll('img')).toHaveLength(0);
    expect(placeholder?.getAttribute('aria-hidden')).toBe('true');
    expect(placeholder?.closest('figure')).toBe(byTestId(root, 'project-cover'));
  });

  it.each([{ image: COVER_URL }, { image: '' }])(
    'Given the image $image When the cover renders Then its frame keeps the 16/10 ratio',
    async ({ image }) => {
      expect(byTestId(await render({ image }), 'project-cover')?.classList).toContain(
        'aspect-[16/10]',
      );
    },
  );

  it.each([
    { priority: true, fetchpriority: 'high', loading: 'eager' },
    { priority: false, fetchpriority: 'auto', loading: 'lazy' },
    { priority: undefined, fetchpriority: 'auto', loading: 'lazy' },
  ])(
    'Given priority $priority When the cover renders Then the image loads with priority $fetchpriority',
    async ({ priority, fetchpriority, loading }) => {
      const image = byTestId(await render({ priority }), 'project-cover-image');

      expect({
        fetchpriority: image?.getAttribute('fetchpriority'),
        loading: image?.getAttribute('loading'),
      }).toEqual({ fetchpriority, loading });
    },
  );

  it.each([
    { kind: 'production' as const, label: 'En production' },
    { kind: 'demo' as const, label: 'Démo' },
    { kind: 'script' as const, label: 'Script' },
  ])(
    'Given the nature $kind When the cover renders Then the shared kind stamp reads $label inside the frame',
    async ({ kind, label }) => {
      const root = await render({ kind });
      const stamp = byTestId(root, 'project-cover-kind');

      expect(stamp?.tagName).toBe('APP-PROJECT-KIND-STAMP');
      expect(stamp?.textContent?.trim()).toBe(label);
      expect(stamp?.closest('figure')).toBe(byTestId(root, 'project-cover'));
    },
  );

  it('Given a nature When the cover renders Then the stamp lets clicks through to the link stretched over the card', async () => {
    const stamp = byTestId(await render({ kind: 'demo' }), 'project-cover-kind');

    expect(stamp?.classList).toContain('pointer-events-none');
  });

  it('Given no nature When the cover renders Then no stamp is shown', async () => {
    const root = await render({ kind: null });

    expect(byTestId(root, 'project-cover-kind')).toBeNull();
    expect(root.querySelectorAll('app-project-kind-stamp')).toHaveLength(0);
  });
});
