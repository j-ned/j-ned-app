import type { Observable } from 'rxjs';
import type { Project, ProjectInput } from '../models/project.model';
import type { ProjectFilter } from '@features/projects/domain';

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
}
