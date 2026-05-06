import { inject, Injectable } from '@angular/core';
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
import { API_BASE_URL } from '@shared/api';

@Injectable()
export class HttpProfileGateway implements ProfileGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  getProfileInfo(): Observable<ProfileInfo> {
    return this.http.get<ProfileInfo>(`${this.apiUrl}/profile`);
  }

  getBiography(): Observable<Biography> {
    return this.http.get<Biography>(`${this.apiUrl}/biography`);
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return this.http
      .get<SocialButton[]>(`${this.apiUrl}/social-links`)
      .pipe(catchError(() => of([])));
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return this.http.get<Diploma[]>(`${this.apiUrl}/diplomas`).pipe(catchError(() => of([])));
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return this.http
      .get<Technology[]>(`${this.apiUrl}/technologies`)
      .pipe(catchError(() => of([])));
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return this.http.get<Highlight[]>(`${this.apiUrl}/highlights/profile`).pipe(catchError(() => of([])));
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return this.http.get<WhatIDo[]>(`${this.apiUrl}/expertises/offers`).pipe(catchError(() => of([])));
  }

  getWhatISeek(): Observable<WhatISeek> {
    return this.http.get<WhatISeek[]>(`${this.apiUrl}/expertises/seeks`).pipe(
      map((items) => items[0] ?? { id: '', title: '', description: '' }),
      catchError(() => of({ id: '', title: '', description: '' } as WhatISeek)),
    );
  }

  getProfileInfoForEdit(): Observable<ProfileInfo> {
    return this.http.get<ProfileInfo>(`${this.apiUrl}/profile`);
  }

  updateProfileInfo(data: Partial<ProfileInfo>): Observable<ProfileInfo> {
    return this.http.patch<ProfileInfo>(`${this.apiUrl}/profile`, data);
  }

  uploadAvatar(file: File): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<{ url: string }>(`${this.apiUrl}/profile/avatar`, formData)
      .pipe(map((res) => res.url));
  }

  getBiographyForEdit(): Observable<Biography> {
    return this.http.get<Biography>(`${this.apiUrl}/biography`);
  }

  updateBiography(data: Partial<Biography>): Observable<Biography> {
    return this.http.patch<Biography>(`${this.apiUrl}/biography`, data);
  }

  getWhatISeekForEdit(): Observable<WhatISeek> {
    return this.http
      .get<WhatISeek[]>(`${this.apiUrl}/aspiration`)
      .pipe(map((items) => items[0] ?? { id: '', title: '', description: '' }));
  }

  updateWhatISeek(data: Partial<WhatISeek>): Observable<WhatISeek> {
    if (data.id) {
      return this.http.patch<WhatISeek>(`${this.apiUrl}/aspiration/${data.id}`, data);
    }
    return this.http.post<WhatISeek>(`${this.apiUrl}/aspiration`, data);
  }

  getSocialButtonById(id: string): Observable<SocialButton> {
    return this.http.get<SocialButton>(`${this.apiUrl}/social-links/${id}`);
  }

  createSocialButton(data: Omit<SocialButton, 'id'>): Observable<SocialButton> {
    return this.http.post<SocialButton>(`${this.apiUrl}/social-links`, data);
  }

  updateSocialButton(id: string, data: Partial<SocialButton>): Observable<SocialButton> {
    return this.http.patch<SocialButton>(`${this.apiUrl}/social-links/${id}`, data);
  }

  deleteSocialButton(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/social-links/${id}`);
  }

  getDiplomaById(id: string): Observable<Diploma> {
    return this.http.get<Diploma>(`${this.apiUrl}/diplomas/${id}`);
  }

  createDiploma(data: Omit<Diploma, 'id'>): Observable<Diploma> {
    return this.http.post<Diploma>(`${this.apiUrl}/diplomas`, data);
  }

  updateDiploma(id: string, data: Partial<Diploma>): Observable<Diploma> {
    return this.http.patch<Diploma>(`${this.apiUrl}/diplomas/${id}`, data);
  }

  deleteDiploma(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/diplomas/${id}`);
  }

  getTechnologyById(id: string): Observable<Technology> {
    return this.http.get<Technology>(`${this.apiUrl}/technologies/${id}`);
  }

  createTechnology(data: Omit<Technology, 'id'>): Observable<Technology> {
    return this.http.post<Technology>(`${this.apiUrl}/technologies`, data);
  }

  updateTechnology(id: string, data: Partial<Technology>): Observable<Technology> {
    return this.http.patch<Technology>(`${this.apiUrl}/technologies/${id}`, data);
  }

  deleteTechnology(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/technologies/${id}`);
  }

  getHighlightById(id: string): Observable<Highlight> {
    return this.http.get<Highlight>(`${this.apiUrl}/highlights/profile/${id}`);
  }

  createHighlight(data: Omit<Highlight, 'id'>): Observable<Highlight> {
    return this.http.post<Highlight>(`${this.apiUrl}/highlights/profile`, data);
  }

  updateHighlight(id: string, data: Partial<Highlight>): Observable<Highlight> {
    return this.http.patch<Highlight>(`${this.apiUrl}/highlights/profile/${id}`, data);
  }

  deleteHighlight(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/highlights/profile/${id}`);
  }

  getWhatIDoById(id: string): Observable<WhatIDo> {
    return this.http.get<WhatIDo>(`${this.apiUrl}/expertises/${id}`);
  }

  createWhatIDo(data: Omit<WhatIDo, 'id'>): Observable<WhatIDo> {
    return this.http.post<WhatIDo>(`${this.apiUrl}/expertises`, data);
  }

  updateWhatIDo(id: string, data: Partial<WhatIDo>): Observable<WhatIDo> {
    return this.http.patch<WhatIDo>(`${this.apiUrl}/expertises/${id}`, data);
  }

  deleteWhatIDo(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/expertises/${id}`);
  }
}
