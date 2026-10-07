import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import type { ContentRow } from '../overview-view';
import { OverviewContent } from './overview-content';

const POST: ContentRow = {
  key: 'post:career',
  kind: 'post',
  title: 'De 20 ans de métallurgie à développeur Full-Stack',
  href: '/admin/blog',
  image: 'https://cdn.test/career.avif',
  meta: 'Article · 1er sept. 2026 · 2\u00a0min',
  stamp: 'Publié',
};

const PROJECT: ContentRow = {
  key: 'project:tool',
  kind: 'project',
  title: 'Outil',
  href: '/admin/projects',
  image: '',
  meta: 'Projet · Script',
  stamp: null,
};

async function renderContent(rows: readonly ContentRow[]): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(OverviewContent);
  fixture.componentRef.setInput('rows', rows);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

const itemsOf = (host: HTMLElement): Element[] => [
  ...host.querySelectorAll('[data-testid="overview-content-item"]'),
];

describe('OverviewContent', () => {
  it('Given the section When rendered Then it is named by its « Contenu en ligne » heading', async () => {
    const host = await renderContent([POST]);
    const labelledBy = host.querySelector('section')?.getAttribute('aria-labelledby') ?? '';
    const heading = host.querySelector(`[id="${labelledBy}"]`);

    expect({ tag: heading?.tagName ?? null, name: heading?.textContent?.trim() ?? null }).toEqual({
      tag: 'H2',
      name: 'Contenu en ligne',
    });
  });

  it('Given an article and a project When rendered Then each item shows its title as a link, its meta line and its stamp', async () => {
    const host = await renderContent([POST, PROJECT]);

    expect(
      itemsOf(host).map((item) => ({
        title: testIdText(item, 'overview-content-link'),
        href: byTestId(item, 'overview-content-link')?.getAttribute('href') ?? null,
        meta: testIdText(item, 'overview-content-meta'),
        stamp: byTestId(item, 'overview-content-stamp')?.textContent?.trim() ?? null,
      })),
    ).toEqual([
      {
        title: 'De 20 ans de métallurgie à développeur Full-Stack',
        href: '/admin/blog',
        meta: 'Article · 1er sept. 2026 · 2\u00a0min',
        stamp: 'Publié',
      },
      { title: 'Outil', href: '/admin/projects', meta: 'Projet · Script', stamp: null },
    ]);
  });

  it('Given an item with a cover and one without When rendered Then only the first shows a decorative image', async () => {
    const host = await renderContent([POST, PROJECT]);

    expect(
      itemsOf(host).map((item) =>
        [...item.querySelectorAll('img')].map((img) => img.getAttribute('alt')),
      ),
    ).toEqual([[''], []]);
  });

  it('Given nothing online When rendered Then a drawn empty state replaces the list', async () => {
    const host = await renderContent([]);

    expect({
      stamp: testIdText(host, 'empty-state-stamp'),
      items: itemsOf(host).length,
    }).toEqual({ stamp: 'Rien en ligne', items: 0 });
  });
});
