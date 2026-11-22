import type { Observable } from 'rxjs';
import type { Project, ProjectImage, ProjectInput } from '../models/project.model';

export abstract class ProjectsGateway {
  abstract getAllProjects(): Observable<readonly Project[]>;
  abstract invalidateAllProjects(): void;
  abstract getFeaturedProjects(): Observable<readonly Project[]>;
  abstract getProjectById(
    id: string,
    options?: { readonly background?: boolean },
  ): Observable<Project | null>;
  abstract createProject(project: ProjectInput): Observable<Project>;
  // `version` : écriture refusée en 409 si le projet a changé depuis.
  abstract updateProject(
    id: string,
    project: Partial<ProjectInput>,
    version?: number,
  ): Observable<Project>;
  abstract deleteProject(id: string): Observable<void>;
  abstract uploadImage(file: File, projectId: string, version?: number): Observable<string>;
  abstract uploadGalleryImage(projectId: string, file: File, alt: string): Observable<ProjectImage>;
  abstract updateGalleryImageAlt(
    projectId: string,
    imageId: string,
    alt: string,
  ): Observable<ProjectImage>;
  abstract reorderGallery(
    projectId: string,
    imageIds: readonly string[],
  ): Observable<readonly ProjectImage[]>;
  abstract deleteGalleryImage(projectId: string, imageId: string): Observable<void>;
}
