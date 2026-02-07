export type Article = {
  readonly id: number;
  readonly title: string;
  readonly author: string;
  readonly date: string;
  readonly excerpt: string;
  readonly content: string;
  readonly tags: readonly string[];
  readonly image: string;
};
