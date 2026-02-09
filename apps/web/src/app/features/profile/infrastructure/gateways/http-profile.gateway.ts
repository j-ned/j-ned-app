import { inject, Injectable, resource, type ResourceRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, map, Observable, of } from 'rxjs';
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
      catchError(() => of({ id: 0, title: '', description: '' } as WhatISeek)),
    );
  }

  getProfileInfoForEdit(): Observable<ProfileInfo> {
    return this.http.get<ProfileInfo>(`${API_BASE_URL}/profile/1`);
  }

  updateProfileInfo(data: Partial<ProfileInfo>): Observable<ProfileInfo> {
    return this.http.patch<ProfileInfo>(`${API_BASE_URL}/profile/1`, data);
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string }>(`${API_BASE_URL}/profile/avatar`, formData)
      .pipe(map((res) => res.url));
  }

  getBiographyForEdit(): Observable<Biography> {
    return this.http.get<Biography>(`${API_BASE_URL}/biography/1`);
  }

  updateBiography(data: Partial<Biography>): Observable<Biography> {
    return this.http.patch<Biography>(`${API_BASE_URL}/biography/1`, data);
  }

  getWhatISeekForEdit(): Observable<WhatISeek> {
    return this.http.get<WhatISeek>(`${API_BASE_URL}/whatISeek/1`);
  }

  updateWhatISeek(data: Partial<WhatISeek>): Observable<WhatISeek> {
    return this.http.patch<WhatISeek>(`${API_BASE_URL}/whatISeek/1`, data);
  }

  getSocialButtonById(id: number): Observable<SocialButton> {
    return this.http.get<SocialButton>(`${API_BASE_URL}/socialButtons/${id}`);
  }

  createSocialButton(data: Omit<SocialButton, 'id'>): Observable<SocialButton> {
    return this.http.post<SocialButton>(`${API_BASE_URL}/socialButtons`, data);
  }

  updateSocialButton(id: number, data: Partial<SocialButton>): Observable<SocialButton> {
    return this.http.patch<SocialButton>(`${API_BASE_URL}/socialButtons/${id}`, data);
  }

  deleteSocialButton(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/socialButtons/${id}`);
  }

  getDiplomaById(id: number): Observable<Diploma> {
    return this.http.get<Diploma>(`${API_BASE_URL}/diplomas/${id}`);
  }

  createDiploma(data: Omit<Diploma, 'id'>): Observable<Diploma> {
    return this.http.post<Diploma>(`${API_BASE_URL}/diplomas`, data);
  }

  updateDiploma(id: number, data: Partial<Diploma>): Observable<Diploma> {
    return this.http.patch<Diploma>(`${API_BASE_URL}/diplomas/${id}`, data);
  }

  deleteDiploma(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/diplomas/${id}`);
  }

  getTechnologyById(id: number): Observable<Technology> {
    return this.http.get<Technology>(`${API_BASE_URL}/technologies/${id}`);
  }

  createTechnology(data: Omit<Technology, 'id'>): Observable<Technology> {
    return this.http.post<Technology>(`${API_BASE_URL}/technologies`, data);
  }

  updateTechnology(id: number, data: Partial<Technology>): Observable<Technology> {
    return this.http.patch<Technology>(`${API_BASE_URL}/technologies/${id}`, data);
  }

  deleteTechnology(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/technologies/${id}`);
  }

  getHighlightById(id: number): Observable<Highlight> {
    return this.http.get<Highlight>(`${API_BASE_URL}/highlights/${id}`);
  }

  createHighlight(data: Omit<Highlight, 'id'>): Observable<Highlight> {
    return this.http.post<Highlight>(`${API_BASE_URL}/highlights`, data);
  }

  updateHighlight(id: number, data: Partial<Highlight>): Observable<Highlight> {
    return this.http.patch<Highlight>(`${API_BASE_URL}/highlights/${id}`, data);
  }

  deleteHighlight(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/highlights/${id}`);
  }

  getWhatIDoById(id: number): Observable<WhatIDo> {
    return this.http.get<WhatIDo>(`${API_BASE_URL}/whatIDo/${id}`);
  }

  createWhatIDo(data: Omit<WhatIDo, 'id'>): Observable<WhatIDo> {
    return this.http.post<WhatIDo>(`${API_BASE_URL}/whatIDo`, data);
  }

  updateWhatIDo(id: number, data: Partial<WhatIDo>): Observable<WhatIDo> {
    return this.http.patch<WhatIDo>(`${API_BASE_URL}/whatIDo/${id}`, data);
  }

  deleteWhatIDo(id: number): Observable<void> {
    return this.http.delete<void>(`${API_BASE_URL}/whatIDo/${id}`);
  }
}
