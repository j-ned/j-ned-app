import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, retry, share, startWith, Subject, switchMap } from 'rxjs';
import { ProjectsGateway } from '../../domain/gateways/projects.gateway';
import type { Project, ProjectImage, ProjectInput } from '../../domain/models/project.model';
import { isShowcaseProject } from '../../domain/is-showcase-project';
import { API_BASE_URL } from '@shared/api/api-config';
import { toProject, toProjectImage } from '../project.adapter';
import type { ProjectDto, ProjectImageDto } from '../project.types';

@Injectable()
export class HttpProjectsGateway extends ProjectsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  private readonly _refresh$ = new Subject<void>();

  // Une seule liste, gardée pour toute la session : home, /projects et chaque détail la partagent
  // au lieu de la redemander à chaque page. Le premier chargement la lit dans le transfer cache du
  // prérendu. L'admin l'invalide après une écriture.
  //
  // Un échec n'est jamais gardé : la requête est relancée une fois, puis l'erreur part aux abonnés
  // (qui affichent un état d'erreur) et le flux partagé se réinitialise (`resetOnError`), si bien
  // que le prochain abonné, ou un `reload()`, refait la requête. Avant, `catchError → []` figeait
  // une liste vide pour toute la session, impossible à distinguer d'un portfolio sans projet.
  private readonly allProjects$ = this._refresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<ProjectDto[]>(`${this.apiUrl}/projects?_sort=order&limit=100`).pipe(
        retry(1),
        map((rows) => rows.map((row) => toProject(row, this.apiUrl))),
      ),
    ),
    share({
      connector: () => new ReplaySubject<readonly Project[]>(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    }),
  );

  getAllProjects(): Observable<readonly Project[]> {
    return this.allProjects$;
  }

  invalidateAllProjects(): void {
    this._refresh$.next();
  }

  // Dérivé de la liste : zéro requête supplémentaire, même ordre (`_sort=order`).
  getFeaturedProjects(): Observable<readonly Project[]> {
    return this.allProjects$.pipe(map((projects) => projects.filter(isShowcaseProject)));
  }

  invalidateFeatured(): void {
    this._refresh$.next();
  }

  getCategories(): Observable<readonly string[]> {
    return this.getAllProjects().pipe(
      map((projects) => {
        const unique = [...new Set(projects.map((p) => p.category))].sort();
        return ['Tous', ...unique];
      }),
    );
  }

  getProjectById(id: string): Observable<Project> {
    return this.http
      .get<ProjectDto>(`${this.apiUrl}/projects/${id}`)
      .pipe(map((row) => toProject(row, this.apiUrl)));
  }

  createProject(project: ProjectInput): Observable<Project> {
    return this.http
      .post<ProjectDto>(`${this.apiUrl}/projects`, project)
      .pipe(map((row) => toProject(row, this.apiUrl)));
  }

  updateProject(id: string, project: Partial<ProjectInput>): Observable<Project> {
    return this.http
      .patch<ProjectDto>(`${this.apiUrl}/projects/${id}`, project)
      .pipe(map((row) => toProject(row, this.apiUrl)));
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

  uploadGalleryImage(projectId: string, file: File, alt: string): Observable<ProjectImage> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('alt', alt);
    return this.http
      .post<ProjectImageDto>(`${this.apiUrl}/projects/${projectId}/images`, formData)
      .pipe(map((dto) => toProjectImage(dto, this.apiUrl)));
  }

  updateGalleryImageAlt(projectId: string, imageId: string, alt: string): Observable<ProjectImage> {
    return this.http
      .patch<ProjectImageDto>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`, { alt })
      .pipe(map((dto) => toProjectImage(dto, this.apiUrl)));
  }

  reorderGallery(
    projectId: string,
    imageIds: readonly string[],
  ): Observable<readonly ProjectImage[]> {
    return this.http
      .put<ProjectImageDto[]>(`${this.apiUrl}/projects/${projectId}/images/order`, { imageIds })
      .pipe(map((dtos) => dtos.map((dto) => toProjectImage(dto, this.apiUrl))));
  }

  deleteGalleryImage(projectId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`);
  }
}
