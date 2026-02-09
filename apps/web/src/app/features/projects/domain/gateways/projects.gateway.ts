import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Project, ProjectFilter } from '../models';

export type ProjectsGateway = {
  getAllProjects(): ResourceRef<readonly Project[]>;
  getFeaturedProjects(): Observable<readonly Project[]>;
  getCategories(): Observable<readonly string[]>;
  filterProjects(filter: ProjectFilter): Observable<readonly Project[]>;
  getProjectById(id: string): Observable<Project>;
  createProject(project: Omit<Project, 'id'>): Observable<Project>;
  updateProject(id: string, project: Partial<Project>): Observable<Project>;
  deleteProject(id: string): Observable<void>;
  uploadImage(file: File, projectSlug: string): Observable<string>;
};

export { PROJECTS_GATEWAY } from './projects.gateway.token';
