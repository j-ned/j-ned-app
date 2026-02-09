import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { ProjectsGateway } from '../../domain';
import type { Project, ProjectFilter } from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase, toSnakeCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseProjectsGateway implements ProjectsGateway {
  private readonly supabase = inject(SupabaseClientService);

  getAllProjects(): ResourceRef<readonly Project[]> {
    return resource({
      loader: async () => {
        const { data, error } = await this.supabase.client
          .from('projects')
          .select('*')
          .order('order');
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Project>(row));
      },
    }) as ResourceRef<readonly Project[]>;
  }

  getFeaturedProjects(): Observable<readonly Project[]> {
    return from(
      this.supabase.client.from('projects').select('*').eq('featured', true).order('order'),
    ).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Project>(row));
      }),
      catchError(() => of([])),
    );
  }

  getCategories(): Observable<readonly string[]> {
    return from(this.supabase.client.from('projects').select('category')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        const categories = new Set((data ?? []).map((row) => row['category'] as string));
        return ['Tous', ...categories];
      }),
      catchError(() => of(['Tous'])),
    );
  }

  filterProjects(filter: ProjectFilter): Observable<readonly Project[]> {
    let query = this.supabase.client.from('projects').select('*').order('order');
    if (filter.category && filter.category !== 'Tous') {
      query = query.eq('category', filter.category);
    }
    if (filter.featured !== undefined) {
      query = query.eq('featured', filter.featured);
    }
    return from(query).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Project>(row));
      }),
      catchError(() => of([])),
    );
  }

  getProjectById(id: string): Observable<Project> {
    return from(this.supabase.client.from('projects').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Project not found'));
        return of(toCamelCase<Project>(data));
      }),
    );
  }

  createProject(project: Omit<Project, 'id'>): Observable<Project> {
    const id = this.slugify(project.title);
    const row = { id, ...toSnakeCase(project as unknown as Record<string, unknown>) };
    return from(this.supabase.client.from('projects').insert(row).select().single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<Project>(data);
      }),
    );
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  updateProject(id: string, project: Partial<Project>): Observable<Project> {
    return from(
      this.supabase.client
        .from('projects')
        .update(toSnakeCase(project as Record<string, unknown>))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Project not found'));
        return of(toCamelCase<Project>(data));
      }),
    );
  }

  deleteProject(id: string): Observable<void> {
    return from(this.supabase.client.from('projects').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  uploadImage(file: File, projectSlug: string): Observable<string> {
    const ext = file.name.split('.').pop() ?? 'webp';
    const path = `${projectSlug}.${ext}`;
    return from(
      this.supabase.client.storage.from('img_project').upload(path, file, { upsert: true }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return this.supabase.client.storage.from('img_project').getPublicUrl(path).data.publicUrl;
      }),
    );
  }
}
