import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import type { ContactMessage } from '@features/contact/domain/models/contact-message.model';
import type { CvInfo } from '@features/cv/domain/models/cv.model';
import type { Project } from '@features/projects/domain/models/project.model';
import {
  dateRangeToParams,
  type DateRangeKey,
} from '@features/analytics/domain/analytics-presenter';
import { capitalize } from './capitalize';
import { pluralize } from './pluralize';
import { withFirstOfMonth } from './with-first-of-month';

const DAY_MS = 24 * 60 * 60 * 1000;

// Les bornes envoyées à l'API sont des dates calendaires UTC (`YYYY-MM-DD`) : lues et écrites en UTC.
const PERIOD_DAY_MONTH = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
});
const PERIOD_DAY_MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
});
const DAY_MONTH_YEAR = new Intl.DateTimeFormat('fr-FR', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});
const FULL_DATE = new Intl.DateTimeFormat('fr-FR', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const ONE_DECIMAL = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 1,
  useGrouping: false,
});

const KIB = 1024;
const MIB = KIB * KIB;

const counted = (count: number, singular: string, plural: string): string =>
  `${count} ${pluralize(count, singular, plural)}`;

function fileSize(bytes: number): string {
  if (bytes < KIB) return `${bytes} o`;
  if (bytes < MIB) return `${Math.round(bytes / KIB)} Ko`;
  return `${ONE_DECIMAL.format(bytes / MIB)} Mo`;
}

export function projectsOverline(projects: readonly Project[]): string {
  const featured = projects.filter((project) => project.featured).length;
  return `${counted(projects.length, 'réalisation', 'réalisations')} · ${counted(featured, 'mise en avant', 'mises en avant')}`;
}

export function postsOverline(posts: readonly BlogPost[]): string {
  const published = posts.filter((post) => post.status === 'published').length;
  return [
    counted(posts.length, 'article', 'articles'),
    counted(published, 'publié', 'publiés'),
    counted(posts.length - published, 'brouillon', 'brouillons'),
  ].join(' · ');
}

export function messagesOverline(messages: readonly ContactMessage[]): string {
  const unread = messages.filter((message) => !message.read).length;
  return `${counted(unread, 'non lu', 'non lus')} · ${messages.length} au total`;
}

export function cvOverline(cv: CvInfo | null): string {
  if (cv === null) return 'Aucun CV en ligne';
  const format = (cv.mimeType.split('/')[1] ?? cv.mimeType).toUpperCase();
  const uploadedOn = withFirstOfMonth(DAY_MONTH_YEAR, new Date(cv.uploadedAt));
  return `${format} · ${fileSize(cv.fileSize)} · mis en ligne le ${uploadedOn}`;
}

export function audienceOverline(range: DateRangeKey, now: Date): string {
  const { startDate, endDate } = dateRangeToParams(range, now);
  if (startDate === undefined || endDate === undefined) return 'Tout le temps';
  const start = new Date(startDate);
  const end = new Date(endDate);
  const days = Math.round((end.getTime() - start.getTime()) / DAY_MS);
  const startFormat =
    start.getUTCFullYear() === end.getUTCFullYear() ? PERIOD_DAY_MONTH : PERIOD_DAY_MONTH_YEAR;
  const period = `${withFirstOfMonth(startFormat, start)} au ${withFirstOfMonth(PERIOD_DAY_MONTH_YEAR, end)}`;
  return `${period} · ${days} derniers jours`;
}

export function todayOverline(now: Date): string {
  return capitalize(withFirstOfMonth(FULL_DATE, now));
}
