import type { Project, ProjectImage, ProjectInput } from '../domain/models/project.model';

export function makeProject(overrides: Partial<Project> = {}): Project {
  return {
    id: 'id-1',
    title: 'Mon site',
    slug: 'mon-site',
    category: 'Web',
    tags: [],
    description: 'desc',
    image: '',
    featured: false,
    order: 0,
    kind: 'production',
    gallery: [],
    ...overrides,
  };
}

export function makeProjectInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    title: 'Mon site',
    category: 'Web',
    tags: [],
    description: 'desc',
    featured: false,
    order: 0,
    kind: 'production',
    ...overrides,
  };
}

export function makeProjectImage(overrides: Partial<ProjectImage> = {}): ProjectImage {
  return {
    id: 'img-1',
    src: 'https://cdn.test/project-images/img-1.avif',
    alt: 'Tableau de bord du mois en cours',
    width: 1600,
    height: 1000,
    ...overrides,
  };
}
