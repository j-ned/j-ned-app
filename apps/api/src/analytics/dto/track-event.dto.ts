import { z } from 'zod';
import { V2_EVENT_TYPES } from '../engagement';

export const ANALYTICS_TYPES = [
  'page_view',
  'page_duration',
  'project_click',
  'article_view',
  'article_read',
  'cv_download',
  'cta_click',
  'contact_submit',
  'outbound_click',
  'section_view',
] as const;
export type AnalyticsType = (typeof ANALYTICS_TYPES)[number];

/** Canal d'un lien sortant : jamais l'adresse elle-même (RGPD, spec 020). */
export const OUTBOUND_CHANNELS = [
  'email',
  'discord',
  'linkedin',
  'github',
  'demo',
] as const;
export type OutboundChannel = (typeof OUTBOUND_CHANNELS)[number];

/**
 * Canaux retirés du site avec l'activité freelance (spec 029 du front) : refusés à l'entrée, encore
 * présents dans l'historique brut et recomptés par le rattrapage des agrégats.
 */
export const RETIRED_OUTBOUND_CHANNELS = ['phone', 'malt'] as const;

const SECTION_IDS = ['home_contact'] as const;

/**
 * Emplacement d'un formulaire de contact. Les pages d'offre (`offer_*`) ont disparu avec la spec 029
 * du front : leurs envois passés restent en base, un nouvel envoi est refusé.
 */
const CONTACT_PLACEMENTS = ['home'] as const;

const ENTITY_ID_RULES: Partial<Record<AnalyticsType, (id: string) => boolean>> =
  {
    contact_submit: (id) =>
      (CONTACT_PLACEMENTS as readonly string[]).includes(id),
    outbound_click: (id) =>
      (OUTBOUND_CHANNELS as readonly string[]).includes(id),
    section_view: (id) => (SECTION_IDS as readonly string[]).includes(id),
  };

const entityIdRule = (type: unknown) =>
  typeof type === 'string' && Object.hasOwn(ENTITY_ID_RULES, type)
    ? ENTITY_ID_RULES[type as AnalyticsType]
    : undefined;

/** Chemin d'une page du site, court, sans requête ni ancre ni texte libre. */
const TRACKED_PATH = /^\/[A-Za-z0-9\-._~/%]{0,199}$/;

const isV2Event = (type: unknown): boolean =>
  (V2_EVENT_TYPES as readonly unknown[]).includes(type);

/** Ne garde que le chemin : une requête (`?email=…`) ou une ancre n'entre jamais en base. */
function keepPathOnlyForV2(input: unknown): unknown {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return input;
  }
  const event = input as Record<string, unknown>;
  return isV2Event(event.type) && typeof event.entityTitle === 'string'
    ? { ...event, entityTitle: event.entityTitle.split(/[?#]/, 1)[0] }
    : input;
}

const eventSchema = z
  .strictObject({
    type: z.enum(ANALYTICS_TYPES),
    url: z.string().max(2048).optional(),
    referrer: z.string().max(2048).optional(),
    duration: z.int().min(0).max(86400).optional(),
    entityId: z.string().max(255).optional(),
    entityTitle: z.string().max(500).optional(),
    metadata: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((event, ctx) => {
    const required = (path: 'url' | 'duration') =>
      ctx.addIssue({
        code: 'custom',
        path: [path],
        message: `${path} is required for type ${event.type}`,
      });
    if (
      (event.type === 'page_view' || event.type === 'page_duration') &&
      event.url === undefined
    ) {
      required('url');
    }
    if (event.type === 'page_duration' && event.duration === undefined) {
      required('duration');
    }
    const rule = entityIdRule(event.type);
    if (rule && !(event.entityId !== undefined && rule(event.entityId))) {
      ctx.addIssue({
        code: 'custom',
        path: ['entityId'],
        message: `entityId is not valid for type ${event.type}`,
      });
    }
    if (!isV2Event(event.type)) return;
    if (
      event.entityTitle !== undefined &&
      !TRACKED_PATH.test(event.entityTitle)
    ) {
      ctx.addIssue({
        code: 'custom',
        path: ['entityTitle'],
        message: 'entityTitle must be a site path for this event type',
      });
    }
    if (event.metadata !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['metadata'],
        message: 'metadata is not accepted for this event type',
      });
    }
  });

/**
 * Page vue ou événement du site. `url` est exigée pour `page_view`/`page_duration`, `duration` pour
 * `page_duration` ; les événements v2 ont un `entityId` imposé par type, un `entityTitle` réduit à
 * un chemin du site et jamais de `metadata` (RGPD).
 */
export const trackEventSchema = z.preprocess(keepPathOnlyForV2, eventSchema);
export type TrackEventDto = z.infer<typeof trackEventSchema>;
