import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { BlogGateway } from '../../domain/gateways';
import type { Article, Comment } from '../../domain/models';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpBlogGateway implements BlogGateway {
  private readonly http = inject(HttpClient);

  getAllArticles(): Observable<readonly Article[]> {
    return this.http
      .get<readonly Article[]>(`${API_BASE_URL}/articles?_sort=-date`)
      .pipe(catchError(() => of([])));
  }

  getArticleById(id: number): Observable<Article> {
    return this.http
      .get<Article[]>(`${API_BASE_URL}/articles?id=${id}`)
      .pipe(
        switchMap((data) =>
          data.length > 0 ? of(data[0]) : throwError(() => new Error('Article not found')),
        ),
      );
  }

  getAllComments(): Observable<readonly Comment[]> {
    return this.http
      .get<readonly Comment[]>(`${API_BASE_URL}/comments`)
      .pipe(catchError(() => of([])));
  }

  getCommentsByArticle(articleId: number): Observable<readonly Comment[]> {
    return this.http
      .get<readonly Comment[]>(`${API_BASE_URL}/comments?idArticle=${articleId}`)
      .pipe(catchError(() => of([])));
  }

  createArticle(article: Omit<Article, 'id'>): Observable<Article> {
    return this.http.post<Article>(`${API_BASE_URL}/articles`, article);
  }

  updateArticle(id: number, article: Partial<Article>): Observable<Article> {
    return this.http.get<Article[]>(`${API_BASE_URL}/articles?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Article not found'));
        return this.http.patch<Article>(`${API_BASE_URL}/articles/${data[0].id}`, article);
      }),
    );
  }

  deleteArticle(id: number): Observable<void> {
    return this.http.get<Article[]>(`${API_BASE_URL}/articles?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Article not found'));
        return this.http.delete<void>(`${API_BASE_URL}/articles/${data[0].id}`);
      }),
    );
  }

  deleteComment(id: number): Observable<void> {
    return this.http.get<Comment[]>(`${API_BASE_URL}/comments?id=${id}`).pipe(
      switchMap((data) => {
        if (data.length === 0) return throwError(() => new Error('Comment not found'));
        return this.http.delete<void>(`${API_BASE_URL}/comments/${data[0].id}`);
      }),
    );
  }

  getArticleCount(): Observable<number> {
    return this.http.get<readonly Article[]>(`${API_BASE_URL}/articles`).pipe(
      map((a) => a.length),
      catchError(() => of(0)),
    );
  }

  getCommentCount(): Observable<number> {
    return this.http.get<readonly Comment[]>(`${API_BASE_URL}/comments`).pipe(
      map((c) => c.length),
      catchError(() => of(0)),
    );
  }
}
