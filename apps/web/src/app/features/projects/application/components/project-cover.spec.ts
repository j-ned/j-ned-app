import { TestBed } from '@angular/core/testing';
import { provideStorageImages } from '@shared/images/storage-image-loader';
import type { ProjectKind } from '../../domain/models/project.model';
import { ProjectCover } from './project-cover';

type CoverInputs = {
  readonly image?: string;
  readonly alt?: string;
  readonly kind?: ProjectKind | null;
  readonly priority?: boolean;
  readonly sizes?: string;
};

const COVER_URL = 'https://api.test/projects/dashflow.avif';

describe('ProjectCover', () => {
  afterEach(() => TestBed.resetTestingModule());

  const render = async ({
    image = COVER_URL,
    alt = 'Aperçu du projet DashFlow',
    kind = 'production',
    priority,
    sizes,
  }: CoverInputs = {}): Promise<HTMLElement> => {
    TestBed.configureTestingModule({ providers: [provideStorageImages()] });
    const fixture = TestBed.createComponent(ProjectCover);
    fixture.componentRef.setInput('image', image);
    fixture.componentRef.setInput('alt', alt);
    fixture.componentRef.setInput('kind', kind);
    if (priority !== undefined) fixture.componentRef.setInput('priority', priority);
    if (sizes !== undefined) fixture.componentRef.setInput('sizes', sizes);
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

  it('Given a stored cover and its layout width When the cover renders Then the browser can pick a narrower API variant', async () => {
    const stored = '/api/storage/portfolio-storage/projects/dashflow-a1b2c3d4.avif';
    const image = byTestId(
      await render({ image: stored, sizes: '(min-width: 48rem) 50vw, 100vw', priority: true }),
      'project-cover-image',
    );

    expect({
      src: image?.getAttribute('src'),
      srcset: image?.getAttribute('srcset'),
      sizes: image?.getAttribute('sizes'),
    }).toEqual({
      src: stored,
      srcset: `${stored}?variant=w480 480w, ${stored}?variant=w800 800w, ${stored}?variant=w1200 1200w, ${stored} 1600w`,
      sizes: '(min-width: 48rem) 50vw, 100vw',
    });
  });

  it('Given no layout width When the cover renders Then it is sized as full viewport width', async () => {
    const image = byTestId(await render({ priority: true }), 'project-cover-image');

    expect(image?.getAttribute('sizes')).toBe('100vw');
  });

  it('Given no nature When the cover renders Then no stamp is shown', async () => {
    const root = await render({ kind: null });

    expect(byTestId(root, 'project-cover-kind')).toBeNull();
    expect(root.querySelectorAll('app-project-kind-stamp')).toHaveLength(0);
  });
});
