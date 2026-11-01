type ProfileItemDto = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

type TechnologyDto = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly icon: string;
};

type DiplomaDto = {
  readonly id: string;
  readonly title: string;
  readonly provider: string;
  readonly level: string;
  readonly shortDescription: string;
  readonly skills: readonly string[];
};

export type ProfileDto = {
  readonly version: number;
  readonly updatedAt: string;
  readonly biography: {
    readonly title: string;
    readonly summary: string;
    readonly leadEmphasis: string;
    readonly paragraphs: readonly string[];
  };
  readonly highlights: readonly ProfileItemDto[];
  readonly workSummary: string;
  readonly whatIDo: readonly ProfileItemDto[];
  readonly technologies: readonly TechnologyDto[];
  readonly diplomasSummary: string;
  readonly diplomas: readonly DiplomaDto[];
  readonly motivation: {
    readonly title: string;
    readonly statement: string;
    readonly description: string;
  };
  readonly portrait: string | null;
};
