import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { Project, ProjectFilter } from '../models';

export interface ProjectsGateway {
  getAllProjects(): ResourceRef<readonly Project[]>;
  getFeaturedProjects(): Observable<readonly Project[]>;
  getCategories(): Observable<readonly string[]>;
  filterProjects(filter: ProjectFilter): Observable<readonly Project[]>;
}

export { PROJECTS_GATEWAY } from './projects.gateway.token';
