import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { catchError, from, map, Observable, of } from 'rxjs';
import type { HomeGateway } from '../../domain';
import type { HeroData, Speciality, Tech } from '../../domain';
import { SupabaseClientService } from '../../../../shared/supabase/supabase-client';
import { toCamelCase } from '../../../../shared/supabase/column-mapper';

@Injectable()
export class SupabaseHomeGateway implements HomeGateway {
  private readonly supabase = inject(SupabaseClientService);

  getHeroData(): ResourceRef<HeroData> {
    return resource({
      loader: async () => {
        const { data, error } = await this.supabase.client
          .from('hero_data')
          .select('*')
          .limit(1)
          .single();
        if (error) throw error;
        return toCamelCase<HeroData>(data);
      },
    }) as ResourceRef<HeroData>;
  }

  getSpecialities(): Observable<readonly Speciality[]> {
    return from(this.supabase.client.from('specialities').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Speciality>(row));
      }),
      catchError(() => of([])),
    );
  }

  getTechStack(): Observable<readonly Tech[]> {
    return from(this.supabase.client.from('tech_stack').select('*')).pipe(
      map(({ data, error }) => {
        if (error) throw error;
        return (data ?? []).map((row) => toCamelCase<Tech>(row));
      }),
      catchError(() => of([])),
    );
  }
}
