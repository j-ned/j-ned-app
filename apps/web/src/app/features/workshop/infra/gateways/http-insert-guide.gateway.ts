import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import type { InsertGuide, InsertGuideDocument } from '../../domain/models/insert-guide.model';
import { toInsertGuide, toInsertGuideDocument } from '../insert-guide.adapter';
import type { InsertGuideDto } from '../insert-guide.types';

@Injectable({ providedIn: 'root' })
export class HttpInsertGuideGateway {
  private readonly _http = inject(HttpClient);
  private readonly _apiUrl = inject(API_BASE_URL);

  getGuide(): Observable<InsertGuide> {
    return this._http
      .get<InsertGuideDto>(`${this._apiUrl}/workshop-guide`)
      .pipe(map(toInsertGuide));
  }

  getDocument(): Observable<InsertGuideDocument> {
    return this._http
      .get<InsertGuideDto>(`${this._apiUrl}/workshop-guide`)
      .pipe(map(toInsertGuideDocument));
  }

  saveGuide(guide: InsertGuide, version: number): Observable<InsertGuideDocument> {
    return this._http
      .put<InsertGuideDto>(
        `${this._apiUrl}/workshop-guide`,
        { ...guide, version },
        { context: silentErrors() },
      )
      .pipe(map(toInsertGuideDocument));
  }
}
