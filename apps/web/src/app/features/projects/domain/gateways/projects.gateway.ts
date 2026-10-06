import type { Observable } from 'rxjs';
import type { Project, ProjectImage, ProjectInput } from '../models/project.model';
import type { ProjectFilter } from '@features/projects/domain/models/project-filter.model';

export abstract class ProjectsGateway {
  abstract getAllProjects(): Observable<readonly Project[]>;
  abstract invalidateAllProjects(): void;
  abstract getFeaturedProjects(): Observable<readonly Project[]>;
  abstract invalidateFeatured(): void;
  abstract getCategories(): Observable<readonly string[]>;
  abstract filterProjects(filter: ProjectFilter): Observable<readonly Project[]>;
  abstract getProjectById(id: string): Observable<Project>;
  abstract createProject(project: ProjectInput): Observable<Project>;
  abstract updateProject(id: string, project: Partial<ProjectInput>): Observable<Project>;
  abstract deleteProject(id: string): Observable<void>;
  abstract uploadImage(file: File, projectSlug: string): Observable<string>;
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
