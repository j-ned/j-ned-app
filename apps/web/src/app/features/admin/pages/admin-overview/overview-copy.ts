import type { MetricEntry, StatsOverview } from '@features/analytics/domain/models/analytics.types';
import type { BlogPost } from '@features/blog/domain/models/blog-post.model';
import type { Project } from '@features/projects/domain/models/project.model';
import { counted } from '@shared/format/counted';
import { groupedNumber } from '@shared/format/grouped-number';
import { pluralize } from '@shared/format/pluralize';
import { capitalize } from '../../application/capitalize';

export type OverviewSummaryInput = {
  readonly overview: StatsOverview | null;
  readonly referrers: readonly MetricEntry[] | null;
  readonly unread: number | null;
  readonly projects: readonly Project[] | null;
  readonly posts: readonly BlogPost[] | null;
};

type Noun = { readonly one: string; readonly singular: string; readonly plural: string };

const PROJECT: Noun = { one: 'une', singular: 'réalisation', plural: 'réalisations' };
const ARTICLE: Noun = { one: 'un', singular: 'article', plural: 'articles' };

const NUMBER_WORDS = ['deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];

function inWords(count: number, noun: Noun): string {
  if (count === 1) return `${noun.one} ${noun.singular}`;
  return `${NUMBER_WORDS[count - 2] ?? groupedNumber(count)} ${noun.plural}`;
}

const isOnline = (count: number): string => pluralize(count, 'est en ligne', 'sont en ligne');

function audienceSentence(
  overview: StatsOverview,
  referrers: readonly MetricEntry[] | null,
): string {
  if (overview.sessions === 0) return 'Aucune visite en 30 jours.';
  const visits = `${counted(overview.sessions, 'visite', 'visites')} en 30 jours`;
  const source = referrers?.find((referrer) => referrer.name !== '');
  if (!source) return `${visits}.`;
  return `${visits}, dont ${counted(source.count, 'venue', 'venues')} de ${source.name}.`;
}

function contactsSentence(unread: number | null, overview: StatsOverview | null): string {
  const parts = [
    ...(unread === null
      ? []
      : [
          unread === 0
            ? 'aucun message en attente'
            : `${counted(unread, 'message', 'messages')} en attente`,
        ]),
    ...(overview === null
      ? []
      : [
          overview.cvDownloads === 0
            ? 'aucun CV téléchargé'
            : `${groupedNumber(overview.cvDownloads)} CV ${pluralize(overview.cvDownloads, 'téléchargé', 'téléchargés')}`,
        ]),
  ];
  return parts.length === 0 ? '' : `${capitalize(parts.join(', '))}.`;
}

function oneSourceSentence(count: number, noun: Noun, none: string): string {
  return count === 0 ? none : `${capitalize(inWords(count, noun))} ${isOnline(count)}.`;
}

function contentSentence(projects: number | null, articles: number | null): string {
  if (projects === null && articles === null) return '';
  if (projects === null) {
    return oneSourceSentence(articles ?? 0, ARTICLE, "Aucun article n'est en ligne.");
  }
  if (articles === null) {
    return oneSourceSentence(projects, PROJECT, "Aucune réalisation n'est en ligne.");
  }
  if (projects === 0 && articles === 0) return "Rien n'est en ligne.";
  if (articles === 0) {
    return `${capitalize(inWords(projects, PROJECT))} ${isOnline(projects)}, aucun article.`;
  }
  if (projects === 0) {
    return `${capitalize(inWords(articles, ARTICLE))} ${isOnline(articles)}, aucune réalisation.`;
  }
  return `${capitalize(inWords(projects, PROJECT))} et ${inWords(articles, ARTICLE)} sont en ligne.`;
}

export function overviewSummary(input: OverviewSummaryInput): string {
  const published = input.posts?.filter((post) => post.status === 'published').length ?? null;
  return [
    input.overview === null ? '' : audienceSentence(input.overview, input.referrers),
    contactsSentence(input.unread, input.overview),
    contentSentence(input.projects?.length ?? null, published),
  ]
    .filter((sentence) => sentence !== '')
    .join(' ');
}
