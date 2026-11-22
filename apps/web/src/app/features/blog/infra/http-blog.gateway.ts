import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, retry, tap, type MonoTypeOperatorFunction, type Observable } from 'rxjs';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput, BlogPostSummary } from '../domain/models/blog-post.model';
import type { ContentImage } from '../domain/models/content-image.model';
import { API_BASE_URL, STORAGE_BASE_PATH } from '@shared/api/api-config';
import { refreshable } from '@shared/api/refreshable';
import { silentErrors, silentWhen } from '@core/interceptors/skip-error-toast';
import { IMAGE_UPLOAD_PREPARER } from '@shared/upload/image-upload-preparer';
import { postPreparedImage } from '@shared/upload/post-prepared-image';

const resolveStorageUrl = (storageBase: string, url: string): string =>
  url.startsWith('http') ? url : `${storageBase}${url}`;

function resolvePost<T extends BlogPostSummary>(storageBase: string, p: T): T {
  return p.coverImage ? { ...p, coverImage: resolveStorageUrl(storageBase, p.coverImage) } : p;
}

@Injectable()
export class HttpBlogGateway extends BlogGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly prepareImage = inject(IMAGE_UPLOAD_PREPARER);

  private readonly adminPosts = refreshable((background) =>
    this.http
      .get<BlogPost[]>(`${this.apiUrl}/blog/posts/admin`, { context: silentWhen(background) })
      .pipe(
        retry(1),
        map((rows): readonly BlogPost[] => rows.map((p) => resolvePost(STORAGE_BASE_PATH, p))),
      ),
  );

  getPublishedPosts(options?: {
    readonly background?: boolean;
  }): Observable<readonly BlogPostSummary[]> {
    return this.http
      .get<BlogPostSummary[]>(`${this.apiUrl}/blog/posts`, {
        context: silentWhen(options?.background),
      })
      .pipe(map((rows) => rows.map((p) => resolvePost(STORAGE_BASE_PATH, p))));
  }

  getAllPostsForAdmin(): Observable<readonly BlogPost[]> {
    return this.adminPosts.value$;
  }

  invalidateAdminPosts(): void {
    this.adminPosts.refresh();
  }

  // Hors du cache partagé : la relire écraserait le brouillon de l'éditeur ouvert.
  getLatestAdminPost(id: string): Observable<BlogPost | null> {
    return this.http
      .get<BlogPost[]>(`${this.apiUrl}/blog/posts/admin`, { context: silentErrors() })
      .pipe(
        map((rows) => {
          const post = rows.find((row) => row.id === id);
          return post ? resolvePost(STORAGE_BASE_PATH, post) : null;
        }),
      );
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http
      .get<BlogPost>(`${this.apiUrl}/blog/posts/${encodeURIComponent(slug)}`)
      .pipe(map((p) => resolvePost(STORAGE_BASE_PATH, p)));
  }

  // Les écritures de l'admin : chaque page restaure son état et nomme l'échec elle-même.
  createPost(post: BlogPostInput): Observable<BlogPost> {
    return this.http
      .post<BlogPost>(`${this.apiUrl}/blog/posts`, post, { context: silentErrors() })
      .pipe(this.relistOnSuccess());
  }

  updatePost(id: string, post: Partial<BlogPostInput>): Observable<BlogPost> {
    return this.http
      .patch<BlogPost>(`${this.apiUrl}/blog/posts/${id}`, post, { context: silentErrors() })
      .pipe(this.relistOnSuccess());
  }

  deletePost(id: string): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/blog/posts/${id}`, { context: silentErrors() })
      .pipe(this.relistOnSuccess());
  }

  uploadCoverImage(file: File, id: string): Observable<string> {
    return postPreparedImage<{ key: string }>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/blog/posts/${id}/image`,
      file,
      context: silentErrors(),
    }).pipe(
      map((res) => res.key),
      this.relistOnSuccess(),
    );
  }

  uploadContentImage(file: File): Observable<ContentImage> {
    return postPreparedImage<{ url: string; width: number; height: number }>({
      http: this.http,
      prepare: this.prepareImage,
      url: `${this.apiUrl}/blog/content-images`,
      file,
      context: silentErrors(),
    }).pipe(
      map(({ url, width, height }) => ({
        url: resolveStorageUrl(STORAGE_BASE_PATH, url),
        width,
        height,
      })),
    );
  }

  // Le nombre de « j'aime » figure dans la liste de l'admin.
  likePost(slug: string): Observable<{ likesCount: number }> {
    return this.http
      .post<{
        likesCount: number;
      }>(`${this.apiUrl}/blog/posts/${encodeURIComponent(slug)}/like`, {})
      .pipe(this.relistOnSuccess());
  }

  private relistOnSuccess<T>(): MonoTypeOperatorFunction<T> {
    return tap(() => this.adminPosts.refresh());
  }
}
