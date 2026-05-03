import { InjectionToken } from '@angular/core';
import type { Observable } from 'rxjs';
import type { CvInfo } from '@features/admin/domain/models/cv.model';

export abstract class CvGateway {
  // Admin write-side (Observable, EAK convention)
  abstract upload(file: File): Observable<CvInfo>;
  abstract delete(): Observable<void>;

  // Public read-side
  abstract getCurrent(): Observable<CvInfo | null>;

  // Sync helper — pas de HTTP, retourne juste l'URL construite pour <a href>
  abstract getDownloadUrl(): string;
}

export const CV_GATEWAY = new InjectionToken<CvGateway>('CV_GATEWAY', {
  providedIn: 'root',
  factory: (): never => {
    throw new Error('CV_GATEWAY must be provided in app.config.ts');
  },
});
