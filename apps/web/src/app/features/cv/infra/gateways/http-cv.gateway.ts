import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '@shared/api';
import { CvGateway, type CvInfo } from '../../domain';

@Injectable()
export class HttpCvGateway extends CvGateway {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/cv`;

  upload(file: File): Observable<CvInfo> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<CvInfo>(`${this.baseUrl}/upload`, formData, {
      withCredentials: true,
    });
  }

  getCurrent(): Observable<CvInfo | null> {
    return this.http.get<CvInfo | null>(this.baseUrl, { withCredentials: true });
  }

  delete(): Observable<void> {
    return this.http.delete<void>(this.baseUrl, { withCredentials: true });
  }

  getDownloadUrl(): string {
    return `${this.baseUrl}/download`;
  }
}
