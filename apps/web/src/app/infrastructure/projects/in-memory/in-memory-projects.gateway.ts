import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import type { ProjectsGateway } from '../../../core/projects/gateways';
import type { Project, ProjectFilter } from '../../../core/projects/models';
import { PROJECTS } from './projects.data';

@Injectable()
export class InMemoryProjectsGateway implements ProjectsGateway {
  private projects: Project[] = [...PROJECTS].sort((a, b) => a.order - b.order);

  getAllProjects(): ResourceRef<readonly Project[]> {
    return resource({
      loader: () => {
        return new Promise<readonly Project[]>((resolve) => {
          setTimeout(() => resolve(this.projects), 300); // Simulate network delay
        });
      },
    }) as ResourceRef<readonly Project[]>;
  }

  getFeaturedProjects(): Observable<readonly Project[]> {
    const featured = this.projects.filter((p) => p.featured).sort((a, b) => a.order - b.order);
    return of(featured).pipe(delay(100));
  }

  getProjectById(id: string): Observable<Project | null> {
    const project = this.projects.find((p) => p.id === id) || null;
    return of(project).pipe(delay(100));
  }

  getCategories(): Observable<readonly string[]> {
    const categories = ['Tous', ...new Set(this.projects.map((p) => p.category))];
    return of(categories).pipe(delay(50));
  }

  filterProjects(filter: ProjectFilter): Observable<readonly Project[]> {
    let filtered = [...this.projects];

    if (filter.category && filter.category !== 'Tous') {
      filtered = filtered.filter((p) => p.category === filter.category);
    }

    if (filter.featured !== undefined) {
      filtered = filtered.filter((p) => p.featured === filter.featured);
    }

    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter((p) => filter.tags!.some((tag) => p.tags.includes(tag)));
    }

    return of(filtered).pipe(delay(100));
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    const newProject: Project = {
      ...project,
      id: `project-${Date.now()}`,
    };
    this.projects.push(newProject);
    return of(newProject).pipe(delay(200));
  }

  updateProject(id: string, updates: Partial<Project>): Observable<Project> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Project with id ${id} not found`));
    }

    this.projects[index] = { ...this.projects[index], ...updates };
    return of(this.projects[index]).pipe(delay(200));
  }

  deleteProject(id: string): Observable<void> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) {
      return throwError(() => new Error(`Project with id ${id} not found`));
    }

    this.projects.splice(index, 1);
    return of(void 0).pipe(delay(200));
  }
}
