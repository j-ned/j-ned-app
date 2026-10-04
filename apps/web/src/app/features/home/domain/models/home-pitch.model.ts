export type HomeMethod = {
  readonly heading: string;
  readonly lead: string;
  readonly steps: readonly {
    readonly id: string;
    readonly verb: string;
    readonly when: string;
    readonly detail: string;
  }[];
  readonly commitments: readonly string[];
};

export type HomeWhy = {
  readonly heading: string;
  readonly quote: { readonly text: string; readonly attribution: string };
  readonly points: readonly {
    readonly id: string;
    readonly lead: string;
    readonly detail: string;
  }[];
  readonly aboutLinkLabel: string;
};

export type HomeFaq = {
  readonly heading: string;
  readonly lead: string;
  readonly items: readonly {
    readonly id: string;
    readonly question: string;
    readonly answer: string;
  }[];
};
