import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { BlogGateway } from '../domain/gateways/blog.gateway';
import type { BlogPost, BlogPostInput } from '../domain/models/blog-post.model';
import { API_BASE_URL } from '@shared/api/api-config';

function resolvePost(apiUrl: string, p: BlogPost): BlogPost {
  if (!p.coverImage) return p;
  const coverImage = p.coverImage.startsWith('http') ? p.coverImage : `${apiUrl}${p.coverImage}`;
  return { ...p, coverImage };
}

@Injectable()
export class HttpBlogGateway extends BlogGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getPublishedPosts(): Observable<readonly BlogPost[]> {
    return this.http
      .get<BlogPost[]>(`${this.apiUrl}/blog/posts`)
      .pipe(map((rows) => rows.map((p) => resolvePost(this.apiUrl, p))));
  }

  getAllPostsForAdmin(): Observable<readonly BlogPost[]> {
    return this.http
      .get<BlogPost[]>(`${this.apiUrl}/blog/posts/admin`)
      .pipe(map((rows) => rows.map((p) => resolvePost(this.apiUrl, p))));
  }

  getPostBySlug(slug: string): Observable<BlogPost> {
    return this.http
      .get<BlogPost>(`${this.apiUrl}/blog/posts/${slug}`)
      .pipe(map((p) => resolvePost(this.apiUrl, p)));
  }

  createPost(post: BlogPostInput): Observable<BlogPost> {
    return this.http.post<BlogPost>(`${this.apiUrl}/blog/posts`, post);
  }

  updatePost(id: string, post: Partial<BlogPostInput>): Observable<BlogPost> {
    return this.http.patch<BlogPost>(`${this.apiUrl}/blog/posts/${id}`, post);
  }

  deletePost(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/blog/posts/${id}`);
  }

  uploadCoverImage(file: File, id: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ key: string }>(`${this.apiUrl}/blog/posts/${id}/image`, formData)
      .pipe(map((res) => res.key));
  }

  likePost(slug: string): Observable<{ likesCount: number }> {
    return this.http.post<{ likesCount: number }>(`${this.apiUrl}/blog/posts/${slug}/like`, {});
  }
}
