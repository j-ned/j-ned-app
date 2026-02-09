import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of } from 'rxjs';
import type { HomeGateway } from '../../domain';
import type { HeroData, Speciality, Tech } from '../../domain';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpHomeGateway implements HomeGateway {
  private readonly http = inject(HttpClient);

  getHeroData(): ResourceRef<HeroData> {
    return resource({
      loader: () =>
        fetch(`${API_BASE_URL}/heroData`)
          .then((res) => res.json() as Promise<HeroData[]>)
          .then((data) => data[0]),
    }) as ResourceRef<HeroData>;
  }

  getSpecialities(): Observable<readonly Speciality[]> {
    return this.http
      .get<Speciality[]>(`${API_BASE_URL}/specialities`)
      .pipe(catchError(() => of([])));
  }

  getTechStack(): Observable<readonly Tech[]> {
    return this.http.get<Tech[]>(`${API_BASE_URL}/techStack`).pipe(catchError(() => of([])));
  }
}
