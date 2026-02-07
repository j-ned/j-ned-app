import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { ProjectsGateway } from '../../domain/gateways';
import type { Project, ProjectFilter } from '../../domain/models';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpProjectsGateway implements ProjectsGateway {
  private readonly http = inject(HttpClient);

  getAllProjects(): ResourceRef<readonly Project[]> {
    return resource({
      loader: () =>
        fetch(`${API_BASE_URL}/projects?_sort=order`).then(
          (res) => res.json() as Promise<readonly Project[]>,
        ),
    }) as ResourceRef<readonly Project[]>;
  }

  getFeaturedProjects(): Observable<readonly Project[]> {
    return this.http
      .get<Project[]>(`${API_BASE_URL}/projects?featured=true&_sort=order`)
      .pipe(catchError(() => of([])));
  }

  getCategories(): Observable<readonly string[]> {
    return this.http.get<Project[]>(`${API_BASE_URL}/projects`).pipe(
      map((projects) => ['Tous', ...new Set(projects.map((p) => p.category))]),
      catchError(() => of(['Tous'])),
    );
  }

  filterProjects(filter: ProjectFilter): Observable<readonly Project[]> {
    let url = `${API_BASE_URL}/projects?_sort=order`;
    if (filter.category && filter.category !== 'Tous') {
      url += `&category=${filter.category}`;
    }
    if (filter.featured !== undefined) {
      url += `&featured=${filter.featured}`;
    }
    return this.http.get<Project[]>(url).pipe(catchError(() => of([])));
  }

  getProjectById(id: string): Observable<Project> {
    return this.http
      .get<Project[]>(`${API_BASE_URL}/projects?id=${id}`)
      .pipe(
        switchMap((data) =>
          data.length > 0 ? of(data[0]) : throwError(() => new Error('Project not found')),
        ),
      );
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(`${API_BASE_URL}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.get<Project[]>(`${API_BASE_URL}/projects?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Project not found'));
        return this.http.patch<Project>(`${API_BASE_URL}/projects/${data[0].id}`, project);
      }),
    );
  }

  deleteProject(id: string): Observable<void> {
    return this.http.get<Project[]>(`${API_BASE_URL}/projects?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Project not found'));
        return this.http.delete<void>(`${API_BASE_URL}/projects/${data[0].id}`);
      }),
    );
  }
}
