import type { BlogCategoryFilter } from '../domain/models/blog-tag.model';

const NBSP = '\u00a0';

export const BLOG_CATEGORY_FILTER_LABELS: Record<BlogCategoryFilter, string> = {
  all: 'Tous',
  stack: 'Stack',
  security: 'Sécurité',
  engineering: 'Ingénierie',
  journey: 'Parcours',
  projects: 'Projets',
};

export const SUBJECTS_FACT_LABEL = 'Sujets';

export function articleCountLabel(count: number): string {
  return `${count}${NBSP}article${count > 1 ? 's' : ''}`;
}

export function readingTimeLabel(minutes: number): string {
  return `${minutes}${NBSP}min de lecture`;
}

export function readLinkContext(title: string): string {
  return `${NBSP}: ${title}`;
}

export function visibleArticleCountLabel(count: number): string {
  const plural = count > 1 ? 's' : '';
  return `${count}${NBSP}article${plural} affiché${plural}`;
}
