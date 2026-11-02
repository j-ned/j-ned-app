import { z } from 'zod';

export const METRIC_TYPES = [
  'url',
  'referrer',
  'browser',
  'country',
  'os',
] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

/** Période (jours `AAAA-MM-JJ`) et limite des statistiques, lues dans la query string. */
export const dateRangeQuerySchema = z.strictObject({
  startDate: z.iso.date().optional(),
  endDate: z.iso.date().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type DateRangeQueryDto = z.infer<typeof dateRangeQuerySchema>;

export const metricsQuerySchema = dateRangeQuerySchema.extend({
  type: z.enum(METRIC_TYPES),
});
export type MetricsQueryDto = z.infer<typeof metricsQuerySchema>;

/** Événements dont l'admin lit le détail par `entityId` (emplacement de formulaire, canal). */
export const EVENT_COUNT_TYPES = ['contact_submit', 'outbound_click'] as const;
export type EventCountType = (typeof EVENT_COUNT_TYPES)[number];

export const eventsQuerySchema = dateRangeQuerySchema.extend({
  type: z.enum(EVENT_COUNT_TYPES),
});
export type EventsQueryDto = z.infer<typeof eventsQuerySchema>;
