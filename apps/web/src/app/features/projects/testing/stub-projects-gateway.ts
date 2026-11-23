import { of } from 'rxjs';
import type { ProjectsGateway } from '../domain/gateways/projects.gateway';
import { makeProject, makeProjectImage } from './project-builders';

export function stubProjectsGateway(overrides: Partial<ProjectsGateway> = {}): ProjectsGateway {
  return {
    getAllProjects: () => of([]),
    invalidateAllProjects: () => undefined,
    getFeaturedProjects: () => of([]),
    getProjectById: () => of(makeProject()),
    createProject: () => of(makeProject()),
    updateProject: () => of(makeProject()),
    deleteProject: () => of(undefined),
    uploadImage: () => of('uploaded-key'),
    uploadGalleryImage: () => of({ result: makeProjectImage(), projectVersion: null }),
    updateGalleryImageAlt: () => of({ result: makeProjectImage(), projectVersion: null }),
    reorderGallery: () => of({ result: [], projectVersion: null }),
    deleteGalleryImage: () => of({ result: null, projectVersion: null }),
    ...overrides,
  };
}
