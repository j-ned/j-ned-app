import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { catchError, from, map, Observable, of, switchMap, throwError } from 'rxjs';
import type { ProfileGateway } from '../../domain';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase, toSnakeCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseProfileGateway implements ProfileGateway {
  private readonly supabase = inject(SupabaseClientService);

  getProfileInfo(): ResourceRef<ProfileInfo> {
    return resource({
      loader: async () => {
        const { data, error } = await this.supabase.client
          .from('profile')
          .select('*')
          .limit(1)
          .single();
        if (error) throw error;
        return toCamelCase<ProfileInfo>(data);
      },
    }) as ResourceRef<ProfileInfo>;
  }

  getBiography(): ResourceRef<Biography> {
    return resource({
      loader: async () => {
        const { data, error } = await this.supabase.client
          .from('biography')
          .select('*')
          .limit(1)
          .single();
        if (error) throw error;
        return toCamelCase<Biography>(data);
      },
    }) as ResourceRef<Biography>;
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return from(this.supabase.client.from('social_buttons').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<SocialButton>(row));
      }),
      catchError(() => of([])),
    );
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return from(this.supabase.client.from('diplomas').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Diploma>(row));
      }),
      catchError(() => of([])),
    );
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return from(this.supabase.client.from('tech_stack').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Technology>(row));
      }),
      catchError(() => of([])),
    );
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return from(this.supabase.client.from('highlights').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Highlight>(row));
      }),
      catchError(() => of([])),
    );
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return from(this.supabase.client.from('what_i_do').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<WhatIDo>(row));
      }),
      catchError(() => of([])),
    );
  }

  getWhatISeek(): Observable<WhatISeek> {
    return from(this.supabase.client.from('what_i_seek').select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<WhatISeek>(data);
      }),
      catchError(() => of({ id: 0, title: '', description: '' } as WhatISeek)),
    );
  }

  getProfileInfoForEdit(): Observable<ProfileInfo> {
    return from(this.supabase.client.from('profile').select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<ProfileInfo>(data);
      }),
    );
  }

  updateProfileInfo(data: Partial<ProfileInfo>): Observable<ProfileInfo> {
    const { id, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('profile')
        .update(toSnakeCase(rest))
        .eq('id', (id as number) ?? 1)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<ProfileInfo>(row);
      }),
    );
  }

  uploadAvatar(file: File): Observable<string> {
    const ext = file.name.split('.').pop() ?? 'webp';
    const path = `avatar.${ext}`;
    return from(
      this.supabase.client.storage.from('img_profile').upload(path, file, { upsert: true }),
    ).pipe(
      map(({ error }) => {
        if (error) throw error;
        return this.supabase.client.storage.from('img_profile').getPublicUrl(path).data.publicUrl;
      }),
    );
  }

  getBiographyForEdit(): Observable<Biography> {
    return from(this.supabase.client.from('biography').select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<Biography>(data);
      }),
    );
  }

  updateBiography(data: Partial<Biography>): Observable<Biography> {
    const { id, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('biography')
        .update(toSnakeCase(rest))
        .eq('id', (id as number) ?? 1)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Biography>(row);
      }),
    );
  }

  getWhatISeekForEdit(): Observable<WhatISeek> {
    return from(this.supabase.client.from('what_i_seek').select('*').limit(1).single()).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return toCamelCase<WhatISeek>(data);
      }),
    );
  }

  updateWhatISeek(data: Partial<WhatISeek>): Observable<WhatISeek> {
    const { id, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('what_i_seek')
        .update(toSnakeCase(rest))
        .eq('id', (id as number) ?? 1)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<WhatISeek>(row);
      }),
    );
  }

  getSocialButtonById(id: number): Observable<SocialButton> {
    return from(this.supabase.client.from('social_buttons').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('SocialButton not found'));
        return of(toCamelCase<SocialButton>(data));
      }),
    );
  }

  createSocialButton(data: Omit<SocialButton, 'id'>): Observable<SocialButton> {
    return from(
      this.supabase.client
        .from('social_buttons')
        .insert(toSnakeCase(data as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<SocialButton>(row);
      }),
    );
  }

  updateSocialButton(id: number, data: Partial<SocialButton>): Observable<SocialButton> {
    const { id: _, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('social_buttons')
        .update(toSnakeCase(rest))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<SocialButton>(row);
      }),
    );
  }

  deleteSocialButton(id: number): Observable<void> {
    return from(this.supabase.client.from('social_buttons').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getDiplomaById(id: number): Observable<Diploma> {
    return from(this.supabase.client.from('diplomas').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Diploma not found'));
        return of(toCamelCase<Diploma>(data));
      }),
    );
  }

  createDiploma(data: Omit<Diploma, 'id'>): Observable<Diploma> {
    return from(
      this.supabase.client
        .from('diplomas')
        .insert(toSnakeCase(data as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Diploma>(row);
      }),
    );
  }

  updateDiploma(id: number, data: Partial<Diploma>): Observable<Diploma> {
    const { id: _, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('diplomas')
        .update(toSnakeCase(rest))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Diploma>(row);
      }),
    );
  }

  deleteDiploma(id: number): Observable<void> {
    return from(this.supabase.client.from('diplomas').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getTechnologyById(id: number): Observable<Technology> {
    return from(this.supabase.client.from('tech_stack').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Technology not found'));
        return of(toCamelCase<Technology>(data));
      }),
    );
  }

  createTechnology(data: Omit<Technology, 'id'>): Observable<Technology> {
    return from(
      this.supabase.client
        .from('tech_stack')
        .insert(toSnakeCase(data as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Technology>(row);
      }),
    );
  }

  updateTechnology(id: number, data: Partial<Technology>): Observable<Technology> {
    const { id: _, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('tech_stack')
        .update(toSnakeCase(rest))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Technology>(row);
      }),
    );
  }

  deleteTechnology(id: number): Observable<void> {
    return from(this.supabase.client.from('tech_stack').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getHighlightById(id: number): Observable<Highlight> {
    return from(this.supabase.client.from('highlights').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('Highlight not found'));
        return of(toCamelCase<Highlight>(data));
      }),
    );
  }

  createHighlight(data: Omit<Highlight, 'id'>): Observable<Highlight> {
    return from(
      this.supabase.client
        .from('highlights')
        .insert(toSnakeCase(data as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Highlight>(row);
      }),
    );
  }

  updateHighlight(id: number, data: Partial<Highlight>): Observable<Highlight> {
    const { id: _, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('highlights')
        .update(toSnakeCase(rest))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<Highlight>(row);
      }),
    );
  }

  deleteHighlight(id: number): Observable<void> {
    return from(this.supabase.client.from('highlights').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }

  getWhatIDoById(id: number): Observable<WhatIDo> {
    return from(this.supabase.client.from('what_i_do').select('*').eq('id', id).single()).pipe(
      switchMap(({ data, error }) => {
        if (error || !data) return throwError(() => new Error('WhatIDo not found'));
        return of(toCamelCase<WhatIDo>(data));
      }),
    );
  }

  createWhatIDo(data: Omit<WhatIDo, 'id'>): Observable<WhatIDo> {
    return from(
      this.supabase.client
        .from('what_i_do')
        .insert(toSnakeCase(data as unknown as Record<string, unknown>))
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<WhatIDo>(row);
      }),
    );
  }

  updateWhatIDo(id: number, data: Partial<WhatIDo>): Observable<WhatIDo> {
    const { id: _, ...rest } = data as Record<string, unknown>;
    return from(
      this.supabase.client
        .from('what_i_do')
        .update(toSnakeCase(rest))
        .eq('id', id)
        .select()
        .single(),
    ).pipe(
      map(({ data: row, error }) => {
        if (error) throw error;
        return toCamelCase<WhatIDo>(row);
      }),
    );
  }

  deleteWhatIDo(id: number): Observable<void> {
    return from(this.supabase.client.from('what_i_do').delete().eq('id', id)).pipe(
      map(({ error }) => {
        if (error) throw error;
      }),
    );
  }
}
