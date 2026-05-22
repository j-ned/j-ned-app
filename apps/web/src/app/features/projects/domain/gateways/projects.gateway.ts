import type { Observable } from 'rxjs';
import type { Project, ProjectFilter } from '../models';

export abstract class ProjectsGateway {
  abstract getAllProjects(): Observable<readonly Project[]>;
  abstract invalidateAllProjects(): void;
  abstract getFeaturedProjects(): Observable<readonly Project[]>;
  abstract getCategories(): Observable<readonly string[]>;
  abstract filterProjects(filter: ProjectFilter): Observable<readonly Project[]>;
  abstract getProjectById(id: string): Observable<Project>;
  abstract createProject(project: Omit<Project, 'id'>): Observable<Project>;
  abstract updateProject(id: string, project: Partial<Project>): Observable<Project>;
  abstract deleteProject(id: string): Observable<void>;
  abstract uploadImage(file: File, projectSlug: string): Observable<string>;
}
