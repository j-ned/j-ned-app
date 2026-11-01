export type WorkshopToolId = 'insert-guide' | 'insert-decoder';

export type WorkshopTool = {
  readonly id: WorkshopToolId;
  readonly overline: string;
  readonly title: string;
  readonly summary: string;
  readonly path: `/atelier/${string}`;
};

export type WorkshopSpace = {
  readonly heading: string;
  readonly intro: readonly [string, ...string[]];
  readonly toolsHeading: string;
  readonly tools: readonly WorkshopTool[];
};
