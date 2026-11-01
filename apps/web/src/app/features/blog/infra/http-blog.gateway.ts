import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable, ReplaySubject, retry, share, startWith, Subject, switchMap } from 'rxjs';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '../domain/models/blog-post.model';
import type { ContentImage } from '../domain/models/content-image.model';
import { API_BASE_URL, STORAGE_BASE_PATH } from '@shared/api/api-config';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { IMAGE_UPLOAD_PREPARER } from '@shared/upload/image-upload-preparer';

const resolveStorageUrl = (storageBase: string, url: string): string =>
  url.startsWith('http') ? url : `${storageBase}${url}`;

function resolvePost(storageBase: string, p: BlogPost): BlogPost {
  return p.coverImage ? { ...p, coverImage: resolveStorageUrl(storageBase, p.coverImage) } : p;
}

@Injectable()
export class HttpBlogGateway extends BlogGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);
  private readonly prepareImage = inject(IMAGE_UPLOAD_PREPARER);

  private readonly _adminRefresh$ = new Subject<void>();

  // Un échec n'est jamais gardé (`resetOnError`) : le prochain lecteur refait la requête.
  private readonly adminPosts$ = this._adminRefresh$.pipe(
    startWith(undefined),
    switchMap(() =>
      this.http.get<BlogPost[]>(`${this.apiUrl}/blog/posts/admin`).pipe(
        retry(1),
        map((rows) => rows.map((p) => resolvePost(STORAGE_BASE_PATH, p))),
      ),
    ),
    share({
      connector: () => new ReplaySubject<readonly BlogPost[]>(1),
      resetOnError: true,
      resetOnComplete: false,
      resetOnRefCountZero: false,
    }),
  );

  getPublishedPosts(): Observable<readonly BlogPost[]> {
    return this.http
      .get<BlogPost[]>(`${this.apiUrl}/blog/posts`)
      .pipe(map((rows) => rows.map((p) => resolvePost(STORAGE_BASE_PATH, p))));
  }

  getAllPostsForAdmin(): Observable<readonly BlogPost[]> {
    return this.adminPosts$;
  }

  invalidateAdminPosts(): void {
    this._adminRefresh$.next();
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http
      .get<BlogPost>(`${this.apiUrl}/blog/posts/${slug}`)
      .pipe(map((p) => resolvePost(STORAGE_BASE_PATH, p)));
  }

  // Les écritures de l'admin : chaque page restaure son état et nomme l'échec elle-même.
  createPost(post: BlogPostInput): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.apiUrl}/blog/posts`, post, {
      context: silentErrors(),
    });
  }

  updatePost(id: string, post: Partial<BlogPostInput>): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.apiUrl}/blog/posts/${id}`, post, {
      context: silentErrors(),
    });
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/blog/posts/${id}`, {
      context: silentErrors(),
    });
  }

  uploadCoverImage(file: File, id: string): Observable<string> {
    return this.postImage<{ key: string }>(`${this.apiUrl}/blog/posts/${id}/image`, file).pipe(
      map((res) => res.key),
    );
  }

  uploadContentImage(file: File): Observable<ContentImage> {
    return this.postImage<{
      url: string;
      width: number;
      height: number;
    }>(`${this.apiUrl}/blog/content-images`, file).pipe(
      map(({ url, width, height }) => ({
        url: resolveStorageUrl(STORAGE_BASE_PATH, url),
        width,
        height,
      })),
    );
  }

  private postImage<T>(url: string, file: File): Observable<T> {
    return this.prepareImage(file).pipe(
      switchMap((prepared) => {
        const formData = new FormData();
        formData.append('file', prepared);
        return this.http.post<T>(url, formData, { context: silentErrors() });
      }),
    );
  }

  likePost(slug: string): Observable<{ likesCount: number }> {
    return this.http.post<{ likesCount: number }>(`${this.apiUrl}/blog/posts/${slug}/like`, {});
  }
}
