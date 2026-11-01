import {
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export const METRIC_TYPES = [
  'url',
  'referrer',
  'browser',
  'country',
  'os',
] as const;
export type MetricType = (typeof METRIC_TYPES)[number];

export class DateRangeQueryDto {
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}

export class MetricsQueryDto extends DateRangeQueryDto {
  @IsIn([...METRIC_TYPES])
  type!: MetricType;
}

/** Événements dont l'admin lit le détail par `entityId` (emplacement de formulaire, canal). */
export const EVENT_COUNT_TYPES = ['contact_submit', 'outbound_click'] as const;
export type EventCountType = (typeof EVENT_COUNT_TYPES)[number];

export class EventsQueryDto extends DateRangeQueryDto {
  @IsIn([...EVENT_COUNT_TYPES])
  type!: EventCountType;
}
