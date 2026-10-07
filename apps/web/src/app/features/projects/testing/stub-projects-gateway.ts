import { of } from 'rxjs';
import type { ProjectsGateway } from '../domain/gateways/projects.gateway';
import { makeProject, makeProjectImage } from './project-builders';

export function stubProjectsGateway(overrides: Partial<ProjectsGateway> = {}): ProjectsGateway {
  return {
    getAllProjects: () => of([]),
    invalidateAllProjects: () => undefined,
    getFeaturedProjects: () => of([]),
    invalidateFeatured: () => undefined,
    getProjectById: () => of(makeProject()),
    createProject: () => of(makeProject()),
    updateProject: () => of(makeProject()),
    deleteProject: () => of(undefined),
    uploadImage: () => of('uploaded-key'),
    uploadGalleryImage: () => of(makeProjectImage()),
    updateGalleryImageAlt: () => of(makeProjectImage()),
    reorderGallery: () => of([]),
    deleteGalleryImage: () => of(undefined),
    ...overrides,
  } as ProjectsGateway;
}
