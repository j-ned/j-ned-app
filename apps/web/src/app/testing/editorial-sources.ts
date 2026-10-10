import { OFFERS } from '@features/offer/domain/offer-catalog.static-data';
import { OFFER_PAGES } from '@features/offer/domain/offer-pages.static-data';
import { HOME_HERO_CTA_LABELS, HOME_WORK_FRAME } from '@features/home/domain/home-hero.static-data';
import {
  HOME_OFFERS_CATALOGUE_LINK,
  HOME_OFFERS_HEADING,
} from '@features/home/domain/home-offers.static-data';
import { HOME_FAQ, HOME_METHOD, HOME_WHY } from '@features/home/domain/home-pitch.static-data';
import { HOME_RECRUITER_BAND_COPY } from '@features/home/domain/home-recruiter-band.static-data';
import { HOME_REVIEWS, HOME_REVIEWS_COPY } from '@features/home/domain/home-reviews.static-data';
import { STATIC_HERO } from '@features/home/infra/data/home.static-data';
import {
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_MOTIVATION,
  STATIC_PROFILE_BASE,
  STATIC_SOCIAL_BUTTONS,
  STATIC_TECHNOLOGIES,
  STATIC_WHAT_I_DO,
} from '@features/profile/infra/data/profile.static-data';
import { PROJECT_FOLLOW_UP_COPY } from '@features/projects/application/project-follow-up-copy';
import {
  PROJECT_OUTCOMES,
  PROJECT_USAGE_LABELS,
} from '@features/projects/domain/project-outcomes.static-data';
import {
  STATIC_CONTACT_INFO,
  STATIC_SOCIAL_LINKS,
} from '@shared/identity/contact-info.static-data';
import { CONTACT_TIMELINES } from '@features/contact/domain/contact-timelines.static-data';
import { SITE_IDENTITY } from '@shared/identity/site-identity.static-data';
import { FOOTER_COPY } from '../layout/components/footer/footer.static-data';
import { NAV_LINKS } from '../layout/components/header/nav-items';
import { LEGAL_LAST_UPDATE } from '../pages/legal-notice';
import { routes } from '../app.routes';

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
  ['OFFERS', OFFERS],
  ['OFFER_PAGES', OFFER_PAGES],
  ['STATIC_HERO', STATIC_HERO],
  ['HOME_HERO_CTA_LABELS', HOME_HERO_CTA_LABELS],
  ['HOME_WORK_FRAME', HOME_WORK_FRAME],
  ['HOME_OFFERS_HEADING', HOME_OFFERS_HEADING],
  ['HOME_OFFERS_CATALOGUE_LINK', HOME_OFFERS_CATALOGUE_LINK],
  ['HOME_METHOD', HOME_METHOD],
  ['HOME_WHY', HOME_WHY],
  ['HOME_FAQ', HOME_FAQ],
  ['HOME_RECRUITER_BAND_COPY', HOME_RECRUITER_BAND_COPY],
  ['HOME_REVIEWS', HOME_REVIEWS],
  ['HOME_REVIEWS_COPY', HOME_REVIEWS_COPY],
  ['STATIC_PROFILE_BASE', STATIC_PROFILE_BASE],
  ['STATIC_BIOGRAPHY', STATIC_BIOGRAPHY],
  ['STATIC_DIPLOMAS', STATIC_DIPLOMAS],
  ['STATIC_TECHNOLOGIES', STATIC_TECHNOLOGIES],
  ['STATIC_ABOUT_HIGHLIGHTS', STATIC_ABOUT_HIGHLIGHTS],
  ['STATIC_WHAT_I_DO', STATIC_WHAT_I_DO],
  ['STATIC_MOTIVATION', STATIC_MOTIVATION],
  ['STATIC_SOCIAL_BUTTONS', STATIC_SOCIAL_BUTTONS],
  ['STATIC_CONTACT_INFO', STATIC_CONTACT_INFO],
  ['STATIC_SOCIAL_LINKS', STATIC_SOCIAL_LINKS],
  ['CONTACT_TIMELINES', CONTACT_TIMELINES],
  ['PROJECT_OUTCOMES', PROJECT_OUTCOMES],
  ['PROJECT_USAGE_LABELS', PROJECT_USAGE_LABELS],
  ['PROJECT_FOLLOW_UP_COPY', PROJECT_FOLLOW_UP_COPY],
  ['SITE_IDENTITY', SITE_IDENTITY],
  ['NAV_LINKS', NAV_LINKS],
  ['FOOTER_COPY', FOOTER_COPY],
  ['LEGAL_LAST_UPDATE', LEGAL_LAST_UPDATE],
  ['routes', ROUTE_TEXTS],
];
