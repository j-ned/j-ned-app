import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL, STORAGE_BASE_PATH } from '@shared/api/api-config';
import { ProfileGateway } from '../../domain/gateways/profile.gateway';
import type { ProfileContent, ProfileDocument } from '../../domain/models/profile-content.model';
import { toProfileDocument } from '../profile.adapter';
import type { ProfileDto } from '../profile.types';

@Injectable()
export class HttpProfileGateway extends ProfileGateway {
  private readonly _http = inject(HttpClient);
  private readonly _apiUrl = inject(API_BASE_URL);

  getProfile(): Observable<ProfileDocument> {
    return this._http
      .get<ProfileDto>(`${this._apiUrl}/profile`)
      .pipe(map((dto) => toProfileDocument(dto, STORAGE_BASE_PATH)));
  }

  saveProfile(content: ProfileContent, version: number): Observable<ProfileDocument> {
    return this._http
      .put<ProfileDto>(
        `${this._apiUrl}/profile`,
        { ...content, version },
        { context: silentErrors() },
      )
      .pipe(map((dto) => toProfileDocument(dto, STORAGE_BASE_PATH)));
  }

  uploadPortrait(file: File): Observable<ProfileDocument> {
    const formData = new FormData();
    formData.append('file', file);
    return this._http
      .post<ProfileDto>(`${this._apiUrl}/profile/portrait`, formData, { context: silentErrors() })
      .pipe(map((dto) => toProfileDocument(dto, STORAGE_BASE_PATH)));
  }

  removePortrait(): Observable<void> {
    return this._http
      .delete<void>(`${this._apiUrl}/profile/portrait`, { context: silentErrors() })
      .pipe(map(() => undefined));
  }
}
