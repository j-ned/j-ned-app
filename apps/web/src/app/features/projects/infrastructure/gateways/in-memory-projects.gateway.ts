import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay, throwError } from 'rxjs';
import type { ProjectsGateway } from '../../domain/gateways';
import type { Project, ProjectFilter } from '../../domain/models';
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

  getProjectById(id: string): Observable<Project> {
    const project = this.projects.find((p) => p.id === id);
    return project
      ? of(project).pipe(delay(100))
      : throwError(() => new Error('Project not found'));
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    const newProject = { ...project, id: crypto.randomUUID() } as Project;
    this.projects.push(newProject);
    return of(newProject).pipe(delay(200));
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return throwError(() => new Error('Project not found'));
    this.projects[index] = { ...this.projects[index], ...project } as Project;
    return of(this.projects[index]).pipe(delay(200));
  }

  deleteProject(id: string): Observable<void> {
    const index = this.projects.findIndex((p) => p.id === id);
    if (index === -1) return throwError(() => new Error('Project not found'));
    this.projects.splice(index, 1);
    return of(undefined as void).pipe(delay(200));
  }
}
