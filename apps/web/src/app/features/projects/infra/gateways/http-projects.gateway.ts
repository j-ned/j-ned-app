import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, map, Observable, of, retry, throwError } from 'rxjs';
import { ProjectsGateway } from '../../domain/gateways/projects.gateway';
import type { Project, ProjectImage, ProjectInput } from '../../domain/models/project.model';
import { isShowcaseProject } from '../../domain/is-showcase-project';
import { API_BASE_URL, STORAGE_BASE_PATH } from '@shared/api/api-config';
import { refreshable } from '@shared/api/refreshable';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { IMAGE_UPLOAD_PREPARER } from '@shared/upload/image-upload-preparer';
import { postPreparedImage } from '@shared/upload/post-prepared-image';
import { toProject, toProjectImage } from '../project.adapter';
import type { ProjectDto, ProjectImageDto } from '../project.types';

@Injectable()
export class HttpProjectsGateway extends ProjectsGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly prepareImage = inject(IMAGE_UPLOAD_PREPARER);

  // Une seule liste, gardée pour toute la session : home, /projects et chaque détail la partagent
  // au lieu de la redemander à chaque page. L'admin l'invalide après une écriture. Un échec part aux
  // abonnés : une liste vide de repli serait indiscernable d'un portfolio sans projet.
  private readonly allProjects = refreshable(() =>
    this.http.get<ProjectDto[]>(`${this.apiUrl}/projects`).pipe(
      retry(1),
      map((rows): readonly Project[] => rows.map((row) => toProject(row, STORAGE_BASE_PATH))),
    ),
  );

  getAllProjects(): Observable<readonly Project[]> {
    return this.allProjects.value$;
  }

  invalidateAllProjects(): void {
    this.allProjects.refresh();
  }

  // Dérivé de la liste : zéro requête supplémentaire, même ordre.
  getFeaturedProjects(): Observable<readonly Project[]> {
    return this.allProjects.value$.pipe(map((projects) => projects.filter(isShowcaseProject)));
  }

  invalidateFeatured(): void {
    this.allProjects.refresh();
  }

  getProjectById(id: string): Observable<Project | null> {
    return this.http.get<ProjectDto>(`${this.apiUrl}/projects/${encodeURIComponent(id)}`).pipe(
      map((row) => toProject(row, STORAGE_BASE_PATH)),
      catchError((error: unknown) =>
        error instanceof HttpErrorResponse && error.status === 404
          ? of(null)
          : throwError(() => error),
      ),
    );
  }

  // Les écritures de l'admin : chaque page restaure son état et nomme l'échec elle-même.
  createProject(project: ProjectInput): Observable<Project> {
    return this.http
      .post<ProjectDto>(`${this.apiUrl}/projects`, project, { context: silentErrors() })
      .pipe(map((row) => toProject(row, STORAGE_BASE_PATH)));
  }

  updateProject(id: string, project: Partial<ProjectInput>): Observable<Project> {
    return this.http
      .patch<ProjectDto>(`${this.apiUrl}/projects/${id}`, project, { context: silentErrors() })
      .pipe(map((row) => toProject(row, STORAGE_BASE_PATH)));
  }

  deleteProject(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${id}`, { context: silentErrors() });
  }

  uploadImage(file: File, id: string): Observable<string> {
    return postPreparedImage<{ key: string }>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/projects/${id}/image`,
      file,
      context: silentErrors(),
    }).pipe(map((res) => res.key));
  }

  uploadGalleryImage(projectId: string, file: File, alt: string): Observable<ProjectImage> {
    return postPreparedImage<ProjectImageDto>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/projects/${projectId}/images`,
      file,
      fields: { alt },
      context: silentErrors(),
    }).pipe(map((dto) => toProjectImage(dto, STORAGE_BASE_PATH)));
  }

  updateGalleryImageAlt(projectId: string, imageId: string, alt: string): Observable<ProjectImage> {
    return this.http
      .patch<ProjectImageDto>(
        `${this.apiUrl}/projects/${projectId}/images/${imageId}`,
        { alt },
        { context: silentErrors() },
      )
      .pipe(map((dto) => toProjectImage(dto, STORAGE_BASE_PATH)));
  }

  reorderGallery(
    projectId: string,
    imageIds: readonly string[],
  ): Observable<readonly ProjectImage[]> {
    const url = `${this.apiUrl}/projects/${projectId}/images/order`;
    return this.http
      .put<ProjectImageDto[]>(url, { imageIds }, { context: silentErrors() })
      .pipe(map((dtos) => dtos.map((dto) => toProjectImage(dto, STORAGE_BASE_PATH))));
  }

  deleteGalleryImage(projectId: string, imageId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`, {
      context: silentErrors(),
    });
  }
}
