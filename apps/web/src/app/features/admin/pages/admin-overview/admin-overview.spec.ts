import { Component, CUSTOM_ELEMENTS_SCHEMA, signal, type WritableSignal } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError, type Observable } from 'rxjs';
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

describe('AdminOverview: cartouche « En ligne »', () => {
  it.each([
    {
      label: 'the projects',
      sources: { projects: down<readonly Project[]> },
      expected: ['indisponible', 'indisponible', 'indisponible', '2 publiés'],
    },
  ])(
    'Given $label failing When the page renders Then the cartouche says so instead of counting zero',
    async ({ sources, expected }) => {
      const { host, crash } = await renderOverview(sources);

      expect({ crash, values: onlineValues(host) }).toEqual({ crash: null, values: expected });
    },
  );
});

describe('AdminOverview: relevé « Audience »', () => {
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
      visitors: byTestId(host, 'overview-visits'),
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
      visitors: testIdText(overview.host, 'overview-visits'),
    }).toEqual({ requests: 2, errors: 0, visitors: '42' });
  });

  it('Given the chart failing alone When the page renders Then the visitors stay shown next to an explicit error', async () => {
    const { host, crash } = await renderOverview({ chart: down<readonly DailyChartPoint[]> });

    expect({
      crash,
      errors: errorsIn(host, 'overview-audience'),
      visitors: testIdText(host, 'overview-visits'),
    }).toEqual({ crash: null, errors: 1, visitors: '42' });
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
      emptyState: byTestId(section(overview.host, 'overview-contacts'), 'empty-state') !== null,
    }).toEqual({ requests: 2, errors: 0, emptyState: true });
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
      online: onlineValues(host),
      figures: [compact(host, 'overview-unread-count'), compact(host, 'overview-cv-count')],
      visitors: byTestId(host, 'overview-visits'),
      alerts: host.querySelectorAll('[role="alert"]').length > 0,
    }).toEqual({
      crash: null,
      online: ['indisponible', 'indisponible', 'indisponible', 'indisponible'],
      figures: ['—indisponible', '—indisponible'],
      visitors: null,
      alerts: true,
    });
  });
});
