import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { map, type Observable } from 'rxjs';
import { silentErrors } from '@core/interceptors/skip-error-toast';
import { API_BASE_URL } from '@shared/api/api-config';
import type { LoginEventPage } from '../../domain/models/login-event.model';
import { toLoginEvent } from '../login-event.adapter';
import type { LoginEventsResponse } from '../login-event.types';

@Injectable({ providedIn: 'root' })
export class LoginJournalGateway {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = inject(API_BASE_URL);

  // Lue par l'admin seul, qui affiche son propre état d'erreur.
  getPage(page: number, limit: number): Observable<LoginEventPage> {
    return this.http
      .get<LoginEventsResponse>(`${this.apiUrl}/auth/login-events`, {
        params: { page, limit },
        context: silentErrors(),
      })
      .pipe(map(({ data, total }) => ({ events: data.map(toLoginEvent), total })));
  }
}
