import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  map,
  of,
  retry,
  tap,
  throwError,
  type MonoTypeOperatorFunction,
  type Observable,
} from 'rxjs';
import { ProjectsGateway } from '../../domain/gateways/projects.gateway';
import type { Project, ProjectImage, ProjectInput } from '../../domain/models/project.model';
import { isShowcaseProject } from '../../domain/is-showcase-project';
import { API_BASE_URL, STORAGE_BASE_PATH } from '@shared/api/api-config';
import { ifMatch } from '@shared/api/if-match';
import { refreshable } from '@shared/api/refreshable';
import { silentErrors, silentWhen } from '@core/interceptors/skip-error-toast';
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
  // au lieu de la redemander à chaque page. Toute écriture réussie la relit. Un échec part aux
  // abonnés : une liste vide de repli serait indiscernable d'un portfolio sans projet.
  private readonly allProjects = refreshable((background) =>
    this.http
      .get<ProjectDto[]>(`${this.apiUrl}/projects`, { context: silentWhen(background) })
      .pipe(
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

  getProjectById(
    id: string,
    options?: { readonly background?: boolean },
  ): Observable<Project | null> {
    const url = `${this.apiUrl}/projects/${encodeURIComponent(id)}`;
    return this.http.get<ProjectDto>(url, { context: silentWhen(options?.background) }).pipe(
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
      .pipe(
        map((row) => toProject(row, STORAGE_BASE_PATH)),
        this.relistOnSuccess(),
      );
  }

  updateProject(id: string, project: Partial<ProjectInput>, version?: number): Observable<Project> {
    return this.http
      .patch<ProjectDto>(`${this.apiUrl}/projects/${id}`, project, {
        context: silentErrors(),
        headers: ifMatch(version),
      })
      .pipe(
        map((row) => toProject(row, STORAGE_BASE_PATH)),
        this.relistOnSuccess(),
      );
  }

  deleteProject(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/projects/${id}`, { context: silentErrors() })
      .pipe(this.relistOnSuccess());
  }

  uploadImage(file: File, id: string, version?: number): Observable<string> {
    return postPreparedImage<{ key: string }>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/projects/${id}/image`,
      file,
      context: silentErrors(),
      headers: ifMatch(version),
    }).pipe(
      map((res) => res.key),
      this.relistOnSuccess(),
    );
  }

  uploadGalleryImage(projectId: string, file: File, alt: string): Observable<ProjectImage> {
    return postPreparedImage<ProjectImageDto>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/projects/${projectId}/images`,
      file,
      fields: { alt },
      context: silentErrors(),
    }).pipe(
      map((dto) => toProjectImage(dto, STORAGE_BASE_PATH)),
      this.relistOnSuccess(),
    );
  }

  updateGalleryImageAlt(projectId: string, imageId: string, alt: string): Observable<ProjectImage> {
    return this.http
      .patch<ProjectImageDto>(
        `${this.apiUrl}/projects/${projectId}/images/${imageId}`,
        { alt },
        { context: silentErrors() },
      )
      .pipe(
        map((dto) => toProjectImage(dto, STORAGE_BASE_PATH)),
        this.relistOnSuccess(),
      );
  }

  reorderGallery(
    projectId: string,
    imageIds: readonly string[],
  ): Observable<readonly ProjectImage[]> {
    const url = `${this.apiUrl}/projects/${projectId}/images/order`;
    return this.http.put<ProjectImageDto[]>(url, { imageIds }, { context: silentErrors() }).pipe(
      map((dtos) => dtos.map((dto) => toProjectImage(dto, STORAGE_BASE_PATH))),
      this.relistOnSuccess(),
    );
  }

  deleteGalleryImage(projectId: string, imageId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/projects/${projectId}/images/${imageId}`, {
        context: silentErrors(),
      })
      .pipe(this.relistOnSuccess());
  }

  private relistOnSuccess<T>(): MonoTypeOperatorFunction<T> {
    return tap(() => this.allProjects.refresh());
  }
}
