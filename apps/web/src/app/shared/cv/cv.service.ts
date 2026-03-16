import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { API_BASE_URL } from '../api';
import type { CvInfo } from '@features/admin/domain/models/cv.model';

@Injectable({ providedIn: 'root' })
export class CvService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${inject(API_BASE_URL)}/cv`;

  async upload(file: File): Promise<CvInfo> {
    const formData = new FormData();
    formData.append('file', file);
    return firstValueFrom(
      this.http.post<CvInfo>(`${this.baseUrl}/upload`, formData, { withCredentials: true }),
    );
  }

  async getCurrent(): Promise<CvInfo | null> {
    return firstValueFrom(this.http.get<CvInfo | null>(this.baseUrl, { withCredentials: true }));
  }

  async delete(): Promise<void> {
    return firstValueFrom(this.http.delete<void>(this.baseUrl, { withCredentials: true }));
  }

  getDownloadUrl(): string {
    return `${this.baseUrl}/download`;
  }
}
