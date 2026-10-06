import type { Project } from '../domain/models/project.model';

export type ProjectImageDto = {
  readonly id: string;
  readonly url: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly order: number;
};

export type ProjectDto = Omit<Project, 'kind' | 'gallery'> & {
  readonly kind?: string;
  readonly gallery?: readonly ProjectImageDto[];
};
