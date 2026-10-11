import type { Biography } from './biography.model';
import type { Diploma } from './diploma.model';
import type { Highlight } from './highlight.model';
import type { Technology } from './technology.model';
import type { Motivation, WhatIDo } from './what-i-do.model';

export type ProfileContent = {
  readonly biography: Biography;
  readonly highlights: readonly Highlight[];
  readonly workSummary: string;
  readonly whatIDo: readonly WhatIDo[];
  readonly technologies: readonly Technology[];
  readonly diplomasSummary: string;
  readonly diplomas: readonly Diploma[];
  readonly motivation: Motivation;
};

export type ProfileDocument = {
  readonly version: number;
  readonly updatedAt: string;
  readonly content: ProfileContent;
  readonly portraitUrl: string | null;
};
