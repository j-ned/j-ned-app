export type Project = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly image: string;
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  readonly repoUrlFront?: string;
  readonly repoUrlBack?: string;
  readonly featured: boolean;
  readonly order: number;
};
