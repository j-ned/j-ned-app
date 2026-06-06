import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, shareReplay, startWith, Subject, switchMap } from 'rxjs';
import {
  ProjectsGateway,
  type Project,
  type ProjectFilter,
  type ProjectInput,
} from '../../domain';
import { API_BASE_URL } from '@shared/api';

function resolveProject(apiUrl: string, p: Project): Project {
  if (!p.image) return p;
  const image = p.image.startsWith('http') ? p.image : `${apiUrl}${p.image}`;
  return { ...p, image };
}

@Injectable()
export class HttpProjectsGateway extends ProjectsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly _refreshAll$ = new Subject<void>();
  private readonly allProjects$ = this._refreshAll$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<Project[]>(`${this.apiUrl}/projects?_sort=order&limit=100`).pipe(
        map((rows) => rows.map((p) => resolveProject(this.apiUrl, p))),
        catchError(() => of([] as readonly Project[])),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  private readonly _refreshFeatured$ = new Subject<void>();
  private readonly featuredProjects$ = this._refreshFeatured$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<Project[]>(`${this.apiUrl}/projects?featured=true&_sort=order`).pipe(
        map((rows) => rows.map((p) => resolveProject(this.apiUrl, p))),
        catchError(() => of([] as readonly Project[])),
      ),
    ),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  getAllProjects(): Observable<readonly Project[]> {
    return this.allProjects$;
  }

  invalidateAllProjects(): void {
    this._refreshAll$.next();
  }

  getFeaturedProjects(): Observable<readonly Project[]> {
    return this.featuredProjects$;
  }

  invalidateFeatured(): void {
    this._refreshFeatured$.next();
  }

  getCategories(): Observable<readonly string[]> {
    return this.getAllProjects().pipe(
      map((projects) => {
        const unique = [...new Set(projects.map((p) => p.category))].sort();
        return ['Tous', ...unique];
      }),
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
    return this.http.get<Project[]>(`${this.apiUrl}/projects?${params.toString()}`).pipe(
      map((rows) => rows.map((p) => resolveProject(this.apiUrl, p))),
      catchError(() => of([])),
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.http
      .get<Project>(`${this.apiUrl}/projects/${id}`)
      .pipe(map((p) => resolveProject(this.apiUrl, p)));
  }

  createProject(project: ProjectInput): Observable<Project> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, project);
  }

  updateProject(id: string, project: Partial<ProjectInput>): Observable<Project> {
    return this.http.patch<Project>(`${this.apiUrl}/projects/${id}`, project);
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`);
  }

  uploadImage(file: File, id: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ key: string }>(`${this.apiUrl}/projects/${id}/image`, formData)
      .pipe(map((res) => res.key));
  }
}
