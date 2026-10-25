import { FURTHER_READING_COPY } from '@features/blog/application/further-reading-copy';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '@features/home/domain/home-hero.static-data';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import { ABOUT_IDENTITY } from '@features/profile/pages/about/about-identity';
import { MATERIALS } from '@features/workshop/domain/materials.static-data';
import { OPERATION_FAMILIES } from '@features/workshop/domain/operations.static-data';
import { RECOMMENDATIONS } from '@features/workshop/domain/recommendations.static-data';
import { PROJECT_ARTICLES_COPY } from '@features/projects/application/project-articles-copy';
import {
  PROJECT_OUTCOMES,
  PROJECT_USAGE_LABELS,
} from '@features/projects/domain/project-outcomes.static-data';
import {
  STATIC_CONTACT_INFO,
  STATIC_SOCIAL_LINKS,
} from '@shared/identity/contact-info.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { FOOTER_COPY } from '../layout/components/footer/footer.static-data';
import { NAV_LINKS } from '../layout/components/header/nav-items';
import { LEGAL_LAST_UPDATE } from '../pages/legal-notice';
import { routes } from '../app.routes';
import PROFILE_FIXTURE from '../../../ci/api-stub/fixtures/profile.json';

export type EditorialText = { readonly path: string; readonly text: string };

export const editorialTexts = (value: unknown, path: string): readonly EditorialText[] => {
  if (typeof value === 'string') {
    return [{ path, text: value }];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item, index) => editorialTexts(item, `${path}[${index}]`));
  }
  if (value !== null && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, item]) => editorialTexts(item, `${path}.${key}`));
  }
  return [];
};

export const ROUTE_TEXTS = Object.fromEntries(
  routes.map(({ path, title, data }) => [`/${path ?? ''}`, { title, seo: data?.['seo'] }]),
);

export const EDITORIAL_SOURCES: readonly (readonly [string, unknown])[] = [
  ['STATIC_HERO', STATIC_HERO],
  ['HOME_HERO_CTA_LABELS', HOME_HERO_CTA_LABELS],
  ['HOME_WORK_FRAME', HOME_WORK_FRAME],
  ['ABOUT_IDENTITY', ABOUT_IDENTITY],
  ['ci/api-stub/fixtures/profile.json', PROFILE_FIXTURE],
  ['STATIC_CONTACT_INFO', STATIC_CONTACT_INFO],
  ['STATIC_SOCIAL_LINKS', STATIC_SOCIAL_LINKS],
  ['PROJECT_OUTCOMES', PROJECT_OUTCOMES],
  ['PROJECT_USAGE_LABELS', PROJECT_USAGE_LABELS],
  ['FURTHER_READING_COPY', FURTHER_READING_COPY],
  ['PROJECT_ARTICLES_COPY', PROJECT_ARTICLES_COPY],
  ['SITE_IDENTITY', SITE_IDENTITY],
  ['NAV_LINKS', NAV_LINKS],
  ['FOOTER_COPY', FOOTER_COPY],
  ['LEGAL_LAST_UPDATE', LEGAL_LAST_UPDATE],
  ['MATERIALS', MATERIALS],
  ['OPERATION_FAMILIES', OPERATION_FAMILIES],
  ['RECOMMENDATIONS', RECOMMENDATIONS],
  ['routes', ROUTE_TEXTS],
];
