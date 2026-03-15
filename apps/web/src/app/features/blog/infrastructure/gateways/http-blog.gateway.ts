import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { BlogGateway } from '../../domain';
import type { Article, Comment } from '../../domain';
import { API_BASE_URL } from '@shared/api';

function resolveArticle(apiUrl: string, a: Article): Article {
  if (!a.image) return a;
  const image = a.image.startsWith('http') ? a.image : `${apiUrl}${a.image}`;
  return { ...a, image };
}

@Injectable()
export class HttpBlogGateway implements BlogGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getAllArticles(): Observable<readonly Article[]> {
    return this.http.get<readonly Article[]>(`${this.apiUrl}/articles?_sort=-date`).pipe(
      map((articles) => articles.map((a) => resolveArticle(this.apiUrl, a as Article))),
      catchError(() => of([])),
    );
  }

  getArticleById(id: string): Observable<Article> {
    return this.http
      .get<Article[]>(`${this.apiUrl}/articles?id=${id}`)
      .pipe(
        switchMap((data) =>
          data.length > 0
            ? of(resolveArticle(this.apiUrl, data[0]))
            : throwError(() => new Error('Article not found')),
        ),
      );
  }

  getAllComments(): Observable<readonly Comment[]> {
    return this.http.get<{ data: Comment[] }>(`${this.apiUrl}/comments`).pipe(
      map((res) => res.data),
      catchError(() => of([])),
    );
  }

  getCommentsByArticle(articleId: string): Observable<readonly Comment[]> {
    return this.http
      .get<{ data: Comment[] }>(`${this.apiUrl}/comments?idArticle=${articleId}`)
      .pipe(
        map((res) => res.data),
        catchError(() => of([])),
      );
  }

  createArticle(article: Omit<Article, 'id'>): Observable<Article> {
    return this.http.post<Article>(`${this.apiUrl}/articles`, article);
  }

  updateArticle(id: string, article: Partial<Article>): Observable<Article> {
    return this.http.patch<Article>(`${this.apiUrl}/articles/${id}`, article);
  }

  deleteArticle(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/articles/${id}`);
  }

  createComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    return this.http.post<Comment>(`${this.apiUrl}/comments`, comment);
  }

  updateComment(id: string, data: Partial<Comment>): Observable<Comment> {
    return this.http.patch<Comment>(`${this.apiUrl}/comments/${id}`, data);
  }

  deleteComment(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/comments/${id}`);
  }

  getArticleCount(): Observable<number> {
    return this.http.get<readonly Article[]>(`${this.apiUrl}/articles`).pipe(
      map((a) => a.length),
      catchError(() => of(0)),
    );
  }

  getCommentCount(): Observable<number> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/comments`).pipe(
      map((res) => res.total),
      catchError(() => of(0)),
    );
  }

  getPendingCommentCount(): Observable<number> {
    return this.http.get<{ total: number }>(`${this.apiUrl}/comments?status=pending`).pipe(
      map((res) => res.total),
      catchError(() => of(0)),
    );
  }

  getFeaturedArticles(): Observable<readonly Article[]> {
    return this.http.get<readonly Article[]>(`${this.apiUrl}/articles?featured=true`).pipe(
      map((articles) => articles.map((a) => resolveArticle(this.apiUrl, a as Article))),
      catchError(() => of([])),
    );
  }

  getFeaturedComments(): Observable<readonly Comment[]> {
    return this.http
      .get<{ data: Comment[] }>(`${this.apiUrl}/comments?status=approved&featured=true`)
      .pipe(
        map((res) => res.data),
        catchError(() => of([])),
      );
  }

  uploadImage(file: File, articleSlug: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ key: string }>(`${this.apiUrl}/articles/${articleSlug}/image`, formData)
      .pipe(map((res) => res.key));
  }
}
