export interface Diploma {
  readonly id: string;
  readonly title: string;
  readonly provider: string;
  readonly shortDescription: string;
  readonly skills: readonly string[];
}
