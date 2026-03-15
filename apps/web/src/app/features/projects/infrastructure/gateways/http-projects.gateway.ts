import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import type { ProjectsGateway } from '../../domain';
import type { Project, ProjectFilter } from '../../domain';
import { API_BASE_URL } from '@shared/api';

function resolveProject(apiUrl: string, p: Project): Project {
  if (!p.image) return p;
  const image = p.image.startsWith('http') ? p.image : `${apiUrl}${p.image}`;
  return { ...p, image };
}

@Injectable()
export class HttpProjectsGateway implements ProjectsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getAllProjects(): Observable<readonly Project[]> {
    return this.http.get<{ data: Project[] }>(`${this.apiUrl}/projects?_sort=order&limit=100`).pipe(
      map((res) => res.data.map((p) => resolveProject(this.apiUrl, p))),
      catchError(() => of([])),
    );
  }

  getFeaturedProjects(): Observable<readonly Project[]> {
    return this.http
      .get<{ data: Project[] }>(`${this.apiUrl}/projects?featured=true&_sort=order`)
      .pipe(
        map((res) => res.data.map((p) => resolveProject(this.apiUrl, p))),
        catchError(() => of([])),
      );
  }

  getCategories(): Observable<readonly string[]> {
    return this.http
      .get<{ name: string; count: number }[]>(`${this.apiUrl}/projects/categories`)
      .pipe(
        map((categories) => ['Tous', ...categories.map((c) => c.name)]),
        catchError(() => of(['Tous'])),
      );
  }

  filterProjects(filter: ProjectFilter): Observable<readonly Project[]> {
    const params = new URLSearchParams();
    params.set('_sort', 'order');
    if (filter.category && filter.category !== 'Tous') {
      params.set('category', filter.category);
    }
    if (filter.featured !== undefined) {
      params.set('featured', String(filter.featured));
    }
    return this.http.get<{ data: Project[] }>(`${this.apiUrl}/projects?${params.toString()}`).pipe(
      map((res) => res.data.map((p) => resolveProject(this.apiUrl, p))),
      catchError(() => of([])),
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.apiUrl}/projects/${id}`)
      .pipe(map((p) => resolveProject(this.apiUrl, p)));
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  uploadImage(file: File, projectSlug: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ key: string }>(`${this.apiUrl}/projects/${projectSlug}/image`, formData)
      .pipe(map((res) => res.key));
  }
}
