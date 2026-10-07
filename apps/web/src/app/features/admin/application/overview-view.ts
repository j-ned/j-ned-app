import type {
  DailyChartPoint,
  StatsOverview,
} from '@features/analytics/domain/models/analytics.types';
import {
  formatDuration,
  formatPercent,
  pagesPerSessionLabel,
} from '@features/analytics/domain/analytics-presenter';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import { readingTimeMinutes } from '@features/blog/domain/reading-time';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import {
  PROJECT_KIND_FILTER_LABELS,
  PROJECT_KIND_LABELS,
} from '@features/projects/application/project-kind-copy';
import { PROJECT_KINDS, type Project } from '@features/projects/domain/models/project.model';
import type { CartoucheRow } from '@shared/ui/cartouche';
import type { ReadoutItem } from './components/admin-readout';
import { pluralize } from './pluralize';
import { withFirstOfMonth } from './with-first-of-month';

export type ContentRow = {
  readonly key: string;
  readonly kind: 'post' | 'project';
  readonly title: string;
  readonly href: string;
  readonly image: string;
  readonly meta: string;
  readonly stamp: string | null;
};

const UNAVAILABLE = 'indisponible';
const NBSP = '\u00a0';
const NNBSP = '\u202f';

const GROUPED = new Intl.NumberFormat('fr-FR');
const SHORT_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const LONG_DAY = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  timeZone: 'UTC',
});
const LONG_DATE = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const counted = (count: number, singular: string, plural: string): string =>
  `${groupedNumber(count)} ${pluralize(count, singular, plural)}`;

// Le séparateur de milliers d'Intl varie selon l'ICU : l'espace fine insécable est posée ici.
export function groupedNumber(value: number): string {
  return GROUPED.format(value).replace(/\s/g, NNBSP);
}

export function toOnlineRows(
  projects: readonly Project[] | null,
  posts: readonly BlogPost[] | null,
): readonly CartoucheRow[] {
  const byKind = PROJECT_KINDS.map((kind) => ({
    label: PROJECT_KIND_FILTER_LABELS[kind],
    value: projects
      ? counted(projects.filter((project) => project.kind === kind).length, 'projet', 'projets')
      : UNAVAILABLE,
  }));
  const published = posts?.filter((post) => post.status === 'published').length;
  return [
    ...byKind,
    {
      label: 'Articles',
      value: published === undefined ? UNAVAILABLE : counted(published, 'publié', 'publiés'),
    },
  ];
}

const withoutSuffix = (text: string, suffix: string): string =>
  text.endsWith(suffix) ? text.slice(0, -suffix.length) : text;

export function toAudienceReadout(overview: StatsOverview): readonly ReadoutItem[] {
  return [
    {
      label: 'Pages vues',
      value: groupedNumber(overview.pageviews),
      unit: '',
      detail: pagesPerSessionLabel(overview),
    },
    {
      label: 'Rebond',
      value: withoutSuffix(formatPercent(overview.bounceRate), `${NBSP}%`),
      unit: `${NBSP}%`,
      detail: `${counted(overview.bounces, 'session', 'sessions')} sur ${groupedNumber(overview.sessions)}`,
    },
    {
      label: 'Durée moyenne',
      value: withoutSuffix(formatDuration(overview.avgDuration), `${NBSP}s`),
      unit: `${NBSP}s`,
      detail: 'par page',
    },
  ];
}

const calendarDay = (date: string, withYear: boolean): string =>
  withFirstOfMonth(withYear ? LONG_DATE : LONG_DAY, new Date(date));

function listDays(days: readonly string[]): string {
  const named = days.map((day) => `le ${day}`);
  const last = named.at(-1) ?? '';
  return named.length < 2 ? last : `${named.slice(0, -1).join(', ')} et ${last}`;
}

export function chartSummary(points: readonly DailyChartPoint[]): string {
  const first = points.at(0);
  const last = points.at(-1);
  if (!first || !last) return 'Aucune visite sur la période.';
  if (points.length === 1) {
    return `Visiteurs le ${calendarDay(first.date, true)}${NBSP}: ${groupedNumber(first.visitors)}.`;
  }
  const acrossYears = first.date.slice(0, 4) !== last.date.slice(0, 4);
  const period = `du ${calendarDay(first.date, acrossYears)} au ${calendarDay(last.date, true)}`;
  const max = Math.max(...points.map((point) => point.visitors));
  const peaks =
    max === 0
      ? 'aucune visite'
      : `maximum ${groupedNumber(max)} ${listDays(
          points
            .filter((point) => point.visitors === max)
            .map((point) => calendarDay(point.date, acrossYears)),
        )}`;
  return `Visiteurs par jour ${period}${NBSP}: ${peaks}.`;
}

const postDate = (post: BlogPost): string => post.publishedAt ?? post.updatedAt;

function toPostRow(post: BlogPost): ContentRow {
  const date = withFirstOfMonth(SHORT_DATE, new Date(postDate(post)));
  return {
    key: `post:${post.id}`,
    kind: 'post',
    title: post.title,
    href: '/admin/blog',
    image: post.coverImage,
    meta: `Article · ${date} · ${readingTimeMinutes(post.contentMarkdown)}${NBSP}min`,
    stamp: 'Publié',
  };
}

function toProjectRow(project: Project): ContentRow {
  return {
    key: `project:${project.id}`,
    kind: 'project',
    title: project.title,
    href: '/admin/projects',
    image: project.image,
    meta: ['Projet', project.category, ...(project.featured ? ['mis en avant'] : [])].join(' · '),
    stamp: project.kind ? PROJECT_KIND_LABELS[project.kind] : null,
  };
}

export function toContentRows(
  projects: readonly Project[] | null,
  posts: readonly BlogPost[] | null,
  limit: number,
): readonly ContentRow[] {
  const articles = (posts ?? [])
    .filter((post) => post.status === 'published')
    .sort((a, b) => postDate(b).localeCompare(postDate(a)))
    .map(toPostRow);
  const catalogue = [...(projects ?? [])].sort((a, b) => a.order - b.order).map(toProjectRow);
  return [...articles, ...catalogue].slice(0, limit);
}

export function latestMessages(
  messages: readonly ContactMessage[],
  limit: number,
): readonly ContactMessage[] {
  return [...messages]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}
