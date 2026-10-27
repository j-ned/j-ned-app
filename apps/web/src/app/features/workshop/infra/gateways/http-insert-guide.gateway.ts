import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { API_BASE_URL } from '@shared/api/api-config';
import type { InsertGuide } from '../../domain/models/insert-guide.model';
import { toInsertGuide } from '../insert-guide.adapter';
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
}
