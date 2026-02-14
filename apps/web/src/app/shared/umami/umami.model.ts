export type UmamiStats = {
  readonly pageviews: { value: number; prev: number };
  readonly visitors: { value: number; prev: number };
  readonly visits: { value: number; prev: number };
  readonly bounces: { value: number; prev: number };
  readonly totaltime: { value: number; prev: number };
};

export type UmamiPageviews = {
  readonly pageviews: readonly { x: string; y: number }[];
  readonly sessions: readonly { x: string; y: number }[];
};

export type UmamiMetric = {
  readonly x: string;
  readonly y: number;
};

export type UmamiActive = {
  readonly visitors: number;
};
