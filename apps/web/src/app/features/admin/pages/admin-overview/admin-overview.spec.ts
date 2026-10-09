import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { NEVER, of, throwError, type Observable } from 'rxjs';
import type { ChartData } from 'chart.js';
import type { Mock } from 'vitest';
import { ThemeStore } from '@core/theme/theme-store';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import type {
  DailyChartPoint,
  MetricEntry,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import {
  makeChartPoint,
  makeMetricEntry,
  makeStatsOverview,
} from '@features/analytics/testing/analytics-builders';
import { BlogGateway } from '@features/blog/domain/gateways/blog.gateway';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { makeBlogPost } from '@features/blog/testing/blog-post-builders';
import { ContactGateway } from '@features/contact/domain/gateways/contact.gateway';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import { makeContactMessage } from '@features/contact/testing/contact-message-builders';
import { stubContactGateway } from '@features/contact/testing/stub-contact-gateway';
import { ProjectsGateway } from '@features/projects/domain/gateways/projects.gateway';
import type { Project, ProjectKind } from '@features/projects/domain/models/project.model';
import { makeProject } from '@features/projects/testing/project-builders';
import { AppChart } from '@shared/ui/chart';
import { byTestId, testIdText } from '@shared/testing/by-test-id';
import { captureCrash } from '@shared/testing/capture-crash';
import { settleBounded } from '@shared/testing/settle';
import { AdminOverview } from './admin-overview';
import { OverviewAudience } from '../../application/components/overview-audience';

@Component({ template: '' })
class BlankPage {}

const KINDS: readonly ProjectKind[] = [
  'production',
  'production',
  'demo',
  'demo',
  'script',
  'script',
];

const CATALOGUE: readonly Project[] = KINDS.map((kind, index) =>
  makeProject({
    id: `p-${index}`,
    slug: `p-${index}`,
    title: `Projet ${index}`,
    kind,
    order: index,
  }),
);

const POSTS: readonly BlogPost[] = [
  makeBlogPost({ id: 'a-old', title: 'Article ancien', publishedAt: '2026-09-01T12:00:00Z' }),
  makeBlogPost({ id: 'a-new', title: 'Article récent', publishedAt: '2026-09-09T12:00:00Z' }),
];

const CHART: readonly DailyChartPoint[] = [
  makeChartPoint({ date: '2026-09-07', visitors: 6, pageviews: 9 }),
  makeChartPoint({ date: '2026-09-08', visitors: 2, pageviews: 3 }),
];

const REFERRERS: readonly MetricEntry[] = [
  makeMetricEntry({ name: '', count: 20 }),
  makeMetricEntry({ name: 'google.com', count: 18 }),
];

type Sources = {
  readonly projects?: () => Observable<readonly Project[]>;
  readonly posts?: () => Observable<readonly BlogPost[]>;
  readonly unread?: () => Observable<number>;
  readonly messages?: () => Observable<readonly ContactMessage[]>;
  readonly overview?: () => Observable<StatsOverview>;
  readonly chart?: () => Observable<readonly DailyChartPoint[]>;
  readonly referrers?: () => Observable<readonly MetricEntry[]>;
};

type Doubles = {
  readonly getAllProjects: Mock<() => Observable<readonly Project[]>>;
  readonly getAllMessages: Mock<() => Observable<readonly ContactMessage[]>>;
  readonly getOverview: Mock<AnalyticsGateway['getOverview']>;
  readonly getChart: Mock<AnalyticsGateway['getChart']>;
  readonly getMetrics: Mock<AnalyticsGateway['getMetrics']>;
};

type Overview = {
  readonly fixture: ComponentFixture<AdminOverview>;
  readonly host: HTMLElement;
  readonly crash: unknown;
  readonly doubles: Doubles;
  readonly isDark: WritableSignal<boolean>;
};

const down = <T>(): Observable<T> => throwError(() => new Error('down'));
const pending = <T>(): Observable<T> => NEVER;

async function renderOverview(sources: Sources = {}): Promise<Overview> {
  const isDark = signal(false);
  const doubles: Doubles = {
    getAllProjects: vi.fn(
      sources.projects ?? ((): Observable<readonly Project[]> => of(CATALOGUE)),
    ),
    getAllMessages: vi.fn(
      sources.messages ?? ((): Observable<readonly ContactMessage[]> => of([])),
    ),
    getOverview: vi.fn<AnalyticsGateway['getOverview']>(
      () => sources.overview?.() ?? of(makeStatsOverview()),
    ),
    getChart: vi.fn<AnalyticsGateway['getChart']>(
      () => (sources.chart?.() ?? of(CHART)) as Observable<DailyChartPoint[]>,
    ),
    getMetrics: vi.fn<AnalyticsGateway['getMetrics']>(
      (type) =>
        (type === 'referrer' ? (sources.referrers?.() ?? of(REFERRERS)) : of([])) as Observable<
          MetricEntry[]
        >,
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      provideRouter([{ path: '**', component: BlankPage }]),
      { provide: ThemeStore, useValue: { isDark: isDark.asReadonly() } },
      {
        provide: ProjectsGateway,
        useValue: { getAllProjects: doubles.getAllProjects, invalidateAllProjects: vi.fn() },
      },
      {
        provide: BlogGateway,
        useValue: {
          getAllPostsForAdmin: sources.posts ?? ((): Observable<readonly BlogPost[]> => of(POSTS)),
          invalidateAdminPosts: vi.fn(),
        },
      },
      {
        provide: ContactGateway,
        useValue: stubContactGateway({
          getUnreadCount: sources.unread ?? ((): Observable<number> => of(0)),
          getAllMessages: doubles.getAllMessages,
        }),
      },
      {
        provide: AnalyticsGateway,
        useValue: {
          getOverview: doubles.getOverview,
          getChart: doubles.getChart,
          getMetrics: doubles.getMetrics,
          getCvDownloadCount: (): Observable<number> => of(0),
        },
      },
    ],
  });
  TestBed.overrideComponent(OverviewAudience, {
    remove: { imports: [AppChart] },
    add: { schemas: [CUSTOM_ELEMENTS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(AdminOverview);
  const crash = await captureCrash(() => settleBounded(fixture));
  return { fixture, host: fixture.nativeElement as HTMLElement, crash, doubles, isDark };
}

const normalized = (element: Element | null | undefined): string =>
  (element?.textContent ?? '').replace(/[ \t\n\r]+/g, ' ').replace(/^ | $/g, '');

const compact = (root: ParentNode, testId: string): string =>
  testIdText(root, testId).replace(/[ \t\n\r]/g, '');

const section = (host: HTMLElement, testId: string): HTMLElement => {
  const element = byTestId(host, testId);
  expect(element, `section ${testId}`).not.toBeNull();
  return element ?? host;
};

const errorsIn = (host: HTMLElement, testId: string): number =>
  byTestId(host, testId)?.querySelectorAll('[data-testid="load-error"]').length ?? 0;

async function retryIn(overview: Overview, testId: string): Promise<void> {
  section(overview.host, testId)
    .querySelector<HTMLButtonElement>('[data-testid="load-error-retry"]')
    ?.click();
  await settleBounded(overview.fixture);
}

const onlineValues = (host: HTMLElement): string[] =>
  [
    ...(byTestId(host, 'overview-online')?.querySelectorAll('[data-testid="cartouche-value"]') ??
      []),
  ].map((value) => normalized(value));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date('2026-10-07T10:00:00Z'));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AdminOverview: en-tête', () => {
  it.each([
    { now: '2026-10-07T10:00:00Z', overline: 'Mercredi 7 octobre 2026 · 30 derniers jours' },
    { now: '2026-10-08T10:00:00Z', overline: 'Jeudi 8 octobre 2026 · 30 derniers jours' },
  ])(
    "Given the page opened on $now When it renders Then its overline names that day and the period, under the single « Vue d'ensemble » h1",
    async ({ now, overline }) => {
      vi.setSystemTime(new Date(now));
      const { host, crash } = await renderOverview();

      expect({
        crash,
        overline: testIdText(host, 'admin-page-overline'),
        title: testIdText(host, 'admin-page-title'),
        headings: host.querySelectorAll('h1').length,
      }).toEqual({ crash: null, overline, title: "Vue d'ensemble", headings: 1 });
    },
  );
});

describe('AdminOverview: cartouche « En ligne »', () => {
  it('Given the production catalogue When the page renders Then the header cartouche counts what is online by nature', async () => {
    const { host } = await renderOverview();
    const online = section(host, 'overview-online');

    expect({
      inHeader: host.querySelector('header')?.contains(online) ?? false,
      title: testIdText(online, 'cartouche-title'),
      reference: testIdText(online, 'cartouche-reference'),
      rows: [...online.querySelectorAll('[data-testid="cartouche-row"]')].map((row) => ({
        label: testIdText(row, 'cartouche-label'),
        value: testIdText(row, 'cartouche-value'),
      })),
    }).toEqual({
      inHeader: true,
      title: 'En ligne',
      reference: 'nedellec-julien.fr',
      rows: [
        { label: 'En production', value: '2 projets' },
        { label: 'Démos', value: '2 projets' },
        { label: 'Scripts', value: '2 projets' },
        { label: 'Articles', value: '2 publiés' },
      ],
    });
  });

  it.each([
    {
      label: 'the projects',
      sources: { projects: down<readonly Project[]> },
      expected: ['indisponible', 'indisponible', 'indisponible', '2 publiés'],
    },
    {
      label: 'the articles',
      sources: { posts: down<readonly BlogPost[]> },
      expected: ['2 projets', '2 projets', '2 projets', 'indisponible'],
    },
  ])(
    'Given $label failing When the page renders Then the cartouche says so instead of counting zero',
    async ({ sources, expected }) => {
      const { host, crash } = await renderOverview(sources);

      expect({ crash, values: onlineValues(host) }).toEqual({ crash: null, values: expected });
    },
  );

  it('Given the projects still loading When the page renders Then the cartouche is a placeholder, not a count', async () => {
    const { host, crash } = await renderOverview({ projects: pending });

    expect({
      crash,
      loading: byTestId(host, 'overview-online-loading') !== null,
      values: onlineValues(host),
    }).toEqual({ crash: null, loading: true, values: [] });
  });
});

describe('AdminOverview: actions rapides', () => {
  it('Given the page When rendered Then the quick actions are grouped under the « Actions rapides » heading', async () => {
    const { host } = await renderOverview();
    const quick = section(host, 'overview-quick');
    const labelledBy = quick.getAttribute('aria-labelledby') ?? '';

    expect({
      heading: normalized(host.querySelector(`[id="${labelledBy}"]`)),
      actions: ['quick-new-project', 'quick-new-post', 'quick-cv', 'quick-audience'].every(
        (testId) => quick.contains(byTestId(host, testId)),
      ),
    }).toEqual({ heading: 'Actions rapides', actions: true });
  });

  it.each([
    { testId: 'quick-new-project', text: 'Nouveau projet', url: '/admin/projects/new' },
    { testId: 'quick-new-post', text: 'Nouvel article', url: '/admin/blog/new' },
    { testId: 'quick-cv', text: 'Remplacer le CV', url: '/admin/cv' },
    { testId: 'quick-audience', text: "Voir l'audience", url: '/admin/audience' },
  ])(
    'Given the $text quick action When it is followed Then the admin opens $url',
    async ({ testId, text, url }) => {
      const overview = await renderOverview();
      const link = byTestId(overview.host, testId);
      const before = {
        tag: link?.tagName ?? null,
        text: normalized(link),
        href: link?.getAttribute('href') ?? null,
      };

      link?.click();
      await settleBounded(overview.fixture);

      expect({ ...before, url: TestBed.inject(Router).url }).toEqual({
        tag: 'A',
        text,
        href: url,
        url,
      });
    },
  );
});

describe('AdminOverview: relevé « Audience »', () => {
  it('Given the 30-day statistics When the page renders Then the audience section shows the visitors, the readout and the chart caption', async () => {
    const { host, crash } = await renderOverview();
    const audience = section(host, 'overview-audience');

    expect({
      crash,
      visitors: testIdText(audience, 'overview-visitors'),
      sessions: testIdText(audience, 'overview-sessions'),
      readout: [...audience.querySelectorAll('[data-testid="readout-value"]')].map((value) =>
        normalized(value),
      ),
      caption: normalized(audience.querySelector('figure figcaption')),
    }).toEqual({
      crash: null,
      visitors: '42',
      sessions: '42 sessions',
      readout: ['56', '88,1\u00a0%', '22\u00a0s'],
      caption:
        'Visiteurs par jour du 7 septembre au 8 septembre 2026\u00a0: maximum 6 le 7 septembre.',
    });
  });

  it('Given Wednesday 7 October 2026 When the page loads Then the statistics are requested over the last 30 days', async () => {
    const { doubles } = await renderOverview();

    expect({
      overview: doubles.getOverview.mock.calls,
      chart: doubles.getChart.mock.calls,
      referrers: doubles.getMetrics.mock.calls.filter(([type]) => type === 'referrer'),
    }).toEqual({
      overview: [['2026-09-07', '2026-10-07']],
      chart: [['2026-09-07', '2026-10-07']],
      referrers: [['referrer', '2026-09-07', '2026-10-07']],
    });
  });

  it('Given the statistics failing When the page renders Then the audience section shows an error, never a zero visitor count', async () => {
    const { host, crash } = await renderOverview({ overview: down<StatsOverview> });

    expect({
      crash,
      errors: errorsIn(host, 'overview-audience'),
      visitors: byTestId(host, 'overview-visitors'),
      readout: host.querySelectorAll('[data-testid="readout-item"]').length,
    }).toEqual({ crash: null, errors: 1, visitors: null, readout: 0 });
  });

  it('Given the statistics failed once When Réessayer is pressed Then they are requested again and shown', async () => {
    let attempts = 0;
    const overview = await renderOverview({
      overview: () => (++attempts === 1 ? down<StatsOverview>() : of(makeStatsOverview())),
    });

    await retryIn(overview, 'overview-audience');

    expect({
      requests: overview.doubles.getOverview.mock.calls.length,
      errors: errorsIn(overview.host, 'overview-audience'),
      visitors: testIdText(overview.host, 'overview-visitors'),
    }).toEqual({ requests: 2, errors: 0, visitors: '42' });
  });

  it('Given the chart failing alone When the page renders Then the visitors stay shown next to an explicit error', async () => {
    const { host, crash } = await renderOverview({ chart: down<readonly DailyChartPoint[]> });

    expect({
      crash,
      errors: errorsIn(host, 'overview-audience'),
      visitors: testIdText(host, 'overview-visitors'),
    }).toEqual({ crash: null, errors: 1, visitors: '42' });
  });

  it('Given the statistics still loading When the page renders Then the audience section is a placeholder', async () => {
    const { host, crash } = await renderOverview({ overview: pending });

    expect({
      crash,
      loading: byTestId(host, 'overview-audience-loading') !== null,
      visitors: byTestId(host, 'overview-visitors'),
    }).toEqual({ crash: null, loading: true, visitors: null });
  });

  it('Given the statistics still loading When the page renders Then the CV figure of the contacts is a placeholder, not unavailable', async () => {
    const { host, crash } = await renderOverview({ overview: pending });

    expect({
      crash,
      loading: byTestId(host, 'overview-cv-loading') !== null,
      cv: testIdText(host, 'overview-cv-count').includes('indisponible'),
    }).toEqual({ crash: null, loading: true, cv: false });
  });

  it('Given the registers colours When the theme switches Then the curve is redrawn with the new indigo', async () => {
    const root = document.documentElement.style;
    root.setProperty('--theme-primary-text', 'oklch(54% 0.225 277)');
    root.setProperty('--theme-foreground', 'oklch(20% 0.01 286)');
    try {
      const overview = await renderOverview();
      const firstColor = (): unknown =>
        (overview.host.querySelector('app-chart') as (HTMLElement & { data?: ChartData }) | null)
          ?.data?.datasets[0]?.borderColor;
      const light = firstColor();

      root.setProperty('--theme-primary-text', 'oklch(74.5% 0.16 277)');
      overview.isDark.set(true);
      await settleBounded(overview.fixture);

      expect({ light, dark: firstColor() }).toEqual({
        light: 'oklch(54% 0.225 277)',
        dark: 'oklch(74.5% 0.16 277)',
      });
    } finally {
      root.removeProperty('--theme-primary-text');
      root.removeProperty('--theme-foreground');
    }
  });
});

describe('AdminOverview: phrase de synthèse', () => {
  it('Given every source available When the page renders Then the introduction sums up the period', async () => {
    const { host } = await renderOverview();

    expect(testIdText(host, 'overview-summary')).toBe(
      '42 visiteurs en 30 jours, dont 18 venus de google.com. Aucun message en attente, aucun CV téléchargé. Six réalisations et deux articles sont en ligne.',
    );
  });

  it('Given the statistics and the unread count failing When the page renders Then their sentences are left out', async () => {
    const { host, crash } = await renderOverview({
      overview: down<StatsOverview>,
      unread: down<number>,
    });

    expect({ crash, summary: testIdText(host, 'overview-summary') }).toEqual({
      crash: null,
      summary: 'Six réalisations et deux articles sont en ligne.',
    });
  });
});

describe('AdminOverview: contacts', () => {
  it('Given 3 unread messages, 2 CV downloads and four messages When the page renders Then the contacts show the figures and the three latest messages', async () => {
    const { host } = await renderOverview({
      unread: () => of(3),
      overview: () => of(makeStatsOverview({ cvDownloads: 2 })),
      messages: () =>
        of([
          makeContactMessage({ id: 1, name: 'Alice', createdAt: '2026-01-01T10:00:00Z' }),
          makeContactMessage({ id: 2, name: 'Bob', createdAt: '2026-03-01T10:00:00Z' }),
          makeContactMessage({ id: 3, name: 'Chloé', createdAt: '2026-02-01T10:00:00Z' }),
          makeContactMessage({ id: 4, name: 'David', createdAt: '2026-04-01T10:00:00Z' }),
        ]),
    });
    const contacts = section(host, 'overview-contacts');

    expect({
      unread: compact(contacts, 'overview-unread-count'),
      cv: compact(contacts, 'overview-cv-count'),
      senders: [...contacts.querySelectorAll('[data-testid="overview-message"]')].map(
        (item) => normalized(item).split(' ')[0],
      ),
    }).toEqual({ unread: '3', cv: '2', senders: ['David', 'Bob', 'Chloé'] });
  });

  it.each([
    {
      label: 'the unread count',
      sources: { unread: down<number> },
      expected: ['—indisponible', '0'],
    },
    {
      label: 'the statistics',
      sources: { overview: down<StatsOverview> },
      expected: ['0', '—indisponible'],
    },
  ])(
    'Given $label failing When the page renders Then that figure reads as unavailable, never as zero',
    async ({ sources, expected }) => {
      const { host, crash } = await renderOverview(sources);

      expect({
        crash,
        figures: [compact(host, 'overview-unread-count'), compact(host, 'overview-cv-count')],
      }).toEqual({ crash: null, figures: expected });
    },
  );

  it('Given no message at all When the page renders Then the contacts show the drawn empty state', async () => {
    const { host } = await renderOverview();

    expect(testIdText(section(host, 'overview-contacts'), 'empty-state-stamp')).toBe('Boîte vide');
  });

  it('Given the messages failing When the page renders Then an error replaces the list and no empty state claims the box is empty', async () => {
    const { host, crash } = await renderOverview({ messages: down<readonly ContactMessage[]> });
    const contacts = section(host, 'overview-contacts');

    expect({
      crash,
      errors: errorsIn(host, 'overview-contacts'),
      emptyState: byTestId(contacts, 'empty-state'),
    }).toEqual({ crash: null, errors: 1, emptyState: null });
  });

  it('Given the messages failed once When Réessayer is pressed Then they are requested again and the empty state appears', async () => {
    let attempts = 0;
    const overview = await renderOverview({
      messages: () =>
        ++attempts === 1 ? down<readonly ContactMessage[]>() : of<readonly ContactMessage[]>([]),
    });

    await retryIn(overview, 'overview-contacts');

    expect({
      requests: overview.doubles.getAllMessages.mock.calls.length,
      errors: errorsIn(overview.host, 'overview-contacts'),
      stamp: testIdText(section(overview.host, 'overview-contacts'), 'empty-state-stamp'),
    }).toEqual({ requests: 2, errors: 0, stamp: 'Boîte vide' });
  });

  it('Given the messages still loading When the page renders Then the list is a placeholder and no empty state is shown', async () => {
    const { host, crash } = await renderOverview({ messages: pending });

    expect({
      crash,
      loading: byTestId(host, 'overview-contacts-loading') !== null,
      emptyState: byTestId(section(host, 'overview-contacts'), 'empty-state'),
    }).toEqual({ crash: null, loading: true, emptyState: null });
  });
});

describe('AdminOverview: contenu en ligne', () => {
  const titles = (host: HTMLElement): string[] =>
    [
      ...section(host, 'overview-content').querySelectorAll(
        '[data-testid="overview-content-link"]',
      ),
    ].map((link) => normalized(link));

  it('Given two articles and six projects When the page renders Then five items are listed, newest articles first, then projects in public order', async () => {
    const { host } = await renderOverview();

    expect(titles(host)).toEqual([
      'Article récent',
      'Article ancien',
      'Projet 0',
      'Projet 1',
      'Projet 2',
    ]);
  });

  it('Given the projects failing When the page renders Then the content section shows an error with the articles still listed', async () => {
    const { host, crash } = await renderOverview({ projects: down<readonly Project[]> });

    expect({ crash, errors: errorsIn(host, 'overview-content'), titles: titles(host) }).toEqual({
      crash: null,
      errors: 1,
      titles: ['Article récent', 'Article ancien'],
    });
  });

  it('Given the projects failed once When Réessayer is pressed Then the list and the cartouche are both restored', async () => {
    let attempts = 0;
    const overview = await renderOverview({
      projects: () => (++attempts === 1 ? down<readonly Project[]>() : of(CATALOGUE)),
    });

    await retryIn(overview, 'overview-content');

    expect({
      requests: overview.doubles.getAllProjects.mock.calls.length,
      errors: errorsIn(overview.host, 'overview-content'),
      items: titles(overview.host).length,
      online: onlineValues(overview.host),
    }).toEqual({
      requests: 2,
      errors: 0,
      items: 5,
      online: ['2 projets', '2 projets', '2 projets', '2 publiés'],
    });
  });

  it('Given the articles still loading When the page renders Then the content section is a placeholder', async () => {
    const { host, crash } = await renderOverview({ posts: pending });

    expect({
      crash,
      loading: byTestId(host, 'overview-content-loading') !== null,
      items: host.querySelectorAll('[data-testid="overview-content-item"]').length,
    }).toEqual({ crash: null, loading: true, items: 0 });
  });
});

describe('AdminOverview: toutes les sources en panne', () => {
  it('Given every source failing When the page renders Then nothing reads as zero and the page still stands', async () => {
    const { host, crash } = await renderOverview({
      projects: down<readonly Project[]>,
      posts: down<readonly BlogPost[]>,
      unread: down<number>,
      messages: down<readonly ContactMessage[]>,
      overview: down<StatsOverview>,
      chart: down<readonly DailyChartPoint[]>,
      referrers: down<readonly MetricEntry[]>,
    });

    expect({
      crash,
      title: testIdText(host, 'admin-page-title'),
      online: onlineValues(host),
      figures: [compact(host, 'overview-unread-count'), compact(host, 'overview-cv-count')],
      visitors: byTestId(host, 'overview-visitors'),
      summary: testIdText(host, 'overview-summary'),
      alerts: host.querySelectorAll('[role="alert"]').length > 0,
    }).toEqual({
      crash: null,
      title: "Vue d'ensemble",
      online: ['indisponible', 'indisponible', 'indisponible', 'indisponible'],
      figures: ['—indisponible', '—indisponible'],
      visitors: null,
      summary: '',
      alerts: true,
    });
  });
});
