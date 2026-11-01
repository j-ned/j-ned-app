import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { settle } from '@shared/testing/settle';
import { OverviewContacts } from './overview-contacts';

type Contacts = {
  readonly unread: number | null;
  readonly cvDownloads: number | null;
  readonly latest: readonly ContactMessage[] | null;
  readonly unreadLoading?: boolean;
  readonly cvLoading?: boolean;
};

async function renderContacts(contacts: Contacts): Promise<HTMLElement> {
  TestBed.configureTestingModule({ providers: [provideRouter([])] });
  const fixture = TestBed.createComponent(OverviewContacts);
  fixture.componentRef.setInput('unread', contacts.unread);
  fixture.componentRef.setInput('cvDownloads', contacts.cvDownloads);
  fixture.componentRef.setInput('latest', contacts.latest);
  fixture.componentRef.setInput('unreadLoading', contacts.unreadLoading ?? false);
  fixture.componentRef.setInput('cvLoading', contacts.cvLoading ?? false);
  await settle(fixture);
  return fixture.nativeElement as HTMLElement;
}

const compact = (host: HTMLElement, testId: string): string =>
  testIdText(host, testId).replace(/[ \t\n\r]/g, '');

const hrefOf = (host: HTMLElement, testId: string): string | null =>
  byTestId(host, testId)?.getAttribute('href') ?? null;

describe('OverviewContacts: chiffres', () => {
  it('Given 3 unread messages and 2 CV downloads When rendered Then each figure links to its page', async () => {
    const host = await renderContacts({ unread: 3, cvDownloads: 2, latest: [] });

    expect({
      unread: compact(host, 'overview-unread-count'),
      unreadHref: hrefOf(host, 'overview-unread'),
      cv: compact(host, 'overview-cv-count'),
      cvHref: hrefOf(host, 'overview-cv'),
      unreadInLink: byTestId(host, 'overview-unread')?.contains(
        byTestId(host, 'overview-unread-count'),
      ),
      cvInLink: byTestId(host, 'overview-cv')?.contains(byTestId(host, 'overview-cv-count')),
    }).toEqual({
      unread: '3',
      unreadHref: '/admin/messages',
      cv: '2',
      cvHref: '/admin/cv',
      unreadInLink: true,
      cvInLink: true,
    });
  });

  it.each([
    { label: 'the unread count', unread: null, cvDownloads: 0, expected: ['—indisponible', '0'] },
    { label: 'the CV downloads', unread: 0, cvDownloads: null, expected: ['0', '—indisponible'] },
    {
      label: 'both figures',
      unread: null,
      cvDownloads: null,
      expected: ['—indisponible', '—indisponible'],
    },
  ])(
    'Given $label unavailable When rendered Then it reads as unavailable, never as zero',
    async ({ unread, cvDownloads, expected }) => {
      const host = await renderContacts({ unread, cvDownloads, latest: [] });

      expect([compact(host, 'overview-unread-count'), compact(host, 'overview-cv-count')]).toEqual(
        expected,
      );
    },
  );

  it('Given an unavailable figure When rendered Then the dash is hidden from assistive technologies and the word is read instead', async () => {
    const host = await renderContacts({ unread: null, cvDownloads: 0, latest: [] });
    const count = byTestId(host, 'overview-unread-count');
    const hidden = [...(count?.querySelectorAll('[aria-hidden="true"]') ?? [])].map((node) =>
      node.textContent?.trim(),
    );

    expect(hidden).toEqual(['—']);
  });
});

describe('OverviewContacts: accords', () => {
  const units = (host: HTMLElement): string[] => [
    testIdText(host, 'overview-unread-unit'),
    testIdText(host, 'overview-cv-unit'),
  ];

  it.each([
    { unread: 1, cvDownloads: 1, expected: ['message', 'téléchargement'] },
    { unread: 0, cvDownloads: 0, expected: ['message', 'téléchargement'] },
    { unread: 2, cvDownloads: 12, expected: ['messages', 'téléchargements'] },
    { unread: null, cvDownloads: null, expected: ['messages', 'téléchargements'] },
  ])(
    'Given $unread unread and $cvDownloads downloads When rendered Then each unit agrees with its figure',
    async ({ unread, cvDownloads, expected }) => {
      const host = await renderContacts({ unread, cvDownloads, latest: [] });

      expect(units(host)).toEqual(expected);
    },
  );
});

