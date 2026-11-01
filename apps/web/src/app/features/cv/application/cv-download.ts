import { Injectable, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError, map, of } from 'rxjs';
import { AnalyticsGateway } from '@features/analytics/domain/gateways/analytics.gateway';
import { CvGateway } from '../domain/gateways/cv.gateway';

@Injectable()
export class CvDownload {
  private readonly _gateway = inject(CvGateway);
  private readonly _analytics = inject(AnalyticsGateway);

  // toSignal : sous provideHttpClientTesting (requêtes hors stabilité), un resource() bloquerait whenStable avant la réponse.
  readonly url = toSignal(
    this._gateway.getCurrent().pipe(
      map((cv) => (cv ? this._gateway.getDownloadUrl() : null)),
      catchError(() => of(null)),
    ),
    { initialValue: null },
  );

  track(): void {
    this._analytics.trackCvDownload();
  }
}
