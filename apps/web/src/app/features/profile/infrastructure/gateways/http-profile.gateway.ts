import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
import type { ProfileGateway } from '../../domain/gateways';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../../domain/models';
import { API_BASE_URL } from '../../../../shared/api/api-config';

@Injectable()
export class HttpProfileGateway implements ProfileGateway {
  private readonly http = inject(HttpClient);

  getProfileInfo(): ResourceRef<ProfileInfo> {
    return resource({
      loader: () =>
        fetch(`${API_BASE_URL}/profile`)
          .then((res) => res.json() as Promise<ProfileInfo[]>)
          .then((data) => data[0]),
    }) as ResourceRef<ProfileInfo>;
  }

  getBiography(): ResourceRef<Biography> {
    return resource({
      loader: () =>
        fetch(`${API_BASE_URL}/biography`)
          .then((res) => res.json() as Promise<Biography[]>)
          .then((data) => data[0]),
    }) as ResourceRef<Biography>;
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return this.http
      .get<SocialButton[]>(`${API_BASE_URL}/socialButtons`)
      .pipe(catchError(() => of([])));
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return this.http.get<Diploma[]>(`${API_BASE_URL}/diplomas`).pipe(catchError(() => of([])));
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return this.http
      .get<Technology[]>(`${API_BASE_URL}/technologies`)
      .pipe(catchError(() => of([])));
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return this.http.get<Highlight[]>(`${API_BASE_URL}/highlights`).pipe(catchError(() => of([])));
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return this.http.get<WhatIDo[]>(`${API_BASE_URL}/whatIDo`).pipe(catchError(() => of([])));
  }

  getWhatISeek(): Observable<WhatISeek> {
    return this.http.get<WhatISeek[]>(`${API_BASE_URL}/whatISeek`).pipe(
      map((data) => data[0]),
      catchError(() => of({ description: '' } as WhatISeek)),
    );
  }
}