describe('OverviewContacts: chargement', () => {
  it.each([
    {
      label: 'the unread count',
      unreadLoading: true,
      cvLoading: false,
      loading: ['overview-unread-loading'],
    },
    {
      label: 'the CV downloads',
      unreadLoading: false,
      cvLoading: true,
      loading: ['overview-cv-loading'],
    },
  ])(
    'Given $label still loading When rendered Then its figure is a placeholder, never read as unavailable',
    async ({ unreadLoading, cvLoading, loading }) => {
      const host = await renderContacts({
        unread: unreadLoading ? null : 3,
        cvDownloads: cvLoading ? null : 2,
        latest: [],
        unreadLoading,
        cvLoading,
      });

      expect({
        loading: ['overview-unread-loading', 'overview-cv-loading'].filter(
          (testId) => byTestId(host, testId) !== null,
        ),
        unavailable: ['overview-unread-count', 'overview-cv-count'].filter((testId) =>
          testIdText(host, testId).includes('indisponible'),
        ),
      }).toEqual({ loading, unavailable: [] });
    },
  );
});

describe('OverviewContacts: derniers messages', () => {
  const latest: readonly ContactMessage[] = [
    makeContactMessage({ id: 4, name: 'Bob', subject: 'Mission Angular' }),
    makeContactMessage({ id: 2, name: 'Chloé', subject: 'Devis' }),
  ];

  it('Given two messages When rendered Then each shows its sender and subject and opens the messages page', async () => {
    const host = await renderContacts({ unread: 2, cvDownloads: 0, latest });
    const items = [...host.querySelectorAll('[data-testid="overview-message"]')];

    expect({
      texts: items.map((item) => (item.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim()),
      hrefs: items.map(
        (item) =>
          item.querySelector('[data-testid="overview-message-link"]')?.getAttribute('href') ?? null,
      ),
      emptyState: byTestId(host, 'empty-state'),
    }).toEqual({
      texts: [expect.stringMatching(/Bob.*Mission Angular/), expect.stringMatching(/Chloé.*Devis/)],
      hrefs: ['/admin/messages', '/admin/messages'],
      emptyState: null,
    });
  });

  it('Given no message at all When rendered Then the drawn empty state points to the public site in a new tab', async () => {
    const host = await renderContacts({ unread: 0, cvDownloads: 0, latest: [] });
    const link = byTestId(host, 'overview-contact-page');

    expect({
      stamp: testIdText(host, 'empty-state-stamp'),
      inEmptyState: byTestId(host, 'empty-state')?.contains(link) ?? false,
      text: (byTestId(host, 'empty-state')?.querySelector('p')?.textContent ?? '')
        .replace(/[ \t\n\r]+/g, ' ')
        .trim(),
      label: (link?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').trim(),
      href: link?.getAttribute('href') ?? null,
      target: link?.getAttribute('target') ?? null,
      rel: link?.getAttribute('rel') ?? null,
      newTab: [...(link?.querySelectorAll('.sr-only') ?? [])].map((node) =>
        node.textContent?.trim(),
      ),
      messages: host.querySelectorAll('[data-testid="overview-message"]').length,
    }).toEqual({
      stamp: 'Boîte vide',
      inEmptyState: true,
      text: "Aucun message pour l'instant. Le formulaire de contact de l'accueil est en ligne\u202f; un nouveau message apparaîtra ici avec son sujet.",
      label: 'Voir le site (nouvel onglet)',
      href: '/',
      target: '_blank',
      rel: 'noopener',
      newTab: ['(nouvel onglet)'],
      messages: 0,
    });
  });

  it('Given the messages unavailable When rendered Then neither the list nor the empty state is shown', async () => {
    const host = await renderContacts({ unread: 0, cvDownloads: 0, latest: null });

    expect({
      emptyState: byTestId(host, 'empty-state'),
      messages: host.querySelectorAll('[data-testid="overview-message"]').length,
    }).toEqual({ emptyState: null, messages: 0 });
  });
});
