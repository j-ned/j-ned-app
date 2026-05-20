import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, defer, map, of, type Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/api';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  WhatIDo,
  WhatISeek,
  SocialButton,
  ProfileGateway,
} from '../../domain';
import {
  STATIC_PROFILE_BASE,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_TECHNOLOGIES,
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_WHAT_I_DO,
  STATIC_WHAT_I_SEEK,
  STATIC_SOCIAL_BUTTONS,
} from '../data/profile.static-data';

@Injectable()
export class InMemoryProfileGateway implements ProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly apiBase = inject(API_BASE_URL);

  getProfileInfo(): Observable<ProfileInfo> {
    return this.http.get<ProfileInfo>(`${this.apiBase}/profile`).pipe(
      map((dto) => ({ ...STATIC_PROFILE_BASE, avatarUrl: dto.avatarUrl ?? '' })),
      catchError(() => of({ ...STATIC_PROFILE_BASE, avatarUrl: '' })),
    );
  }

  uploadAvatar(file: File): Observable<string> {
    const form = new FormData();
    form.append('avatar', file);
    return this.http
      .post<{ url: string }>(`${this.apiBase}/profile/avatar`, form)
      .pipe(map((response) => response.url));
  }

  getBiography(): Observable<Biography> {
    return defer(() => of(STATIC_BIOGRAPHY));
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return defer(() => of([...STATIC_DIPLOMAS]));
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return defer(() => of([...STATIC_TECHNOLOGIES]));
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return defer(() => of([...STATIC_ABOUT_HIGHLIGHTS]));
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return defer(() => of([...STATIC_WHAT_I_DO]));
  }

  getWhatISeek(): Observable<WhatISeek> {
    return defer(() => of(STATIC_WHAT_I_SEEK));
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return defer(() => of([...STATIC_SOCIAL_BUTTONS]));
  }
}
