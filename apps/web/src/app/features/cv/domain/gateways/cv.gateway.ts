import type { Observable } from 'rxjs';
import type { CvInfo } from '../models/cv.model';

export abstract class CvGateway {
  abstract upload(file: File): Observable<CvInfo>;
  abstract delete(): Observable<void>;
  abstract getCurrent(): Observable<CvInfo | null>;
  abstract getDownloadUrl(): string;
}
