import { inject, Injectable } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { BlogGateway } from '../../domain';
import type { Article, Comment } from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase, toSnakeCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseBlogGateway implements BlogGateway {
  private readonly supabase = inject(SupabaseClientService);

  getAllArticles(): Observable<readonly Article[]> {
    return from(
      this.supabase.client.from('articles').select('*').order('date', { ascending: false }),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Article>(row));
      }),
      catchError(() => of([])),
    );
  }

  getArticleById(id: number): Observable<Article> {
    return from(this.supabase.client.from('articles').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Article not found'));
        return of(toCamelCase<Article>(data));
      }),
    );
  }

  getAllComments(): Observable<readonly Comment[]> {
    return from(this.supabase.client.from('comments').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Comment>(row));
      }),
      catchError(() => of([])),
    );
  }

  getCommentsByArticle(articleId: number): Observable<readonly Comment[]> {
    return from(
      this.supabase.client
        .from('comments')
        .select('*')
        .eq('id_article', articleId)
        .eq('status', 'approved'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Comment>(row));
      }),
      catchError(() => of([])),
    );
  }

  createArticle(article: Omit<Article, 'id'>): Observable<Article> {
    return from(
      this.supabase.client
        .from('articles')
        .insert(toSnakeCase(article as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<Article>(data);
      }),
    );
  }

  updateArticle(id: number, article: Partial<Article>): Observable<Article> {
    return from(
      this.supabase.client
        .from('articles')
        .update(toSnakeCase(article as Record<string, unknown>))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Article not found'));
        return of(toCamelCase<Article>(data));
      }),
    );
  }

  deleteArticle(id: number): Observable<void> {
    return from(this.supabase.client.from('articles').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  createComment(comment: Omit<Comment, 'id'>): Observable<Comment> {
    return from(
      this.supabase.client
        .from('comments')
        .insert(toSnakeCase(comment as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<Comment>(data);
      }),
    );
  }

  updateComment(id: number, data: Partial<Comment>): Observable<Comment> {
    return from(
      this.supabase.client
        .from('comments')
        .update(toSnakeCase(data as Record<string, unknown>))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      switchMap(({ data: row, error }) => {
        if (error || !row) return throwError(() => new Error('Comment not found'));
        return of(toCamelCase<Comment>(row));
      }),
    );
  }

  deleteComment(id: number): Observable<void> {
    return from(this.supabase.client.from('comments').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getArticleCount(): Observable<number> {
    return from(
      this.supabase.client.from('articles').select('*', { count: 'exact', head: true }),
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
      catchError(() => of(0)),
    );
  }

  getCommentCount(): Observable<number> {
    return from(
      this.supabase.client.from('comments').select('*', { count: 'exact', head: true }),
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
      catchError(() => of(0)),
    );
  }

  getPendingCommentCount(): Observable<number> {
    return from(
      this.supabase.client
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),
    ).pipe(
      map(({ count, error }) => {
        if (error) throw error;
        return count ?? 0;
      }),
      catchError(() => of(0)),
    );
  }

  getFeaturedComments(): Observable<readonly Comment[]> {
    return from(
      this.supabase.client
        .from('comments')
        .select('*')
        .eq('status', 'approved')
        .eq('featured', true),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Comment>(row));
      }),
      catchError(() => of([])),
    );
  }

  uploadImage(file: File, articleSlug: string): Observable<string> {
    const ext = file.name.split('.').pop() ?? 'webp';
    const path = `${articleSlug}.${ext}`;
    return from(
      this.supabase.client.storage.from('img_blog').upload(path, file, { upsert: true }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return this.supabase.client.storage.from('img_blog').getPublicUrl(path).data.publicUrl;
      }),
    );
  }
}
